import { NextRequest, NextResponse } from "next/server";
import { getRecentCommits } from "@/lib/github";
import { createJob, runAIAnalysisBackground } from "@/lib/jobs";
import { checkAndGetUsage, incrementUsage } from "@/lib/subscription";
import { requireAuth, apiError, apiSuccess, parseJsonBody, isAuthError } from "@/lib/api-utils";
import { z } from "zod";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const generateSchema = z.object({
  owner: z.string().min(1, "owner 파라미터가 필요합니다."),
  repo: z.string().min(1, "repo 파라미터가 필요합니다."),
  since: z.string().optional(),
  until: z.string().optional(),
  commitShas: z.array(z.string()).optional().default([]),
});

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

let ratelimit: Ratelimit | null = null;
if (redisUrl && redisToken) {
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(3, "1 m"),
    analytics: true,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { username, accessToken } = await requireAuth();

    if (ratelimit) {
      const { success } = await ratelimit.limit(`generate_${username}`);
      if (!success) {
        return apiError("요청이 너무 많습니다. 잠시 후 다시 시도해주세요.", 429);
      }
    } else {
      console.warn("Upstash Redis is not configured. Rate limiting is disabled.");
    }

    const usage = await checkAndGetUsage(username);
    if (usage.remaining <= 0) {
      return NextResponse.json(
        {
          error: `이번 달 AI 생성 횟수(${usage.monthlyLimit === 999999 ? "무제한" : usage.monthlyLimit}회)를 모두 사용했습니다. Pro 플랜으로 업그레이드하면 월 30회까지 사용할 수 있습니다.`,
          quota_exceeded: true,
          tier: usage.tier,
          used: usage.usageCount,
          limit: usage.monthlyLimit,
        },
        { status: 403 }
      );
    }

    const body = await parseJsonBody(request);
    const parsedData = generateSchema.safeParse(body);
    if (!parsedData.success) {
      return NextResponse.json(
        { error: "잘못된 파라미터 형식입니다.", details: parsedData.error.format() },
        { status: 400 }
      );
    }

    const { owner, repo, since, until, commitShas } = parsedData.data;

    let shas: string[] = commitShas || [];
    if (shas.length === 0) {
      const commits = await getRecentCommits(owner, repo, since, until, 10, accessToken);
      shas = commits.map((c) => c.sha);
    }

    if (shas.length === 0) {
      return apiError("분석할 커밋이 없습니다.", 400);
    }

    const job = await createJob(username, `${owner}/${repo}`, shas);

    await incrementUsage(username);

    runAIAnalysisBackground(job.id, owner, repo, shas, usage.tier).catch(console.error);

    return apiSuccess({
      success: true,
      jobId: job.id,
      message: "AI 분석 작업이 백그라운드에서 시작되었습니다.",
      remaining: usage.remaining - 1,
    });
  } catch (error: unknown) {
    if (isAuthError(error)) return apiError(error.message, 401);
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    console.error("Generate error:", error);
    return apiError(message, 500);
  }
}

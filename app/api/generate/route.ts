import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getRecentCommits } from "@/lib/github";
import { createJob, runAIAnalysisBackground } from "@/lib/jobs";
import { checkAndGetUsage, incrementUsage } from "@/lib/subscription";
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

// Upstash Redis 기반 Rate Limiter (유저당 1분에 최대 3회 요청 허용)
// UPSTASH_REDIS_REST_URL과 UPSTASH_REDIS_REST_TOKEN 환경변수가 필요합니다.
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
    const session = await auth();
    const username = session?.user?.username;

    if (!username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // --- Rate Limiting 시작 ---
    if (ratelimit) {
      const { success } = await ratelimit.limit(`generate_${username}`);
      if (!success) {
        return NextResponse.json(
          { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
          { status: 429 }
        );
      }
    } else {
      console.warn("Upstash Redis is not configured. Rate limiting is disabled.");
    }
    // --- Rate Limiting 끝 ---

    // --- 구독 Quota 체크 ---
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
    // --- Quota 체크 끝 ---

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "잘못된 요청 본문입니다." }, { status: 400 });
    }

    const parsedData = generateSchema.safeParse(body);
    if (!parsedData.success) {
      return NextResponse.json(
        { error: "잘못된 파라미터 형식입니다.", details: parsedData.error.format() },
        { status: 400 }
      );
    }

    const { owner, repo, since, until, commitShas } = parsedData.data;

    // 1. 커밋 목록 확정
    let shas: string[] = commitShas || [];
    if (shas.length === 0) {
      const { getToken } = await import("next-auth/jwt");
      const jwtToken = await getToken({ req: request, secret: process.env.AUTH_SECRET });
      const commits = await getRecentCommits(owner, repo, since, until, 10, jwtToken?.accessToken as string | undefined);
      shas = commits.map((c) => c.sha);
    }

    if (shas.length === 0) {
      return NextResponse.json(
        { error: "분석할 커밋이 없습니다." },
        { status: 400 }
      );
    }

    // 2. Job 생성
    const job = await createJob(username, `${owner}/${repo}`, shas);

    // 3. 사용량 증가
    await incrementUsage(username);

    // 4. 백그라운드 분석 시작 (await 하지 않음, 티어 정보 전달)
    runAIAnalysisBackground(job.id, owner, repo, shas, usage.tier).catch(console.error);

    // 5. 즉시 Job ID 반환 (남은 사용량 포함)
    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: "AI 분석 작업이 백그라운드에서 시작되었습니다.",
      remaining: usage.remaining - 1,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    console.error("Generate error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


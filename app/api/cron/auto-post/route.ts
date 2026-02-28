import { NextRequest, NextResponse } from "next/server";
import { getAutoModeUsers, getUnprocessedCommits, recordProcessedCommits } from "@/lib/settings";
import { getCommitDiff } from "@/lib/github";
import { analyzeCommits } from "@/lib/ai";
import { createPost, getLastPostDate } from "@/lib/posts";
import { checkAndGetUsage, incrementUsage, TIER_LIMITS } from "@/lib/subscription";
import { createJob, updateJobStatus } from "@/lib/jobs";
import { SubscriptionTier } from "@/lib/types";

const DAYS_7_MS = 7 * 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  // CRON_SECRET이 없으면 엔드포인트 자체를 비활성화
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("CRON_SECRET 환경변수가 설정되지 않았습니다.");
    return NextResponse.json({ error: "서버 설정 오류" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "인증 실패" }, { status: 401 });
  }

  try {
    const autoUsers = await getAutoModeUsers();

    if (autoUsers.length === 0) {
      return NextResponse.json({
        message: "자동 포스팅 대상 사용자가 없습니다.",
        processed: 0,
      });
    }

    const results: { username: string; repo: string; status: string; postId?: string }[] = [];

    for (const user of autoUsers) {
      // 사용자의 구독 상태 및 사용량 확인
      const usage = await checkAndGetUsage(user.github_username);
      const tier = usage.tier as SubscriptionTier;
      const tierLimits = TIER_LIMITS[tier];

      // 사용량 초과 시 해당 사용자 건너뜀
      if (usage.remaining <= 0) {
        results.push({ username: user.github_username, repo: "all", status: "quota_exceeded" });
        continue;
      }

      // Free 티어: auto_repos 최대 1개만 허용
      const eligibleRepos = tier === "free"
        ? user.auto_repos.slice(0, tierLimits.maxAutoRepos)
        : user.auto_repos;

      for (const repo of eligibleRepos) {
        try {
          // 레포 처리 전 다시 사용량 체크 (반복 실행 중 초과 방지)
          const currentUsage = await checkAndGetUsage(user.github_username);
          if (currentUsage.remaining <= 0) {
            results.push({ username: user.github_username, repo, status: "quota_exceeded" });
            break;
          }

          // auto_schedule이 weekly인 경우 마지막 포스트 날짜 확인
          // 크론은 매일 실행되지만 weekly 설정 사용자는 7일 이내 포스트가 있으면 건너뜀
          if (user.auto_schedule === "weekly") {
            const lastPostDate = await getLastPostDate(user.github_username, repo);
            if (lastPostDate && Date.now() - lastPostDate.getTime() < DAYS_7_MS) {
              results.push({ username: user.github_username, repo, status: "skipped_weekly_schedule" });
              continue;
            }
          }

          const unprocessed = await getUnprocessedCommits(
            user.github_username,
            repo,
            process.env.GITHUB_TOKEN || ""
          );

          if (unprocessed.length === 0) {
            results.push({ username: user.github_username, repo, status: "no_new_commits" });
            continue;
          }

          const shas = unprocessed.slice(0, 10).map((c) => c.sha);
          const [owner, repoName] = repo.split("/");

          const commitDiffs = await Promise.all(
            shas.map((sha) => getCommitDiff(owner, repoName, sha))
          );

          // Gemini 분석 (티어별 모델 사용)
          let analysisResult;
          try {
            analysisResult = await analyzeCommits(commitDiffs, repo, tier);
          } catch (aiError) {
            const errorMsg = aiError instanceof Error ? aiError.message : "알 수 없는 오류";
            console.error(`AI 분석 실패 (또는 포맷 불량) [${repo}]:`, aiError);
            // 실패 내역을 Jobs 테이블에 기록하여 사용자가 /jobs 페이지에서 확인 가능하게 함
            try {
              const failedJob = await createJob(user.github_username, repo, shas);
              await updateJobStatus(failedJob.id, "failed", undefined, `[자동 포스팅] AI 분석 실패: ${errorMsg}`);
            } catch (jobCreateError) {
              console.error("실패 Job 기록 중 오류:", jobCreateError);
            }
            results.push({ username: user.github_username, repo, status: "ai_analysis_failed" });
            continue;
          }

          // 사용량 증가
          await incrementUsage(user.github_username);

          // 자동 포스팅 뱃지를 위해 태그 추가
          const tags = [...(analysisResult.tags || []), "자동 포스팅"];

          const created = await createPost(analysisResult.title, analysisResult.content, {
            summary: analysisResult.summary,
            repo,
            commits: shas,
            tags,
            status: "published",
            author: user.github_username,
          });

          await recordProcessedCommits(user.github_username, repo, shas, created.id);

          results.push({
            username: user.github_username,
            repo,
            status: "success",
            postId: created.id,
          });
        } catch (repoError) {
          const errorMsg = repoError instanceof Error ? repoError.message : "알 수 없는 오류";
          console.error(`자동 포스팅 실패 [${user.github_username}/${repo}]:`, repoError);
          // 예상치 못한 오류도 Jobs 테이블에 기록
          try {
            const failedJob = await createJob(user.github_username, repo, []);
            await updateJobStatus(failedJob.id, "failed", undefined, `[자동 포스팅] 처리 중 오류: ${errorMsg}`);
          } catch (jobCreateError) {
            console.error("실패 Job 기록 중 오류:", jobCreateError);
          }
          results.push({ username: user.github_username, repo, status: "error" });
        }
      }
    }

    return NextResponse.json({
      message: "자동 포스팅 완료",
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("Cron 자동 포스팅 오류:", error);
    return NextResponse.json(
      { error: "자동 포스팅 처리 중 오류 발생" },
      { status: 500 }
    );
  }
}

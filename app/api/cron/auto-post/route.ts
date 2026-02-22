import { NextRequest, NextResponse } from "next/server";
import { getAutoModeUsers, getUnprocessedCommits, recordProcessedCommits } from "@/lib/settings";
import { getCommitDiff } from "@/lib/github";
import { analyzeCommits } from "@/lib/ai";
import { createPost } from "@/lib/posts";

export async function GET(request: NextRequest) {
  // Vercel Cron 보안 검증
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "인증 실패" }, { status: 401 });
  }

  try {
    // 자동 모드 설정된 모든 사용자 조회
    const autoUsers = await getAutoModeUsers();

    if (autoUsers.length === 0) {
      return NextResponse.json({
        message: "자동 포스팅 대상 사용자가 없습니다.",
        processed: 0,
      });
    }

    const results: { username: string; repo: string; status: string; postId?: string }[] = [];

    for (const user of autoUsers) {
      for (const repo of user.auto_repos) {
        try {
          // 미처리 커밋 조회 — Cron에서는 서버 토큰 사용
          // 참고: 사용자별 토큰이 필요하면 user_settings에 토큰을 저장해야 함
          // 현재는 서버 GITHUB_TOKEN을 사용 (환경 변수)
          const unprocessed = await getUnprocessedCommits(
            user.github_username,
            repo,
            process.env.GITHUB_TOKEN || ""
          );

          if (unprocessed.length === 0) {
            results.push({
              username: user.github_username,
              repo,
              status: "no_new_commits",
            });
            continue;
          }

          // 최대 10개 커밋만 처리
          const commitsToProcess = unprocessed.slice(0, 10);
          const shas = commitsToProcess.map((c) => c.sha);
          const [owner, repoName] = repo.split("/");

          // 각 커밋의 diff 조회
          const commitDiffs = await Promise.all(
            shas.map((sha) => getCommitDiff(owner, repoName, sha))
          );

          // AI 분석
          const analysisResult = await analyzeCommits(commitDiffs, repo);

          // draft 상태로 포스트 저장
          const created = await createPost(analysisResult.title, analysisResult.content, {
            summary: analysisResult.summary,
            repo,
            commits: shas,
            tags: analysisResult.tags,
            status: "draft",
            author: user.github_username,
          });

          // 처리된 커밋 기록
          await recordProcessedCommits(user.github_username, repo, shas, created.id);

          results.push({
            username: user.github_username,
            repo,
            status: "success",
            postId: created.id,
          });
        } catch (repoError) {
          console.error(
            `자동 포스팅 실패 [${user.github_username}/${repo}]:`,
            repoError
          );
          results.push({
            username: user.github_username,
            repo,
            status: "error",
          });
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

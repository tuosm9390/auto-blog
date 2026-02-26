import { NextRequest, NextResponse } from "next/server";
import { getAutoModeUsers, getUnprocessedCommits, recordProcessedCommits } from "@/lib/settings";
import { getCommitDiff } from "@/lib/github";
import { analyzeCommits } from "@/lib/ai";
import { createPost } from "@/lib/posts";

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
      for (const repo of user.auto_repos) {
        try {
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

          // Gemini 분석
          let analysisResult;
          try {
            analysisResult = await analyzeCommits(commitDiffs, repo);
          } catch (aiError) {
            console.error(`AI 분석 실패 (또는 포맷 불량) [${repo}]:`, aiError);
            results.push({ username: user.github_username, repo, status: "ai_analysis_failed" });
            // AI 분석에 실패했으므로 커밋을 '사용됨'으로 기록하지 않고 다음 레포로 넘어갑니다.
            continue; 
          }

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
          console.error(`자동 포스팅 실패 [${user.github_username}/${repo}]:`, repoError);
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

import { NextRequest, NextResponse } from "next/server";
import { getRecentCommits, getCommitDiff } from "@/lib/github";
import { analyzeCommits } from "@/lib/ai";
import { createPost } from "@/lib/posts";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { owner, repo, since, until, commitShas, publish } = body;

    if (!owner || !repo) {
      return NextResponse.json(
        { error: "owner와 repo 파라미터가 필요합니다." },
        { status: 400 }
      );
    }

    // 1. 커밋 목록 가져오기
    let shas: string[] = commitShas || [];

    if (shas.length === 0) {
      const commits = await getRecentCommits(owner, repo, since, until, 10);
      shas = commits.map((c) => c.sha);
    }

    if (shas.length === 0) {
      return NextResponse.json(
        { error: "분석할 커밋이 없습니다." },
        { status: 400 }
      );
    }

    // 2. 각 커밋의 diff 가져오기
    const commitDiffs = await Promise.all(
      shas.slice(0, 10).map((sha) => getCommitDiff(owner, repo, sha))
    );

    // 3. AI 분석
    const repoFullName = `${owner}/${repo}`;
    const result = await analyzeCommits(commitDiffs, repoFullName);

    // 4. 게시 여부에 따라 저장
    let id: string | null = null;
    if (publish) {
      id = await createPost(result.title, result.content, {
        summary: result.summary,
        repo: repoFullName,
        commits: result.commits,
        tags: result.tags,
      });
    }

    return NextResponse.json({
      ...result,
      id,
      published: !!publish,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "알 수 없는 오류";
    console.error("Generate error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

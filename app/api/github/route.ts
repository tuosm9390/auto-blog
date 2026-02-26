import { NextRequest, NextResponse } from "next/server";
import { getRecentCommits } from "@/lib/github";
import { getProcessedCommitShas } from "@/lib/settings";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  // 인증된 사용자만 커밋 조회 가능 — 서버 GITHUB_TOKEN의 rate limit 보호
  const session = await auth();
  if (!session?.user?.username) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  const since = searchParams.get("since") || undefined;
  const until = searchParams.get("until") || undefined;

  if (!owner || !repo) {
    return NextResponse.json(
      { error: "owner와 repo 파라미터가 필요합니다." },
      { status: 400 }
    );
  }

  try {
    // 사용자 OAuth 토큰 우선 사용 (private repo 접근 + 개인 rate limit)
    const token = session.accessToken;
    const commits = await getRecentCommits(owner, repo, since, until, 30, token);
    
    // 이미 분석에 사용된 커밋 목록도 가져옴
    const processedShas = await getProcessedCommitShas(session.user.username, `${owner}/${repo}`);
    
    return NextResponse.json({ commits, processedShas });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

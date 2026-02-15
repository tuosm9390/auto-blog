import { NextRequest, NextResponse } from "next/server";
import { getRecentCommits } from "@/lib/github";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
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
    const session = await auth();
    // @ts-expect-error accessToken type
    const token = session?.accessToken as string | undefined;

    const commits = await getRecentCommits(owner, repo, since, until, 30, token);
    return NextResponse.json({ commits });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

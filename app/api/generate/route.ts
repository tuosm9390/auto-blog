import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getRecentCommits } from "@/lib/github";
import { createJob, runAIAnalysisBackground } from "@/lib/jobs";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();
    const { owner, repo, since, until, commitShas } = body;
    const username = session?.user?.username;

    if (!username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!owner || !repo) {
      return NextResponse.json(
        { error: "owner와 repo 파라미터가 필요합니다." },
        { status: 400 }
      );
    }

    // 1. 커밋 목록 확정
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

    // 2. Job 생성
    const job = await createJob(username, `${owner}/${repo}`, shas);

    // 3. 백그라운드 분석 시작 (await 하지 않음)
    // Next.js (Node.js) 환경에서 응답 반환 후에도 프로세스가 유지되도록 함
    // Vercel 환경에서는 request.waitUntil()을 사용하는 것이 권장되지만, 여기선 기본 구현
    runAIAnalysisBackground(job.id, owner, repo, shas, username).catch(console.error);

    // 4. 즉시 Job ID 반환
    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: "AI 분석 작업이 백그라운드에서 시작되었습니다."
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    console.error("Generate error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

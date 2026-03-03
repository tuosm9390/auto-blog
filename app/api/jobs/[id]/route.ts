import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getJobById, deleteJob } from "@/lib/jobs";
import { decrementUsage } from "@/lib/subscription";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const job = await getJobById(id);
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    // 본인 작업인지 확인
    if (job.github_username !== session.user.username) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ job });
  } catch {
    return NextResponse.json({ error: "Fetch error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const job = await getJobById(id);
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    if (job.github_username !== session.user.username) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // 분석 미완료(pending/processing) 상태에서 취소 시 사용량 롤백
    // completed/failed는 이미 분석이 끝난 것이므로 차감 유지
    if (job.status === "pending" || job.status === "processing") {
      await decrementUsage(job.github_username);
    }

    await deleteJob(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Delete error" }, { status: 500 });
  }
}

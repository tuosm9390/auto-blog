import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getJobById, deleteJob } from "@/lib/jobs";

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
  } catch (error) {
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

    await deleteJob(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Delete error" }, { status: 500 });
  }
}

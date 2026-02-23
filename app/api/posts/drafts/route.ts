import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDraftsByAuthor, publishDraft, deletePost, getPostById } from "@/lib/posts";
import { deleteJob } from "@/lib/jobs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.username) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const drafts = await getDraftsByAuthor(session.user.username);
  return NextResponse.json({ drafts });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.username) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, postId } = body;

    if (!postId) {
      return NextResponse.json({ error: "postId가 필요합니다." }, { status: 400 });
    }

    if (action === "publish") {
      const post = await getPostById(postId);
      const success = await publishDraft(postId);
      if (!success) {
        return NextResponse.json({ error: "게시 실패" }, { status: 500 });
      }
      // 해당 포스트에 연동된 작업 내역이 있다면 삭제 처리 (백업용)
      if (post?.jobId) {
        await deleteJob(post.jobId).catch((err: any) => console.error("Job cleanup error on publish:", err));
      }
      return NextResponse.json({ message: "게시 완료", postId });
    }

    if (action === "delete") {
      const post = await getPostById(postId);
      const success = await deletePost(postId);
      if (!success) {
        return NextResponse.json({ error: "삭제 실패" }, { status: 500 });
      }
      // 해당 포스트에 연동된 작업 내역이 있다면 삭제 처리 (백업용)
      if (post?.jobId) {
        await deleteJob(post.jobId).catch((err: any) => console.error("Job cleanup error on post delete:", err));
      }
      return NextResponse.json({ message: "삭제 완료", postId });
    }

    return NextResponse.json({ error: "유효하지 않은 action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "처리 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

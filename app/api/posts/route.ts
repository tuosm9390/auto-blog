import { NextRequest, NextResponse } from "next/server";
import { getAllPosts, createPost, deletePost } from "@/lib/posts";
import { deleteJob } from "@/lib/jobs";
import { auth } from "@/auth";

export async function GET() {
  try {
    const posts = await getAllPosts();
    return NextResponse.json({ posts });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, content, summary, repo, commits, tags, status, jobId } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "title과 content가 필요합니다." },
        { status: 400 }
      );
    }

    // author는 반드시 세션의 GitHub username만 사용 (name 폴백 제거)
    const author = session.user.username;
    if (!author) {
      return NextResponse.json({ error: "사용자 정보를 확인할 수 없습니다." }, { status: 401 });
    }

    const { id, slug } = await createPost(title, content, {
      summary: summary || "",
      repo: repo || "",
      commits: commits || [],
      tags: tags || [],
      status: status || "published",
      author,
    });

    if (jobId) {
      await deleteJob(jobId).catch(err => console.error("Job cleanup error:", err));
    }

    return NextResponse.json({ id, slug, message: "포스트가 생성되었습니다." });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  // 인증 확인
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json(
      { error: "slug 파라미터가 필요합니다." },
      { status: 400 }
    );
  }

  const deleted = await deletePost(slug);
  if (!deleted) {
    return NextResponse.json(
      { error: "포스트를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  return NextResponse.json({ message: "포스트가 삭제되었습니다." });
}

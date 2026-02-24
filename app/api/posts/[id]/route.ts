import { NextRequest, NextResponse } from "next/server";
import { getPostById, deletePost, updatePost } from "@/lib/posts";
import { auth } from "@/auth";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteProps
) {
  const session = await auth();
  if (!session?.user?.username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // 소유권 확인: 로그인한 사용자가 이 포스트의 작성자인지 검증
  const post = await getPostById(id);
  if (!post) {
    return NextResponse.json({ error: "포스트를 찾을 수 없습니다." }, { status: 404 });
  }
  if (post.author !== session.user.username) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const success = await deletePost(id);
  if (success) {
    return NextResponse.json({ success: true });
  } else {
    return NextResponse.json({ error: "삭제 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteProps
) {
  const session = await auth();
  if (!session?.user?.username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // 소유권 확인
  const post = await getPostById(id);
  if (!post) {
    return NextResponse.json({ error: "포스트를 찾을 수 없습니다." }, { status: 404 });
  }
  if (post.author !== session.user.username) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { title: string; content: string; summary: string; repo: string; commits: string[]; tags: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 본문이 올바르지 않습니다." }, { status: 400 });
  }

  const success = await updatePost(id, body.title, body.content, {
    summary: body.summary,
    repo: body.repo,
    commits: body.commits,
    tags: body.tags,
  });

  if (success) {
    return NextResponse.json({ success: true });
  } else {
    return NextResponse.json({ error: "업데이트 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}

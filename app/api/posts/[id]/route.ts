import { NextRequest, NextResponse } from "next/server";
import { getPostById, deletePost, updatePost } from "@/lib/posts";
import { auth } from "@/auth";
import { z } from "zod";

const updatePostSchema = z.object({
  title: z.string().min(1, "제목은 필수입니다."),
  content: z.string().min(1, "내용은 필수입니다."),
  summary: z.string().optional().default(""),
  repo: z.string().optional().default(""),
  commits: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
});

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

  const success = await deletePost(id, session.user.username);
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

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 본문이 올바르지 않습니다." }, { status: 400 });
  }

  const parsedData = updatePostSchema.safeParse(body);
  if (!parsedData.success) {
    return NextResponse.json(
      { error: "잘못된 입력값입니다.", details: parsedData.error.format() },
      { status: 400 }
    );
  }

  const { title, content, summary, repo, commits, tags } = parsedData.data;

  const success = await updatePost(id, title, content, {
    summary,
    repo,
    commits,
    tags,
  });

  if (success) {
    return NextResponse.json({ success: true });
  } else {
    return NextResponse.json({ error: "업데이트 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}

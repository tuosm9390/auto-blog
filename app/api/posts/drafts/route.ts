import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDraftsByAuthor, getPostById, publishDraft, deletePost } from "@/lib/posts";
import { z } from "zod";

const draftActionSchema = z.object({
  action: z.enum(["publish", "delete"], {
    errorMap: () => ({ message: "액션은 'publish' 또는 'delete' 여야 합니다." }),
  }),
  postId: z.string().min(1, "postId가 필요합니다."),
});

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
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "잘못된 요청 본문입니다." }, { status: 400 });
    }

    const parsedData = draftActionSchema.safeParse(body);
    if (!parsedData.success) {
      return NextResponse.json(
        { error: "잘못된 입력값입니다.", details: parsedData.error.format() },
        { status: 400 }
      );
    }

    const { action, postId } = parsedData.data;

    // 소유권 확인: postId의 작성자가 현재 사용자인지 검증
    const post = await getPostById(postId);
    if (!post) {
      return NextResponse.json({ error: "포스트를 찾을 수 없습니다." }, { status: 404 });
    }
    if (post.author !== session.user.username) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (action === "publish") {
      const success = await publishDraft(postId);
      if (!success) {
        return NextResponse.json({ error: "게시 실패" }, { status: 500 });
      }
      return NextResponse.json({ message: "게시 완료", postId });
    }

    if (action === "delete") {
      const success = await deletePost(postId, session.user.username);
      if (!success) {
        return NextResponse.json({ error: "삭제 실패" }, { status: 500 });
      }
      return NextResponse.json({ message: "삭제 완료", postId });
    }

    return NextResponse.json({ error: "유효하지 않은 action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "처리 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

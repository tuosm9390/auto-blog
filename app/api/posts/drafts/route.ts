import { NextRequest } from "next/server";
import { getDraftsByAuthor, publishDraft, deletePost } from "@/lib/posts";
import { requireAuth, requirePostOwnership, apiError, apiSuccess, parseJsonBody, isAuthError } from "@/lib/api-utils";
import { z } from "zod";

const draftActionSchema = z.object({
  action: z.enum(["publish", "delete"]),
  postId: z.string().min(1, "postId가 필요합니다."),
});

export async function GET() {
  try {
    const { username } = await requireAuth();
    const drafts = await getDraftsByAuthor(username);
    return apiSuccess({ drafts });
  } catch (error: unknown) {
    if (isAuthError(error)) return apiError(error.message, 401);
    return apiError("서버 오류가 발생했습니다.", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { username } = await requireAuth();
    const body = await parseJsonBody(request);

    const parsedData = draftActionSchema.safeParse(body);
    if (!parsedData.success) {
      return apiError("잘못된 입력값입니다.", 400);
    }

    const { action, postId } = parsedData.data;

    await requirePostOwnership(postId, username);

    if (action === "publish") {
      const success = await publishDraft(postId, username);
      if (!success) return apiError("게시 실패", 500);
      return apiSuccess({ message: "게시 완료", postId });
    }

    if (action === "delete") {
      const success = await deletePost(postId, username);
      if (!success) return apiError("삭제 실패", 500);
      return apiSuccess({ message: "삭제 완료", postId });
    }

    return apiError("유효하지 않은 action", 400);
  } catch (error: unknown) {
    if (isAuthError(error)) return apiError(error.message, error.message === "권한이 없습니다." ? 403 : 401);
    return apiError("서버 오류가 발생했습니다.", 500);
  }
}


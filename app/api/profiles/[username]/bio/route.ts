import { NextRequest } from "next/server";
import { updateBio } from "@/lib/profiles";
import { requireAuth, apiError, apiSuccess, parseJsonBody, isAuthError } from "@/lib/api-utils";
import { z } from "zod";

const bioSchema = z.object({
  bio: z.string().max(300, "bio는 300자 이하여야 합니다."),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  try {
    const { username: authUser } = await requireAuth();
    const { username } = await params;

    if (authUser !== username) {
      return apiError("권한이 없습니다.", 403);
    }

    const body = await parseJsonBody(req);
    const parsedData = bioSchema.safeParse(body);
    
    if (!parsedData.success) {
      return apiError(parsedData.error.issues[0]?.message || "잘못된 입력값입니다.", 400);
    }

    const success = await updateBio(username, parsedData.data.bio);

    if (!success) {
      return apiError("서버 오류가 발생했습니다.", 500);
    }

    return apiSuccess({ success: true });
  } catch (error: unknown) {
    console.error("Bio update error:", error);
    if (isAuthError(error)) return apiError(error.message, 401);
    return apiError("서버 오류가 발생했습니다.", 500);
  }
}

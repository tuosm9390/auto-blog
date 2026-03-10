import { requireAuth, apiError, apiSuccess, isAuthError } from "@/lib/api-utils";
import { getProfileByUsername } from "@/lib/profiles";
import { createPortalSession } from "@/lib/billing";

export async function POST() {
  try {
    const { session, username } = await requireAuth();

    const profile = await getProfileByUsername(username);
    if (!profile) {
      return apiError("프로필을 찾을 수 없습니다.", 404);
    }

    const portalSession = await createPortalSession(session, profile);
    return apiSuccess({ url: portalSession.url });
  } catch (error: unknown) {
    console.error("Stripe Portal Error:", error);
    if (isAuthError(error)) return apiError(error.message, 401);
    const message = error instanceof Error ? error.message : "구독 관리 포털을 여는 중 오류가 발생했습니다.";
    return apiError(message, error instanceof Error && error.message.includes("활성 구독이") ? 400 : 500);
  }
}

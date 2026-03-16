import { requireAuth, apiError, apiSuccess, isAuthError } from "@/lib/api-utils";
import { checkAndGetUsage, TIER_LIMITS } from "@/lib/subscription";
import { cancelSubscription } from "@/lib/billing";

export async function GET() {
  try {
    const { username } = await requireAuth();

    const usage = await checkAndGetUsage(username);

    return apiSuccess({
      tier: usage.tier,
      usageCount: usage.usageCount,
      monthlyLimit: usage.monthlyLimit,
      remaining: usage.remaining,
      resetDate: usage.resetDate,
      limits: TIER_LIMITS[usage.tier],
    });
  } catch (error: unknown) {
    console.error("Subscription API Error:", error);
    if (isAuthError(error)) return apiError(error.message, 401);
    return apiError("구독 정보를 불러오는 중 오류가 발생했습니다.", 500);
  }
}

export async function DELETE() {
  try {
    const { username } = await requireAuth();

    await cancelSubscription(username);

    return apiSuccess({ success: true });
  } catch (error: unknown) {
    console.error("구독 취소 실패:", error);
    if (isAuthError(error)) return apiError(error.message, 401);
    return apiError("구독 취소 중 오류가 발생했습니다.", 500);
  }
}

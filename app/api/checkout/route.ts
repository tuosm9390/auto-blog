import { requireAuth, apiError, apiSuccess, parseJsonBody, isAuthError } from "@/lib/api-utils";
import { getProfileByUsername } from "@/lib/profiles";
import { createCheckoutSession } from "@/lib/billing";
import { z } from "zod";

const checkoutSchema = z.object({
  tier: z.string().min(1),
  cycle: z.enum(["monthly", "yearly"]),
});

export async function POST(req: Request) {
  try {
    const { session, username } = await requireAuth();

    const body = await parseJsonBody(req);
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Tier and cycle parameters are required or invalid.", 400);
    }
    const { tier, cycle } = parsed.data;

    const profile = await getProfileByUsername(username);
    if (!profile) {
      return apiError("프로필을 찾을 수 없습니다.", 404);
    }

    const checkoutSession = await createCheckoutSession(session, profile, tier, cycle);
    return apiSuccess({ url: checkoutSession.url });
  } catch (error: unknown) {
    console.error("Stripe Checkout Error:", error);
    if (isAuthError(error)) return apiError(error.message, 401);
    const message = error instanceof Error ? error.message : "결제 세션을 생성하는 중 오류가 발생했습니다.";
    return apiError(message, 500);
  }
}

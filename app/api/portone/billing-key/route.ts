import { NextRequest, NextResponse } from "next/server";
import { requireAuth, apiError } from "@/lib/api-utils";
import { saveBillingKeyAndCharge } from "@/lib/portone-billing";

export async function POST(req: NextRequest) {
  try {
    const { username } = await requireAuth();

    const body = await req.json();
    const { billingKey, tier, cycle } = body;

    if (!billingKey || typeof billingKey !== "string") {
      return apiError("billingKey가 필요합니다.", 400);
    }
    if (!tier || !["pro", "business"].includes(tier)) {
      return apiError("유효하지 않은 요금제입니다.", 400);
    }
    if (!cycle || !["monthly", "yearly"].includes(cycle)) {
      return apiError("유효하지 않은 결제 주기입니다.", 400);
    }

    const result = await saveBillingKeyAndCharge(
      username,
      billingKey,
      tier,
      cycle as "monthly" | "yearly",
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "결제 처리 중 오류가 발생했습니다.";
    console.error("Billing key charge error:", message);
    return apiError(message, 500);
  }
}

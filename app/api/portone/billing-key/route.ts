import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, apiError } from "@/lib/api-utils";
import { saveBillingKeyAndCharge } from "@/lib/portone-billing";

const billingKeySchema = z.object({
  billingKey: z.string().min(1, "billingKey가 필요합니다."),
  tier: z.enum(["pro", "business"], { message: "유효하지 않은 요금제입니다." }),
  cycle: z.enum(["monthly", "yearly"], { message: "유효하지 않은 결제 주기입니다." }),
});

export async function POST(req: NextRequest) {
  try {
    const { username } = await requireAuth();

    const body = await req.json();
    const parsed = billingKeySchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 400);
    }
    const { billingKey, tier, cycle } = parsed.data;

    const result = await saveBillingKeyAndCharge(
      username,
      billingKey,
      tier,
      cycle as "monthly" | "yearly",
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    console.error("Billing key charge error (full):", JSON.stringify(error, null, 2));
    return apiError("결제 처리 중 오류가 발생했습니다. 카드 정보를 확인하거나 다른 카드를 사용해주세요.", 500);
  }
}

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkAndGetUsage, TIER_LIMITS } from "@/lib/subscription";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.username) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const usage = await checkAndGetUsage(session.user.username);

    return NextResponse.json({
      tier: usage.tier,
      usageCount: usage.usageCount,
      monthlyLimit: usage.monthlyLimit,
      remaining: usage.remaining,
      resetDate: usage.resetDate,
      limits: TIER_LIMITS[usage.tier],
    });
  } catch (error: any) {
    console.error("Subscription API Error:", error);
    return NextResponse.json(
      { error: "구독 정보를 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

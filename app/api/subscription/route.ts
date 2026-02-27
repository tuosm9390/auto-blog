import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import { checkAndGetUsage, TIER_LIMITS } from "@/lib/subscription";
import { supabaseAdmin } from "@/lib/supabase-admin";

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
  } catch (error: unknown) {
    console.error("Subscription API Error:", error);
    return NextResponse.json(
      { error: "구독 정보를 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 🔧 이슈 3 수정: Stripe 실제 구독 취소 로직 추가
export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.username) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    // DB에서 사용자의 stripe_customer_id 조회
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("username", session.user.username)
      .single();

    // Stripe에서 실제 구독 취소
    if (profile?.stripe_customer_id) {
      const subscriptions = await stripe.subscriptions.list({
        customer: profile.stripe_customer_id,
        status: "active",
        limit: 10,
      });

      // 모든 활성 구독을 취소
      for (const sub of subscriptions.data) {
        await stripe.subscriptions.cancel(sub.id);
        console.log(`Stripe 구독 취소 완료: ${sub.id} (customer: ${profile.stripe_customer_id})`);
      }
    }

    // DB 상태 업데이트 (🔧 이슈 1: supabaseAdmin 사용)
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        subscription_tier: "free",
        subscription_status: "canceled",
        stripe_customer_id: null,
      })
      .eq("username", session.user.username);

    if (error) {
      console.error("구독 취소 DB 업데이트 실패:", error);
      return NextResponse.json({ error: "구독 취소에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("구독 취소 실패:", error);
    return NextResponse.json(
      { error: "구독 취소 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

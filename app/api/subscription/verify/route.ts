import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Checkout 성공 후 session_id로 결제를 직접 검증하여 DB에 반영
// Webhook이 실패하더라도 이 경로로 구독이 정상 처리됨
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.username) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { sessionId } = await req.json();
  if (!sessionId) {
    return NextResponse.json({ error: "session_id가 필요합니다." }, { status: 400 });
  }

  // Stripe에서 Checkout 세션 조회
  const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

  // 이 세션이 현재 로그인한 사용자 것인지 검증
  const usernameInMeta = checkoutSession.metadata?.username;
  if (usernameInMeta !== session.user.username) {
    return NextResponse.json({ error: "세션 소유자가 일치하지 않습니다." }, { status: 403 });
  }

  // 결제 완료 상태가 아니면 처리 안 함
  if (checkoutSession.payment_status !== "paid") {
    return NextResponse.json({ error: "결제가 완료되지 않았습니다." }, { status: 400 });
  }

  // 🔧 이슈 2 수정: metadata에서 실제 구매 tier 읽기
  const purchasedTier = checkoutSession.metadata?.tier || "pro";

  // 이미 해당 tier면 중복 처리 불필요
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("subscription_tier")
    .eq("username", session.user.username)
    .single();

  if (profile?.subscription_tier === purchasedTier) {
    return NextResponse.json({ alreadyUpdated: true });
  }

  // DB 업데이트
  const customerId = checkoutSession.customer as string;
  const nextResetDate = new Date();
  nextResetDate.setMonth(nextResetDate.getMonth() + 1);

  // 🔧 이슈 1 수정: supabaseAdmin 사용 (RLS 우회)
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      stripe_customer_id: customerId,
      subscription_tier: purchasedTier,
      subscription_status: "active",
      usage_count_month: 0,
      usage_reset_date: nextResetDate.toISOString(),
    })
    .eq("username", session.user.username);

  if (error) {
    console.error("verify: DB 업데이트 실패", error);
    return NextResponse.json({ error: "구독 반영 중 오류가 발생했습니다." }, { status: 500 });
  }

  console.log(`verify: ${session.user.username} → ${purchasedTier} 승격 완료`);
  return NextResponse.json({ success: true });
}

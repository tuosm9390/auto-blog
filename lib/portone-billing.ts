import { PaymentClient } from "@portone/server-sdk";
import { getNextResetDate, TIER_LIMITS } from "@/lib/subscription";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { SubscriptionTier } from "@/lib/types";

const paymentClient = PaymentClient({
  secret: process.env.PORTONE_API_SECRET!,
});

function getOrderName(tier: string, cycle: string): string {
  const tierName = tier === "pro" ? "Pro" : "Business";
  const cycleName = cycle === "monthly" ? "월간" : "연간";
  return `Synapso ${tierName} ${cycleName} 구독`;
}

export async function saveBillingKeyAndCharge(
  username: string,
  billingKey: string,
  tier: string,
  cycle: "monthly" | "yearly",
) {
  if (!username) throw new Error("username이 필요합니다.");

  const amount = TIER_LIMITS[tier as SubscriptionTier]?.price[cycle];
  if (!amount) throw new Error("유효하지 않은 요금제입니다.");

  const paymentId = `${username}-init-${Date.now()}`;

  // 1. 첫 결제 실행
  await paymentClient.payWithBillingKey({
    paymentId,
    billingKey,
    orderName: getOrderName(tier, cycle),
    amount: { total: amount },
    currency: "KRW",
    customer: { id: username },
  });

  // 2. 결제 이벤트 기록 (멱등성)
  await supabaseAdmin
    .from("payment_events")
    .upsert(
      { id: paymentId, type: "subscription.activated", username, amount },
      { onConflict: "id", ignoreDuplicates: true },
    );

  // 3. 프로필 업데이트
  const nextResetDate = getNextResetDate();
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      subscription_tier: tier,
      subscription_status: "active",
      portone_billing_key: billingKey,
      billing_cycle: cycle,
      usage_count_month: 0,
      usage_reset_date: nextResetDate.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("username", username);

  if (error) throw error;
  return { username, tier };
}

export async function chargeWithBillingKey(
  username: string,
  billingKey: string,
  tier: string,
  cycle: "monthly" | "yearly",
) {
  if (!username) throw new Error("username이 필요합니다.");

  const amount = TIER_LIMITS[tier as SubscriptionTier]?.price[cycle];
  if (!amount) throw new Error("유효하지 않은 요금제입니다.");

  const paymentId = `${username}-renew-${Date.now()}`;

  await paymentClient.payWithBillingKey({
    paymentId,
    billingKey,
    orderName: getOrderName(tier, cycle) + " 갱신",
    amount: { total: amount },
    currency: "KRW",
    customer: { id: username },
  });

  await supabaseAdmin
    .from("payment_events")
    .upsert(
      { id: paymentId, type: "subscription.renewed", username, amount },
      { onConflict: "id", ignoreDuplicates: true },
    );

  const nextResetDate = getNextResetDate();
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      usage_count_month: 0,
      usage_reset_date: nextResetDate.toISOString(),
      subscription_status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("username", username);

  if (error) throw error;
  return { username, amount };
}

export async function cancelSubscription(username: string) {
  if (!username) throw new Error("username이 필요합니다.");

  // 1. 빌링키 조회
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("portone_billing_key")
    .eq("username", username)
    .single();

  // 2. PortOne 빌링키 삭제 시도
  if (profile?.portone_billing_key) {
    try {
      await paymentClient.billingKey.deleteBillingKey({
        billingKey: profile.portone_billing_key,
      });
    } catch {
      // 빌링키 삭제 실패 시 DB 업데이트는 계속 진행 (zombie key 허용)
      // 추후 cron에서 감지하여 정리
    }
  }

  // 3. DB 업데이트
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      subscription_tier: "free",
      subscription_status: "canceled",
      portone_billing_key: null,
      billing_cycle: null,
      updated_at: new Date().toISOString(),
    })
    .eq("username", username);

  if (error) throw error;
}

export async function handleWebhookEvent(
  type: string,
  data: Record<string, unknown>,
  eventId: string,
) {
  // 멱등성 체크
  const { data: existing } = await supabaseAdmin
    .from("payment_events")
    .select("id")
    .eq("id", eventId)
    .single();

  if (existing) return;

  if (type === "Transaction.Paid") {
    const billingKey = data.billingKey as string | undefined;
    if (!billingKey) return;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("username")
      .eq("portone_billing_key", billingKey)
      .single();

    if (profile?.username) {
      const nextResetDate = getNextResetDate();
      await supabaseAdmin
        .from("profiles")
        .update({
          usage_count_month: 0,
          usage_reset_date: nextResetDate.toISOString(),
          subscription_status: "active",
        })
        .eq("username", profile.username);
    }
  } else if (type === "Transaction.Failed") {
    const billingKey = data.billingKey as string | undefined;
    if (!billingKey) return;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("username")
      .eq("portone_billing_key", billingKey)
      .single();

    if (profile?.username) {
      await supabaseAdmin
        .from("profiles")
        .update({ subscription_status: "past_due" })
        .eq("username", profile.username);
    }
  } else if (type === "BillingKey.Deleted") {
    const billingKey = data.billingKey as string | undefined;
    if (!billingKey) return;

    await supabaseAdmin
      .from("profiles")
      .update({
        subscription_tier: "free",
        subscription_status: "canceled",
        portone_billing_key: null,
        billing_cycle: null,
      })
      .eq("portone_billing_key", billingKey);
  }

  // 이벤트 기록
  await supabaseAdmin
    .from("payment_events")
    .upsert(
      { id: eventId, type, username: null },
      { onConflict: "id", ignoreDuplicates: true },
    );
}

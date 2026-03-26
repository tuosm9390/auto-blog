import { NextRequest, NextResponse } from "next/server";
import { chargeWithBillingKey } from "@/lib/portone-billing";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "서버 설정 오류" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // 결제일이 도래한 active 구독자 조회
  const { data: profiles, error } = await supabaseAdmin
    .from("profiles")
    .select("username, portone_billing_key, subscription_tier, billing_cycle, usage_reset_date")
    .eq("subscription_status", "active")
    .lte("usage_reset_date", now.toISOString())
    .not("portone_billing_key", "is", null);

  if (error) {
    console.error("Billing cron: profiles fetch error", error);
    return NextResponse.json({ error: "DB 조회 실패" }, { status: 500 });
  }

  const results = { success: 0, failed: 0, errors: [] as string[] };

  // 순차 처리 (MVP — 추후 Promise.allSettled 병렬화)
  for (const profile of profiles ?? []) {
    if (!profile.portone_billing_key || !profile.subscription_tier || !profile.billing_cycle) {
      continue;
    }

    try {
      // 타임아웃 보호
      const chargePromise = chargeWithBillingKey(
        profile.username,
        profile.portone_billing_key,
        profile.subscription_tier,
        profile.billing_cycle as "monthly" | "yearly",
      );
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("결제 타임아웃")), 15000),
      );
      await Promise.race([chargePromise, timeout]);
      results.success++;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "알 수 없는 오류";
      console.error(`Billing cron: charge failed for ${profile.username}:`, message);
      results.errors.push(`${profile.username}: ${message}`);
      results.failed++;

      // 결제 실패 → past_due 전환
      await supabaseAdmin
        .from("profiles")
        .update({ subscription_status: "past_due" })
        .eq("username", profile.username);
    }
  }

  return NextResponse.json({
    processed: (profiles?.length ?? 0),
    ...results,
  });
}

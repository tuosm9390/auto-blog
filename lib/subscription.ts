import { supabaseAdmin as supabase } from "./supabase-admin";
import { SubscriptionTier } from "./types";

// 티어별 제한 상수
export const TIER_LIMITS: Record<SubscriptionTier, {
  monthlyLimit: number;
  aiModel: string;
  watermark: boolean;
  maxAutoRepos: number;
}> = {
  free: {
    monthlyLimit: 3,
    aiModel: "gemini-2.5-flash-lite",
    watermark: true,
    maxAutoRepos: 1,
  },
  pro: {
    monthlyLimit: 30,
    aiModel: "gemini-2.5-flash",
    watermark: false,
    maxAutoRepos: Infinity,
  },
  business: {
    monthlyLimit: Infinity,
    aiModel: "gemini-2.5-pro",
    watermark: false,
    maxAutoRepos: Infinity,
  },
};

interface UsageInfo {
  tier: SubscriptionTier;
  usageCount: number;
  monthlyLimit: number;
  remaining: number;
  resetDate: string | null;
}

// 사용량 조회 + Lazy Reset (월 초기화 날짜 지났으면 자동 리셋)
export async function checkAndGetUsage(username: string): Promise<UsageInfo> {
  const { data, error } = await supabase
    .from("profiles")
    .select("subscription_tier, subscription_status, usage_count_month, usage_reset_date")
    .eq("username", username)
    .single();

  if (error || !data) {
    // 프로필이 없으면 free tier 기본값 반환
    return {
      tier: "free",
      usageCount: 0,
      monthlyLimit: TIER_LIMITS.free.monthlyLimit,
      remaining: TIER_LIMITS.free.monthlyLimit,
      resetDate: null,
    };
  }

  const dbTier = data.subscription_tier as SubscriptionTier || "free";
  const dbStatus = data.subscription_status || "canceled";
  
  const isActive = dbStatus === "active" || dbStatus === "trialing";
  const tier: SubscriptionTier = isActive ? dbTier : "free";

  const limits = TIER_LIMITS[tier];

  // Lazy Reset: 리셋 날짜가 지났으면 카운터 초기화
  const now = new Date();
  const resetDate = data.usage_reset_date ? new Date(data.usage_reset_date) : null;
  let usageCount = data.usage_count_month ?? 0;

  if (resetDate && now >= resetDate) {
    const nextResetDate = getNextResetDate(now);

    await supabase
      .from("profiles")
      .update({
        usage_count_month: 0,
        usage_reset_date: nextResetDate.toISOString(),
      })
      .eq("username", username);

    usageCount = 0;
  }

  const monthlyLimit = limits.monthlyLimit === Infinity ? 999999 : limits.monthlyLimit;
  const remaining = Math.max(0, monthlyLimit - usageCount);

  return {
    tier,
    usageCount,
    monthlyLimit: limits.monthlyLimit,
    remaining,
    resetDate: resetDate?.toISOString() ?? null,
  };
}

// 사용량 원자적 증가
export async function incrementUsage(username: string): Promise<void> {
  const { error } = await supabase.rpc("increment_usage_count", {
    p_username: username,
  });

  if (error) {
    // RPC 없는 경우 fallback: 단순 update
    const { data } = await supabase
      .from("profiles")
      .select("usage_count_month")
      .eq("username", username)
      .single();

    const currentCount = data?.usage_count_month ?? 0;
    await supabase
      .from("profiles")
      .update({ usage_count_month: currentCount + 1 })
      .eq("username", username);
  }
}

// 사용량 1 감소 (Manual 모드에서 분석 취소 시 롤백용)
// usage_count_month가 0 이하로 내려가지 않도록 방어 처리
export async function decrementUsage(username: string): Promise<void> {
  const { data } = await supabase
    .from("profiles")
    .select("usage_count_month")
    .eq("username", username)
    .single();

  const currentCount = data?.usage_count_month ?? 0;
  if (currentCount <= 0) return;

  await supabase
    .from("profiles")
    .update({ usage_count_month: currentCount - 1 })
    .eq("username", username);
}

// 사용량 초기화 (구독 결제 완료 시 호출)
export async function resetUsage(username: string): Promise<void> {
  const nextResetDate = getNextResetDate();

  await supabase
    .from("profiles")
    .update({
      usage_count_month: 0,
      usage_reset_date: nextResetDate.toISOString(),
    })
    .eq("username", username);
}

export function getNextResetDate(fromDate: Date = new Date()): Date {
  const d = new Date(fromDate);
  d.setMonth(d.getMonth() + 1);
  return d;
}

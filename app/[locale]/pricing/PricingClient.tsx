"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import PortOne from "@portone/browser-sdk/v2";

interface PricingClientProps {
  currentTier: string;
  isAuthenticated: boolean;
}

export default function PricingClient({
  currentTier,
  isAuthenticated,
}: PricingClientProps) {
  const router = useRouter();
  const t = useTranslations("Pricing");
  const commonT = useTranslations("Common");

  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly",
  );

  const handleCheckout = async (tier: string) => {
    if (!isAuthenticated) {
      toast(t("loginRequired"), {
        description: t("loginRequiredDesc"),
      });
      router.push("/api/auth/signin");
      return;
    }

    if (currentTier === tier) {
      toast.info(t("currentPlan"));
      return;
    }

    setIsLoading(tier);
    try {
      const issueName =
        tier === "pro"
          ? billingCycle === "yearly"
            ? "Synapso Pro 연간 구독"
            : "Synapso Pro 월간 구독"
          : billingCycle === "yearly"
            ? "Synapso Business 연간 구독"
            : "Synapso Business 월간 구독";

      const response = await PortOne.requestIssueBillingKey({
        storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID!,
        channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY!,
        billingKeyMethod: "CARD",
        issueId: `billing-${tier}-${Date.now()}`,
        issueName,
      });

      // 사용자가 팝업을 닫은 경우
      if (!response) {
        toast.info(t("paymentCancelled"));
        return;
      }

      // PG 오류 발생
      if (response.code) {
        throw new Error(response.message || response.code);
      }

      // 빌링키 서버 저장 및 최초 결제
      const res = await fetch("/api/portone/billing-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billingKey: response.billingKey,
          tier,
          cycle: billingCycle,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "결제 처리 중 오류가 발생했습니다.");
      }

      toast.success(t("subscribed"));
      router.refresh();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : commonT("unknownError");
      toast.error(commonT("error"), { description: errorMessage });
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Billing Cycle Toggle */}
      <div className="flex justify-center">
        <div className="bg-surface border border-border-subtle rounded-full p-1 flex items-center">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
              billingCycle === "monthly"
                ? "bg-elevated text-text-primary shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {t("monthly")}
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
              billingCycle === "yearly"
                ? "bg-elevated text-text-primary shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {t("yearly")}
            <span className="text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded-full font-bold">
              {t("discount")}
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-start">
        {/* Basic Tier */}
        <div className="border border-border-subtle bg-surface rounded-2xl p-8 flex flex-col h-full">
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-2">{t("basicName")}</h3>
            <p className="text-text-secondary text-sm">
              {t("basicDesc")}
            </p>
            <div className="mt-6">
              <span className="text-4xl font-display font-bold">{t("freePrice")}</span>
              <span className="text-text-tertiary">{t("perMonth")}</span>
            </div>
          </div>
          <ul className="space-y-4 mb-8 flex-1 text-sm text-text-secondary">
            <li className="flex gap-3">
              <span className="text-accent">✓</span> {t("featureBasicPosts")}
            </li>
            <li className="flex gap-3">
              <span className="text-accent">✓</span> {t("featureBasicRepo")}
            </li>
            <li className="flex gap-3">
              <span className="text-accent">✓</span> {t("featureBasicMarkdown")}
            </li>
            <li className="flex gap-3">
              <span className="text-text-tertiary">✓</span>{" "}
              <span className="opacity-70">{t("featureWatermark")}</span>
            </li>
          </ul>
          <button
            disabled
            className="w-full py-3 px-4 rounded-xl font-medium border border-border-strong text-text-secondary bg-elevated/50 cursor-not-allowed"
          >
            {currentTier === "free" ? t("currentPlan") : t("basicName")}
          </button>
        </div>

        {/* Pro Tier (Highlighted) */}
        <div className="border-2 border-accent bg-surface rounded-2xl p-8 flex flex-col h-full relative transform md:-translate-y-4 shadow-2xl shadow-accent/5">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent text-black px-4 py-1 rounded-full text-xs font-bold tracking-wide">
            {t("popular")}
          </div>
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-2 text-text-primary">{t("proName")}</h3>
            <p className="text-text-secondary text-sm">
              {t("proDesc")}
            </p>
            <div className="mt-6">
              <span className="text-4xl font-display font-bold">
                {billingCycle === "yearly" ? t("proYearlyPrice") : t("proMonthlyPrice")}
              </span>
              <span className="text-text-tertiary">{t("perMonth")}</span>
              {billingCycle === "yearly" && (
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-text-tertiary text-xs">{t("proYearlyTotal")}</span>
                  <span className="text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded-full font-bold">
                    {t("proDiscount")}
                  </span>
                </div>
              )}
            </div>
          </div>
          <ul className="space-y-4 mb-8 flex-1 text-sm text-text-primary">
            <li className="flex gap-3">
              <span className="text-accent">✓</span> <strong>{t("feature30")}</strong>
            </li>
            <li className="flex gap-3">
              <span className="text-accent">✓</span>{" "}
              <strong>{t("featureProModel")}</strong>
            </li>
            <li className="flex gap-3">
              <span className="text-accent">✓</span>{" "}
              <strong>{t("featureNoWatermark")}</strong>
            </li>
            <li className="flex gap-3">
              <span className="text-accent">✓</span> {t("featureSeo")}
            </li>
            <li className="flex gap-3">
              <span className="text-accent">✓</span> {t("featureCustomTone")}
            </li>
          </ul>
          <button
            onClick={() => handleCheckout("pro")}
            disabled={isLoading === "pro" || currentTier === "pro"}
            className="w-full py-3 px-4 rounded-xl font-semibold bg-accent text-black hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {isLoading === "pro"
              ? commonT("loading")
              : currentTier === "pro"
                ? t("currentPlan")
                : t("upgradePro")}
          </button>
        </div>

        {/* Business Tier */}
        <div className="border border-border-subtle bg-surface rounded-2xl p-8 flex flex-col h-full">
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-2">{t("bizName")}</h3>
            <p className="text-text-secondary text-sm">
              {t("bizDesc")}
            </p>
            <div className="mt-6">
              <span className="text-4xl font-display font-bold">
                {billingCycle === "yearly" ? t("bizYearlyPrice") : t("bizMonthlyPrice")}
              </span>
              <span className="text-text-tertiary">{t("perMonth")}</span>
              {billingCycle === "yearly" && (
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-text-tertiary text-xs">{t("bizYearlyTotal")}</span>
                  <span className="text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded-full font-bold">
                    {t("bizDiscount")}
                  </span>
                </div>
              )}
            </div>
          </div>
          <ul className="space-y-4 mb-8 flex-1 text-sm text-text-secondary">
            <li className="flex gap-3">
              <span className="text-accent">✓</span> <strong>{t("featureUnlimited")}</strong>
            </li>
            <li className="flex gap-3">
              <span className="text-accent">✓</span> {t("featureTeam")}
            </li>
            <li className="flex gap-3">
              <span className="text-accent">✓</span> {t("featureBrandVoice")}
            </li>
            <li className="flex gap-3">
              <span className="text-accent">✓</span> {t("featureAutoPublish")}
            </li>
          </ul>
          <button
            onClick={() => handleCheckout("business")}
            disabled={isLoading === "business" || currentTier === "business"}
            className="w-full py-3 px-4 rounded-xl font-medium border border-border-strong hover:bg-elevated transition-colors text-text-primary disabled:opacity-50"
          >
            {isLoading === "business"
              ? commonT("loading")
              : currentTier === "business"
                ? t("currentPlan")
                : t("startBiz")}
          </button>
        </div>
      </div>
    </div>
  );
}

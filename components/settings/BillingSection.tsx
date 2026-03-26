import type { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { SubscriptionInfo } from "@/lib/types";

type TFunction = ReturnType<typeof useTranslations>;

export function BillingSection({
  subscription,
  cancelConfirming,
  cancelLoading,
  onCancelRequest,
  onCancelConfirm,
  onCancelAbort,
  t,
  pricingT,
  commonT,
}: {
  subscription: SubscriptionInfo;
  cancelConfirming: boolean;
  cancelLoading: boolean;
  onCancelRequest: () => void;
  onCancelConfirm: () => void;
  onCancelAbort: () => void;
  t: TFunction;
  pricingT: TFunction;
  commonT: TFunction;
}) {
  const billingCycleLabel =
    subscription.billingCycle === "yearly"
      ? " (연간)"
      : subscription.billingCycle === "monthly"
        ? " (월간)"
        : "";

  return (
    <div className="border border-border-subtle rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold mb-1">{t("planTitle")}</h2>
          <p className="text-sm text-text-secondary">{t("planDesc")}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              subscription.tier === "pro"
                ? "bg-accent text-black"
                : subscription.tier === "business"
                  ? "bg-purple-500 text-white"
                  : "bg-elevated border border-border-strong text-text-secondary"
            }`}
          >
            {subscription.tier === "free"
              ? pricingT("basicName")
              : subscription.tier === "pro"
                ? pricingT("proName")
                : pricingT("bizName")}
          </span>
          {billingCycleLabel && (
            <span className="text-xs text-text-tertiary">{billingCycleLabel}</span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">{t("usageCount")}</span>
          <span className="font-mono text-text-primary">
            {subscription.usageCount} /{" "}
            {subscription.monthlyLimit === 999999 ? "∞" : subscription.monthlyLimit}
          </span>
        </div>
        {subscription.monthlyLimit !== 999999 && (
          <div className="w-full h-2 bg-elevated rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                subscription.remaining === 0
                  ? "bg-error"
                  : subscription.remaining <= 1
                    ? "bg-yellow-500"
                    : "bg-accent"
              }`}
              style={{
                width: `${Math.min(100, (subscription.usageCount / subscription.monthlyLimit) * 100)}%`,
              }}
            />
          </div>
        )}
        {subscription.remaining === 0 && (
          <p className="text-xs text-error">{t("limitReached")}</p>
        )}
      </div>

      <div className="flex gap-3 pt-1 flex-wrap items-center">
        {subscription.tier === "free" ? (
          <Link
            href="/pricing"
            className="px-5 py-2.5 bg-accent text-black font-semibold rounded-lg hover:bg-accent-hover transition-colors text-sm"
          >
            {t("upgradeBtn")}
          </Link>
        ) : (
          <>
            <p className="text-xs text-text-tertiary flex-1">
              {t("paymentHint")}
            </p>
            {cancelConfirming ? (
              <div
                className="flex items-center gap-2"
                role="group"
                aria-label={t("cancelConfirm")}
              >
                <span className="text-sm text-text-secondary">{t("cancelConfirm")}</span>
                <button
                  onClick={onCancelConfirm}
                  disabled={cancelLoading}
                  className="px-4 py-2 bg-error text-white rounded-lg text-sm font-medium hover:bg-error/90 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {cancelLoading ? commonT("loading") : t("confirmYes")}
                </button>
                <button
                  onClick={onCancelAbort}
                  disabled={cancelLoading}
                  className="px-4 py-2 border border-border-strong rounded-lg text-sm font-medium hover:bg-elevated transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {t("confirmNo")}
                </button>
              </div>
            ) : (
              <button
                onClick={onCancelRequest}
                disabled={cancelLoading}
                className="px-5 py-2.5 border border-error/40 text-error rounded-lg text-sm font-medium hover:bg-error/5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {t("cancelSub")}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

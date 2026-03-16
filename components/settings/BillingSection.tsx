import { Link } from "@/i18n/routing";
import { SubscriptionInfo } from "@/lib/types";

export function BillingSection({
  subscription,
  portalLoading,
  cancelLoading,
  onOpenPortal,
  onCancel,
  t,
  pricingT,
  commonT,
}: {
  subscription: SubscriptionInfo;
  portalLoading: boolean;
  cancelLoading: boolean;
  onOpenPortal: () => void;
  onCancel: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pricingT: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  commonT: any;
}) {
  return (
    <div className="border border-border-subtle rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold mb-1">{t("planTitle")}</h2>
          <p className="text-sm text-text-secondary">{t("planDesc")}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${subscription.tier === "pro" ? "bg-accent text-black" : subscription.tier === "business" ? "bg-purple-500 text-white" : "bg-elevated border border-border-strong text-text-secondary"}`}>
          {subscription.tier === "free" ? pricingT("basicName") : subscription.tier === "pro" ? pricingT("proName") : pricingT("bizName")}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">{t("usageCount")}</span>
          <span className="font-mono text-text-primary">
            {subscription.usageCount} / {subscription.monthlyLimit === 999999 ? "∞" : subscription.monthlyLimit}
          </span>
        </div>
        {subscription.monthlyLimit !== 999999 && (
          <div className="w-full h-2 bg-elevated rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${subscription.remaining === 0 ? "bg-error" : subscription.remaining <= 1 ? "bg-yellow-500" : "bg-accent"}`}
              style={{ width: `${Math.min(100, (subscription.usageCount / subscription.monthlyLimit) * 100)}%` }}
            />
          </div>
        )}
        {subscription.remaining === 0 && (
          <p className="text-xs text-error">{t("limitReached")}</p>
        )}
      </div>

      <div className="flex gap-3 pt-1 flex-wrap">
        {subscription.tier === "free" ? (
          <Link
            href="/pricing"
            className="px-5 py-2.5 bg-accent text-black font-semibold rounded-lg hover:bg-accent-hover transition-colors text-sm"
          >
            {t("upgradeBtn")}
          </Link>
        ) : (
          <>
            <button
              onClick={onOpenPortal}
              disabled={portalLoading}
              className="px-5 py-2.5 border border-border-strong rounded-lg text-sm font-medium hover:bg-elevated transition-colors disabled:opacity-50 cursor-pointer"
            >
              {portalLoading ? commonT("loading") : t("manageSub")}
            </button>
            <button
              onClick={onCancel}
              disabled={cancelLoading}
              className="px-5 py-2.5 border border-error/40 text-error rounded-lg text-sm font-medium hover:bg-error/5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {cancelLoading ? commonT("loading") : t("cancelSub")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
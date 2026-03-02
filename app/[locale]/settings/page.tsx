"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Suspense } from "react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

interface Repo {
  name: string;
  full_name: string;
  private: boolean;
}

interface UserSettingsData {
  github_username: string;
  posting_mode: "auto" | "manual";
  auto_repos: string[];
  auto_schedule: "daily" | "weekly";
}

interface SubscriptionInfo {
  tier: string;
  usageCount: number;
  monthlyLimit: number;
  remaining: number;
  resetDate: string | null;
}

function SettingsContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const t = useTranslations("Settings");
  const pricingT = useTranslations("Pricing");
  const commonT = useTranslations("Common");

  const [settings, setSettings] = useState<UserSettingsData | null>(null);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const username = session?.user?.username;

  useEffect(() => {
    if (!username) return;
    if (settings) return;
    loadData();
  }, [username]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [settingsResult, reposResult, subscriptionResult] = await Promise.allSettled([
        fetch("/api/settings").then(r => r.ok ? r.json() : Promise.reject(`settings: ${r.status}`)),
        fetch("/api/github/repos").then(r => r.ok ? r.json() : Promise.reject(`repos: ${r.status}`)),
        fetch("/api/subscription").then(r => r.ok ? r.json() : Promise.reject(`subscription: ${r.status}`)),
      ]);
      if (settingsResult.status === "fulfilled" && settingsResult.value.settings) {
        setSettings(settingsResult.value.settings);
      } else {
        setSettings({ github_username: username || "", posting_mode: "manual", auto_repos: [], auto_schedule: "daily" });
      }
      if (reposResult.status === "fulfilled" && reposResult.value.repos) setRepos(reposResult.value.repos);
      if (subscriptionResult.status === "fulfilled") setSubscription(subscriptionResult.value);
    } catch (err) {
      console.error("Data load failed:", err);
      setSettings({ github_username: username || "", posting_mode: "manual", auto_repos: [], auto_schedule: "daily" });
    } finally {
      setLoading(false);
    }
  };

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = data.url;
    } catch (err: any) {
      toast.error(err.message || "Failed to open portal");
    } finally {
      setPortalLoading(false);
    }
  };

  const cancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel subscription and switch to Free plan?")) return;
    setCancelLoading(true);
    try {
      const res = await fetch("/api/subscription", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Subscription cancelled. Switched to Free plan.");
      setSubscription(prev => prev ? { ...prev, tier: "free", monthlyLimit: 3, remaining: 3 } : null);
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel");
    } finally {
      setCancelLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ posting_mode: settings.posting_mode, auto_repos: settings.auto_repos, auto_schedule: settings.auto_schedule }) });
      if (!res.ok) throw new Error("Save failed");
      toast.success(commonT("save") + " success");
    } catch {
      toast.error(commonT("save") + " failed");
    }
    finally { setSaving(false); }
  };

  const toggleMode = () => {
    if (!settings) return;
    setSettings({ ...settings, posting_mode: settings.posting_mode === "auto" ? "manual" : "auto" });
  };

  const toggleRepo = (fullName: string) => {
    if (!settings) return;
    const current = settings.auto_repos || [];
    if (!current.includes(fullName) && subscription?.tier === "free" && current.length >= 1) {
      toast.error(t("repoLimit"));
      return;
    }
    const updated = current.includes(fullName) ? current.filter((r) => r !== fullName) : [...current, fullName];
    setSettings({ ...settings, auto_repos: updated });
  };

  if (!session?.user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 animate-fade-in-up">
        <h1 className="text-3xl font-display font-bold mb-4">{t("title")}</h1>
        <div className="border border-border-subtle rounded-xl p-8 text-center">
          <p className="text-text-secondary mb-4">{t("loginRequired")}</p>
          <Link href="/login" className="inline-block px-6 py-3 bg-accent text-black font-semibold rounded-lg">Sign In</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 animate-fade-in-up">
        <h1 className="text-3xl font-display font-bold mb-4">{t("title")}</h1>
        <div className="border border-border-subtle rounded-xl p-8 text-center text-text-secondary">{t("loading")}</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 md:py-16 animate-fade-in-up">
      <h1 className="text-3xl font-display font-bold mb-2">{t("title")}</h1>
      <p className="text-text-secondary mb-6">{t("desc")}</p>

      {settings && (
        <div className="space-y-6">
          {/* Billing Section */}
          {subscription && (
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

              {/* Usage Bar */}
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

              {/* Action Buttons */}
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
                      onClick={openPortal}
                      disabled={portalLoading}
                      className="px-5 py-2.5 border border-border-strong rounded-lg text-sm font-medium hover:bg-elevated transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {portalLoading ? commonT("loading") : t("manageSub")}
                    </button>
                    <button
                      onClick={cancelSubscription}
                      disabled={cancelLoading}
                      className="px-5 py-2.5 border border-error/40 text-error rounded-lg text-sm font-medium hover:bg-error/5 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {cancelLoading ? commonT("loading") : t("cancelSub")}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Posting Mode */}
          <div className="border border-border-subtle rounded-xl p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-1">{t("modeTitle")}</h2>
              <p className="text-sm text-text-secondary whitespace-pre-line">
                {t("modeDesc")}
              </p>
            </div>
            <button onClick={toggleMode} className={`w-full flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all ${settings.posting_mode === "auto" ? "border-accent bg-accent/5" : "border-border-subtle hover:border-border-strong"}`}>
              <div className={`w-12 h-6 rounded-full relative transition-all ${settings.posting_mode === "auto" ? "bg-accent" : "bg-elevated"}`}>
                <div className={`w-5 h-5 rounded-full absolute top-0.5 transition-all ${settings.posting_mode === "auto" ? "left-6.5 bg-black" : "left-0.5 bg-text-secondary"}`} />
              </div>
              <div className="text-left">
                <div className={`font-semibold text-sm ${settings.posting_mode === "auto" ? "text-accent" : ""}`}>
                  {settings.posting_mode === "auto" ? t("modeAuto") : t("modeManual")}
                </div>
                <div className="text-xs text-text-secondary whitespace-pre-line">
                  {settings.posting_mode === "auto" ? t("modeAutoDesc") : t("modeManualDesc")}
                </div>
              </div>
            </button>
            {settings.posting_mode === "auto" && (
              <div className="border border-yellow-500/30 bg-yellow-500/5 rounded-xl p-4 text-sm space-y-1">
                <p className="font-semibold text-yellow-500">{t("autoNoticeTitle")}</p>
                <p className="text-text-secondary leading-relaxed whitespace-pre-line">
                  {t("autoNoticeDesc")}
                </p>
              </div>
            )}
          </div>

          {settings.posting_mode === "auto" && (
            <>
              {/* Schedule */}
              <div className="border border-border-subtle rounded-xl p-6 space-y-4">
                <h2 className="text-lg font-semibold">{t("scheduleTitle")}</h2>
                <div className="grid grid-cols-2 gap-3">
                  {(["daily", "weekly"] as const).map((schedule) => (
                    <label key={schedule} className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${settings.auto_schedule === schedule ? "border-text-primary bg-elevated" : "border-border-subtle hover:border-border-strong"}`}>
                      <input type="radio" name="schedule" value={schedule} checked={settings.auto_schedule === schedule} onChange={() => setSettings({ ...settings, auto_schedule: schedule })} className="hidden" />
                      <span className="text-2xl">{schedule === "daily" ? "📅" : "📆"}</span>
                      <div>
                        <div className={`font-semibold text-sm ${settings.auto_schedule === schedule ? "text-text-primary" : "text-text-secondary"}`}>{schedule === "daily" ? t("scheduleDaily") : t("scheduleWeekly")}</div>
                        <div className="text-xs text-text-tertiary">{schedule === "daily" ? t("scheduleDailyDesc") : t("scheduleWeeklyDesc")}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Repo Selection */}
              <div className="border border-border-subtle rounded-xl p-6 space-y-4">
                <div>
                  <h2 className="text-lg font-semibold mb-1">{t("repoTitle")}</h2>
                  <p className="text-sm text-text-secondary">{t("repoDesc")}</p>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {repos.length === 0 ? (
                    <p className="text-text-tertiary italic text-sm">No repositories found</p>
                  ) : repos.map((repo) => {
                    const isSelected = settings.auto_repos?.includes(repo.full_name);
                    return (
                      <div key={repo.full_name} onClick={() => toggleRepo(repo.full_name)} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${isSelected ? "border-border-strong bg-elevated" : "border-border-subtle hover:border-border-strong"}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isSelected ? "border-accent bg-accent" : "border-border-strong"}`}>
                            {isSelected && <span className="text-black text-xs font-bold">✓</span>}
                          </div>
                          <span className={`text-sm font-medium ${isSelected ? "text-text-primary" : "text-text-secondary"}`}>{repo.name}</span>
                        </div>
                        <span className={`px-2 py-0.5 border border-border-subtle rounded-full text-xs text-text-tertiary ${isSelected ? "opacity-100" : "opacity-50"}`}>
                          {repo.private ? "Private" : "Public"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end">
            <button onClick={saveSettings} disabled={saving} className="px-8 py-3 bg-accent text-black font-semibold rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50 cursor-pointer">
              {saving ? t("saving") : t("saveBtn")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-3xl mx-auto px-4 py-32 text-center">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-text-secondary">Loading settings...</p>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}

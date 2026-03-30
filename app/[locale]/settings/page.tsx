"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Suspense } from "react";
import { toast } from "sonner";
import { LoginRequired } from "@/components/ui/LoginRequired";
import { useTranslations } from "next-intl";
import { Repo, UserSettingsData, SubscriptionInfo } from "@/lib/types";

import { BillingSection } from "@/components/settings/BillingSection";
import { PostingModeSection } from "@/components/settings/PostingModeSection";
import { ScheduleSection } from "@/components/settings/ScheduleSection";
import { RepoSelector } from "@/components/settings/RepoSelector";

function SettingsContent() {
  const { data: session, status } = useSession();
  const t = useTranslations("Settings");
  const pricingT = useTranslations("Pricing");
  const commonT = useTranslations("Common");

  const [settings, setSettings] = useState<UserSettingsData | null>(null);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelConfirming, setCancelConfirming] = useState(false);

  const username = session?.user?.username;

  useEffect(() => {
    if (!username) return;
    if (settings) return;

    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      try {
        const [settingsResult, reposResult, subscriptionResult] = await Promise.allSettled([
          fetch("/api/settings").then(r => r.ok ? r.json() : Promise.reject(`settings: ${r.status}`)),
          fetch("/api/github/repos").then(r => r.ok ? r.json() : Promise.reject(`repos: ${r.status}`)),
          fetch("/api/subscription").then(r => r.ok ? r.json() : Promise.reject(`subscription: ${r.status}`)),
        ]);

        if (!isMounted) return;

        if (settingsResult.status === "fulfilled" && settingsResult.value.settings) {
          setSettings(settingsResult.value.settings);
        } else {
          setSettings({ github_username: username || "", posting_mode: "manual", auto_repos: [], auto_schedule: "daily" });
        }
        if (reposResult.status === "fulfilled" && reposResult.value.repos) setRepos(reposResult.value.repos);
        if (subscriptionResult.status === "fulfilled") setSubscription(subscriptionResult.value);
      } catch (err) {
        console.error("Data load failed:", err);
        if (isMounted) {
          setSettings({ github_username: username || "", posting_mode: "manual", auto_repos: [], auto_schedule: "daily" });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => { isMounted = false; };
  }, [username, settings]);

  const handleCancelRequest = () => {
    setCancelConfirming(true);
  };

  const handleCancelAbort = () => {
    setCancelConfirming(false);
  };

  const handleCancelConfirm = async () => {
    setCancelLoading(true);
    try {
      const res = await fetch("/api/subscription", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(t("cancelSuccess"));
      setCancelConfirming(false);
      setSubscription(prev =>
        prev ? { ...prev, tier: "free", monthlyLimit: 3, remaining: 3, billingCycle: null } : null,
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : commonT("unknownError");
      toast.error(message);
    } finally {
      setCancelLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          posting_mode: settings.posting_mode,
          auto_repos: settings.auto_repos,
          auto_schedule: settings.auto_schedule,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success(commonT("save") + " success");
    } catch {
      toast.error(commonT("save") + " failed");
    } finally {
      setSaving(false);
    }
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
    const updated = current.includes(fullName)
      ? current.filter((r) => r !== fullName)
      : [...current, fullName];
    setSettings({ ...settings, auto_repos: updated });
  };

  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 md:py-16 animate-pulse">
        <div className="h-9 w-32 bg-surface-subtle rounded-md mb-2" />
        <div className="h-4 w-80 bg-surface-subtle rounded-md mb-6" />
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border border-border-subtle rounded-xl p-6">
              <div className="h-5 w-40 bg-surface-subtle rounded mb-4" />
              <div className="h-10 w-full bg-surface-subtle rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return <LoginRequired />;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 md:py-16 animate-fade-in-up">
      <h1 className="text-3xl font-display font-bold mb-2">{t("title")}</h1>
      <p className="text-text-secondary mb-6">{t("desc")}</p>

      {settings && (
        <div className="space-y-6">
          {subscription && (
            <BillingSection
              subscription={subscription}
              cancelConfirming={cancelConfirming}
              cancelLoading={cancelLoading}
              onCancelRequest={handleCancelRequest}
              onCancelConfirm={handleCancelConfirm}
              onCancelAbort={handleCancelAbort}
              t={t}
              pricingT={pricingT}
              commonT={commonT}
            />
          )}

          <PostingModeSection
            mode={settings.posting_mode}
            onToggle={toggleMode}
            t={t}
          />

          {settings.posting_mode === "auto" && (
            <>
              <ScheduleSection
                schedule={settings.auto_schedule}
                onChange={(val) => setSettings({ ...settings, auto_schedule: val })}
                t={t}
              />
              <RepoSelector
                repos={repos}
                selectedRepos={settings.auto_repos || []}
                onToggle={toggleRepo}
                t={t}
              />
            </>
          )}

          <div className="flex justify-end">
            <button
              onClick={saveSettings}
              disabled={saving}
              className="px-8 py-3 bg-accent text-black font-semibold rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50 cursor-pointer"
            >
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

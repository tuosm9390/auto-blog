"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Suspense } from "react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  useEffect(() => {
    if (searchParams.get("billing") !== "success") return;
    const sessionId = searchParams.get("session_id");
    if (!sessionId) return;

    fetch("/api/subscription/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success || data.alreadyUpdated) {
          toast.success("Pro 구독이 활성화되었습니다! 월 30회 AI 포스트 생성을 즐기세요.");
          // 구독 정보 갱신
          fetch("/api/subscription").then(r => r.ok ? r.json() : null).then(d => { if (d) setSubscription(d); });
        }
      })
      .catch(() => {
        toast.success("결제가 완료되었습니다. 잠시 후 새로고침해주세요.");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      console.error("데이터 로드 실패:", err);
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
      toast.error(err.message || "구독 관리 포털을 여는 데 실패했습니다.");
    } finally {
      setPortalLoading(false);
    }
  };

  const cancelSubscription = async () => {
    if (!confirm("구독을 취소하고 Free 플랜으로 전환하시겠습니까?")) return;
    setCancelLoading(true);
    try {
      const res = await fetch("/api/subscription", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("구독이 취소되었습니다. Free 플랜으로 전환되었습니다.");
      setSubscription(prev => prev ? { ...prev, tier: "free", monthlyLimit: 3, remaining: 3 } : null);
    } catch (err: any) {
      toast.error(err.message || "구독 취소에 실패했습니다.");
    } finally {
      setCancelLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ posting_mode: settings.posting_mode, auto_repos: settings.auto_repos, auto_schedule: settings.auto_schedule }) });
      if (!res.ok) throw new Error("저장 실패");
      toast.success("설정이 저장되었습니다.");
    } catch {
      toast.error("설정 저장에 실패했습니다.");
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
    const updated = current.includes(fullName) ? current.filter((r) => r !== fullName) : [...current, fullName];
    setSettings({ ...settings, auto_repos: updated });
  };

  if (!session?.user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 animate-fade-in-up">
        <h1 className="text-3xl font-display font-bold mb-4">설정</h1>
        <div className="border border-border-subtle rounded-xl p-8 text-center">
          <p className="text-text-secondary mb-4">설정 기능을 이용하려면 로그인이 필요합니다.</p>
          <a href="/api/auth/signin" className="inline-block px-6 py-3 bg-accent text-black font-semibold rounded-lg">로그인하기</a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 animate-fade-in-up">
        <h1 className="text-3xl font-display font-bold mb-4">설정</h1>
        <div className="border border-border-subtle rounded-xl p-8 text-center text-text-secondary">설정을 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 md:py-16 animate-fade-in-up">
      <h1 className="text-3xl font-display font-bold mb-2">설정</h1>
      <p className="text-text-secondary mb-6">포스팅 모드와 자동화 설정을 관리합니다</p>

      {settings && (
        <div className="space-y-6">
          {/* Billing Section */}
          {subscription && (
            <div className="border border-border-subtle rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold mb-1">구독 플랜</h2>
                  <p className="text-sm text-text-secondary">현재 사용 중인 요금제와 이번 달 사용량을 확인합니다</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${subscription.tier === "pro" ? "bg-accent text-black" : subscription.tier === "business" ? "bg-purple-500 text-white" : "bg-elevated border border-border-strong text-text-secondary"}`}>
                  {subscription.tier === "free" ? "Basic" : subscription.tier === "pro" ? "Pro" : "Business"}
                </span>
              </div>

              {/* Usage Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">이번 달 AI 생성 횟수</span>
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
                  <p className="text-xs text-error">이번 달 한도를 모두 사용했습니다. Pro 플랜으로 업그레이드하면 월 30회를 사용할 수 있습니다.</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-1 flex-wrap">
                {subscription.tier === "free" ? (
                  <a
                    href="/pricing"
                    className="px-5 py-2.5 bg-accent text-black font-semibold rounded-lg hover:bg-accent-hover transition-colors text-sm"
                  >
                    Pro로 업그레이드 ✦
                  </a>
                ) : (
                  <>
                    <button
                      onClick={openPortal}
                      disabled={portalLoading}
                      className="px-5 py-2.5 border border-border-strong rounded-lg text-sm font-medium hover:bg-elevated transition-colors disabled:opacity-50"
                    >
                      {portalLoading ? "포털 여는 중..." : "구독 관리"}
                    </button>
                    <button
                      onClick={cancelSubscription}
                      disabled={cancelLoading}
                      className="px-5 py-2.5 border border-error/40 text-error rounded-lg text-sm font-medium hover:bg-error/5 transition-colors disabled:opacity-50"
                    >
                      {cancelLoading ? "처리 중..." : "구독 취소 [테스트]"}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Posting Mode */}
          <div className="border border-border-subtle rounded-xl p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-1">포스팅 모드</h2>
              <p className="text-sm text-text-secondary whitespace-pre-line">
                자동 모드를 활성화하면 선택한 레포의 새로운 커밋을 자동으로 분석하여{"\n"}
                초안을 생성합니다. 직접 발행 여부를 결정할 수 있습니다.
              </p>
            </div>
            <button onClick={toggleMode} className={`w-full flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all ${settings.posting_mode === "auto" ? "border-accent bg-accent/5" : "border-border-subtle hover:border-border-strong"}`}>
              <div className={`w-12 h-6 rounded-full relative transition-all ${settings.posting_mode === "auto" ? "bg-accent" : "bg-elevated"}`}>
                <div className={`w-5 h-5 rounded-full absolute top-0.5 transition-all ${settings.posting_mode === "auto" ? "left-6.5 bg-black" : "left-0.5 bg-text-secondary"}`} />
              </div>
              <div className="text-left">
                <div className={`font-semibold text-sm ${settings.posting_mode === "auto" ? "text-accent" : ""}`}>
                  {settings.posting_mode === "auto" ? "자동 모드 활성화됨" : "수동 모드"}
                </div>
                <div className="text-xs text-text-secondary whitespace-pre-line">
                  {settings.posting_mode === "auto"
                    ? "새 커밋이 감지되면 AI가 자동으로 초안을 생성합니다.\n작업 현황에서 게시 여부를 선택하세요."
                    : "직접 커밋을 선택하여 포스트를 생성합니다.\n원하는 시점에 수동으로 분석을 시작할 수 있습니다."}
                </div>
              </div>
            </button>
          </div>

          {settings.posting_mode === "auto" && (
            <>
              {/* Schedule */}
              <div className="border border-border-subtle rounded-xl p-6 space-y-4">
                <h2 className="text-lg font-semibold">자동 포스팅 주기</h2>
                <div className="grid grid-cols-2 gap-3">
                  {(["daily", "weekly"] as const).map((schedule) => (
                    <label key={schedule} className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${settings.auto_schedule === schedule ? "border-text-primary bg-elevated" : "border-border-subtle hover:border-border-strong"}`}>
                      <input type="radio" name="schedule" value={schedule} checked={settings.auto_schedule === schedule} onChange={() => setSettings({ ...settings, auto_schedule: schedule })} className="hidden" />
                      <span className="text-2xl">{schedule === "daily" ? "📅" : "📆"}</span>
                      <div>
                        <div className={`font-semibold text-sm ${settings.auto_schedule === schedule ? "text-text-primary" : "text-text-secondary"}`}>{schedule === "daily" ? "매일" : "매주"}</div>
                        <div className="text-xs text-text-tertiary">{schedule === "daily" ? "매일 1회 새 커밋 확인" : "주 1회 새 커밋 확인"}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Repo Selection */}
              <div className="border border-border-subtle rounded-xl p-6 space-y-4">
                <div>
                  <h2 className="text-lg font-semibold mb-1">자동 포스팅 대상 레포</h2>
                  <p className="text-sm text-text-secondary">자동으로 커밋을 분석할 레포지토리를 선택하세요</p>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {repos.length === 0 ? (
                    <p className="text-text-tertiary italic text-sm">레포지토리가 없습니다</p>
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
              {saving ? "저장 중..." : "설정 저장"}
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
        <p className="text-text-secondary">설정 데이터를 불러오는 중...</p>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}

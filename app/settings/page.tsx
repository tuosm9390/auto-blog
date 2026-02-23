"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Post } from "@/lib/types";
import PostContent from "@/components/PostContent";
import { Suspense } from "react";
import { toast } from "sonner";
import { useConfirm } from "@/components/ConfirmProvider";

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

type Tab = "settings" | "drafts";

function SettingsContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as Tab) === "drafts" ? "drafts" : "settings";

  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [settings, setSettings] = useState<UserSettingsData | null>(null);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [drafts, setDrafts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedDraft, setExpandedDraft] = useState<string | null>(null);
  const confirm = useConfirm();

  const username = session?.user?.username;

  useEffect(() => {
    if (!username) return;
    if (settings) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [settingsResult, reposResult, draftsResult] = await Promise.allSettled([
        fetch("/api/settings").then(r => r.ok ? r.json() : Promise.reject(`settings: ${r.status}`)),
        fetch("/api/github/repos").then(r => r.ok ? r.json() : Promise.reject(`repos: ${r.status}`)),
        fetch("/api/posts/drafts").then(r => r.ok ? r.json() : Promise.reject(`drafts: ${r.status}`)),
      ]);
      if (settingsResult.status === "fulfilled" && settingsResult.value.settings) {
        setSettings(settingsResult.value.settings);
      } else {
        setSettings({ github_username: username || "", posting_mode: "manual", auto_repos: [], auto_schedule: "daily" });
      }
      if (reposResult.status === "fulfilled" && reposResult.value.repos) setRepos(reposResult.value.repos);
      if (draftsResult.status === "fulfilled" && draftsResult.value.drafts) setDrafts(draftsResult.value.drafts);
    } catch (err) {
      console.error("데이터 로드 실패:", err);
      setSettings({ github_username: username || "", posting_mode: "manual", auto_repos: [], auto_schedule: "daily" });
    } finally {
      setLoading(false);
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

  const handleDraftAction = async (postId: string, action: "publish" | "delete") => {
    const isPublish = action === "publish";

    const isConfirmed = await confirm({
      title: isPublish ? "초안 게시" : "초안 삭제",
      description: isPublish
        ? "🚀 이 초안을 블로그에 정식으로 게시하시겠습니까?"
        : "🚨 이 초안을 영구적으로 삭제하시겠습니까?\n삭제된 데이터는 다시 복구할 수 없습니다.",
      confirmText: isPublish ? "게시" : "삭제",
      destructive: !isPublish,
    });

    if (!isConfirmed) return;

    try {
      const res = await fetch("/api/posts/drafts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postId, action }) });
      if (!res.ok) throw new Error("처리 실패");
      setDrafts((prev) => prev.filter((d) => d.id !== postId));
      toast.success(isPublish ? "🎉 초안이 성공적으로 게시되었습니다!" : "🗑️ 초안이 완전히 삭제되었습니다.");
    } catch {
      toast.error(`❌ ${isPublish ? "게시" : "삭제"} 처리에 실패했습니다. 다시 시도해주세요.`);
    }
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

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border-subtle mb-6">
        <button onClick={() => setActiveTab("settings")} className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${activeTab === "settings" ? "text-text-primary border-b-2 border-accent" : "text-text-tertiary hover:text-text-secondary"}`}>
          ⚙ 포스팅 설정
        </button>
        <button onClick={() => setActiveTab("drafts")} className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer flex items-center gap-2 ${activeTab === "drafts" ? "text-text-primary border-b-2 border-accent" : "text-text-tertiary hover:text-text-secondary"}`}>
          📝 초안 관리
          {drafts.length > 0 && <span className="px-1.5 py-0.5 bg-accent text-black text-xs rounded-full font-bold">{drafts.length}</span>}
        </button>
      </div>

      {/* Settings Tab */}
      {activeTab === "settings" && settings && (
        <div className="space-y-6">
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
                    ? "새 커밋이 감지되면 AI가 자동으로 초안을 생성합니다.\n초안 관리 탭에서 게시 여부를 선택하세요."
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

      {/* Drafts Tab */}
      {activeTab === "drafts" && (
        <div className="space-y-4">
          {drafts.length === 0 ? (
            <div className="border border-border-subtle rounded-xl p-12 text-center">
              <div className="text-5xl opacity-50 mb-4">📝</div>
              <h2 className="text-xl font-semibold mb-2">초안이 없습니다</h2>
              <p className="text-text-secondary text-sm">자동 포스팅으로 생성된 초안이 여기에 표시됩니다</p>
            </div>
          ) : drafts.map((draft) => (
            <div key={draft.id} className="border border-border-subtle rounded-xl p-6 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2 text-xs">
                  <span className="px-2 py-0.5 bg-accent text-black rounded-full font-semibold">초안</span>
                  {draft.repo && <span className="px-2 py-0.5 border border-border-subtle rounded-full text-text-tertiary">{draft.repo}</span>}
                  <span className="text-text-tertiary">{draft.date}</span>
                </div>
                <h3 className="text-lg font-semibold mb-1">{draft.title}</h3>
                <p className="text-sm text-text-secondary line-clamp-2">{draft.summary}</p>
              </div>
              {draft.tags?.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {draft.tags.map((tag) => (<span key={tag} className="text-xs text-text-tertiary">#{tag}</span>))}
                </div>
              )}
              <button onClick={() => setExpandedDraft(expandedDraft === draft.id ? null : draft.id)} className="text-sm text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer">
                {expandedDraft === draft.id ? "내용 접기 ▲" : "내용 보기 ▼"}
              </button>
              {expandedDraft === draft.id && (
                <div className="bg-elevated rounded-lg p-4"><PostContent content={draft.content} /></div>
              )}
              <div className="flex gap-2 justify-end">
                <button onClick={() => handleDraftAction(draft.id, "delete")} className="px-4 py-2 text-sm border border-error/50 text-error rounded-lg hover:bg-error/10 transition-colors cursor-pointer">삭제</button>
                <button onClick={() => handleDraftAction(draft.id, "publish")} className="px-4 py-2 text-sm bg-success text-black rounded-lg font-semibold hover:opacity-90 transition-all cursor-pointer">✓ 게시하기</button>
              </div>
            </div>
          ))}
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

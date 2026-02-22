"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Post } from "@/lib/types";
import PostContent from "@/components/PostContent";

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

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>("settings");
  const [settings, setSettings] = useState<UserSettingsData | null>(null);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [drafts, setDrafts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [expandedDraft, setExpandedDraft] = useState<string | null>(null);

  const username = session?.user?.username;

  useEffect(() => {
    if (!username) return;
    if (settings) return; // 이미 로드된 경우 재요청 방지
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [settingsRes, reposRes, draftsRes] = await Promise.all([
        fetch("/api/settings"),
        fetch("/api/github/repos"),
        fetch("/api/posts/drafts"),
      ]);

      const settingsData = await settingsRes.json();
      const reposData = await reposRes.json();
      const draftsData = await draftsRes.json();

      if (settingsData.settings) setSettings(settingsData.settings);
      if (reposData.repos) setRepos(reposData.repos);
      if (draftsData.drafts) setDrafts(draftsData.drafts);
    } catch (err) {
      console.error("데이터 로드 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 3000);
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

      if (!res.ok) throw new Error("저장 실패");
      showMessage("설정이 저장되었습니다.", "success");
    } catch {
      showMessage("설정 저장에 실패했습니다.", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleMode = () => {
    if (!settings) return;
    setSettings({
      ...settings,
      posting_mode: settings.posting_mode === "auto" ? "manual" : "auto",
    });
  };

  const toggleRepo = (fullName: string) => {
    if (!settings) return;
    const current = settings.auto_repos || [];
    const updated = current.includes(fullName)
      ? current.filter((r) => r !== fullName)
      : [...current, fullName];
    setSettings({ ...settings, auto_repos: updated });
  };

  const handleDraftAction = async (postId: string, action: "publish" | "delete") => {
    try {
      const res = await fetch("/api/posts/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, action }),
      });

      if (!res.ok) throw new Error("처리 실패");

      setDrafts((prev) => prev.filter((d) => d.id !== postId));
      showMessage(
        action === "publish" ? "게시가 완료되었습니다." : "삭제되었습니다.",
        "success"
      );
    } catch {
      showMessage("처리에 실패했습니다.", "error");
    }
  };

  if (!session?.user) {
    return (
      <div className="settings-page animate-in">
        <h1 className="settings-page__title">설정</h1>
        <div className="status-message status-message--info" style={{ textAlign: "center" }}>
          <p>설정 기능을 이용하려면 로그인이 필요합니다.</p>
          <a href="/api/auth/signin" className="btn btn--primary" style={{ marginTop: 16 }}>
            로그인하기
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="settings-page animate-in">
        <h1 className="settings-page__title">설정</h1>
        <div className="status-message status-message--info">
          <div className="loading-spinner">
            <span className="loading-spinner__dot" />
            <span className="loading-spinner__dot" />
            <span className="loading-spinner__dot" />
          </div>
          설정을 불러오는 중...
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page animate-in">
      <h1 className="settings-page__title">설정</h1>
      <p className="settings-page__subtitle">
        포스팅 모드와 자동화 설정을 관리합니다
      </p>

      {message && (
        <div className={`status-message status-message--${messageType}`}>
          {messageType === "success" ? "✓" : "⚠"} {message}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="settings-tabs">
        <button
          className={`settings-tab ${activeTab === "settings" ? "settings-tab--active" : ""}`}
          onClick={() => setActiveTab("settings")}
        >
          ⚙ 포스팅 설정
        </button>
        <button
          className={`settings-tab ${activeTab === "drafts" ? "settings-tab--active" : ""}`}
          onClick={() => setActiveTab("drafts")}
        >
          📝 초안 관리
          {drafts.length > 0 && (
            <span className="settings-tab__badge">{drafts.length}</span>
          )}
        </button>
      </div>

      {/* Settings Tab */}
      {activeTab === "settings" && settings && (
        <div className="settings-content">
          {/* Posting Mode Toggle */}
          <div className="settings-card">
            <div className="settings-card__header">
              <h2 className="settings-card__title">포스팅 모드</h2>
              <p className="settings-card__desc">
                자동 모드를 활성화하면 선택한 레포의 새로운 커밋을 자동으로 분석하여 초안을 생성합니다
              </p>
            </div>
            <div className="mode-toggle" onClick={toggleMode}>
              <div className={`mode-toggle__track ${settings.posting_mode === "auto" ? "mode-toggle__track--active" : ""}`}>
                <div className="mode-toggle__thumb" />
              </div>
              <span className="mode-toggle__label">
                {settings.posting_mode === "auto" ? (
                  <>
                    <span className="mode-toggle__status mode-toggle__status--auto">자동</span>
                    새 커밋이 감지되면 AI가 자동으로 초안을 생성합니다
                  </>
                ) : (
                  <>
                    <span className="mode-toggle__status mode-toggle__status--manual">수동</span>
                    직접 커밋을 선택하여 포스트를 생성합니다
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Auto Settings (only visible in auto mode) */}
          {settings.posting_mode === "auto" && (
            <>
              {/* Schedule */}
              <div className="settings-card">
                <div className="settings-card__header">
                  <h2 className="settings-card__title">자동 포스팅 주기</h2>
                </div>
                <div className="schedule-options">
                  <label
                    className={`schedule-option ${settings.auto_schedule === "daily" ? "schedule-option--active" : ""}`}
                  >
                    <input
                      type="radio"
                      name="schedule"
                      value="daily"
                      checked={settings.auto_schedule === "daily"}
                      onChange={() => setSettings({ ...settings, auto_schedule: "daily" })}
                    />
                    <div className="schedule-option__content">
                      <span className="schedule-option__icon">📅</span>
                      <span className="schedule-option__title">매일</span>
                      <span className="schedule-option__desc">매일 1회 새 커밋 확인</span>
                    </div>
                  </label>
                  <label
                    className={`schedule-option ${settings.auto_schedule === "weekly" ? "schedule-option--active" : ""}`}
                  >
                    <input
                      type="radio"
                      name="schedule"
                      value="weekly"
                      checked={settings.auto_schedule === "weekly"}
                      onChange={() => setSettings({ ...settings, auto_schedule: "weekly" })}
                    />
                    <div className="schedule-option__content">
                      <span className="schedule-option__icon">📆</span>
                      <span className="schedule-option__title">매주</span>
                      <span className="schedule-option__desc">주 1회 새 커밋 확인</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Repo Selection */}
              <div className="settings-card">
                <div className="settings-card__header">
                  <h2 className="settings-card__title">자동 포스팅 대상 레포</h2>
                  <p className="settings-card__desc">
                    자동으로 커밋을 분석할 레포지토리를 선택하세요
                  </p>
                </div>
                <div className="repo-list">
                  {repos.length === 0 ? (
                    <p className="repo-list__empty">레포지토리가 없습니다</p>
                  ) : (
                    repos.map((repo) => {
                      const isSelected = settings.auto_repos?.includes(repo.full_name);
                      return (
                        <div
                          key={repo.full_name}
                          className={`repo-item ${isSelected ? "repo-item--selected" : ""}`}
                          onClick={() => toggleRepo(repo.full_name)}
                        >
                          <div className="repo-item__checkbox" />
                          <div className="repo-item__info">
                            <span className="repo-item__name">{repo.name}</span>
                            <span className="repo-item__badge">
                              {repo.private ? "Private" : "Public"}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}

          {/* Save Button */}
          <div className="btn-group" style={{ marginTop: 24 }}>
            <button
              className="btn btn--primary"
              onClick={saveSettings}
              disabled={saving}
            >
              {saving ? "저장 중..." : "설정 저장"}
            </button>
          </div>
        </div>
      )}

      {/* Drafts Tab */}
      {activeTab === "drafts" && (
        <div className="settings-content">
          {drafts.length === 0 ? (
            <div className="empty-state" style={{ padding: "48px 20px" }}>
              <div className="empty-state__icon">📝</div>
              <h2 className="empty-state__title">초안이 없습니다</h2>
              <p className="empty-state__text">
                자동 포스팅으로 생성된 초안이 여기에 표시됩니다
              </p>
            </div>
          ) : (
            <div className="drafts-list">
              {drafts.map((draft) => (
                <div key={draft.id} className="draft-card">
                  <div className="draft-card__header">
                    <div className="draft-card__meta">
                      <span className="draft-card__badge">초안</span>
                      {draft.repo && (
                        <span className="post-card__repo">{draft.repo}</span>
                      )}
                      <span className="post-card__date">{draft.date}</span>
                    </div>
                    <h3 className="draft-card__title">{draft.title}</h3>
                    <p className="draft-card__summary">{draft.summary}</p>
                  </div>

                  {draft.tags?.length > 0 && (
                    <div className="post-card__tags" style={{ marginBottom: 12 }}>
                      {draft.tags.map((tag) => (
                        <span key={tag} className="tag">#{tag}</span>
                      ))}
                    </div>
                  )}

                  <button
                    className="btn btn--secondary"
                    onClick={() => setExpandedDraft(expandedDraft === draft.id ? null : draft.id)}
                    style={{ marginBottom: 12, padding: "6px 14px", fontSize: 13 }}
                  >
                    {expandedDraft === draft.id ? "내용 접기" : "내용 보기"}
                  </button>

                  {expandedDraft === draft.id && (
                    <div className="draft-card__content">
                      <PostContent content={draft.content} />
                    </div>
                  )}

                  <div className="btn-group">
                    <button
                      className="btn btn--success"
                      onClick={() => handleDraftAction(draft.id, "publish")}
                      style={{ padding: "8px 16px", fontSize: 13 }}
                    >
                      ✓ 게시하기
                    </button>
                    <button
                      className="btn btn--danger"
                      onClick={() => handleDraftAction(draft.id, "delete")}
                      style={{ padding: "8px 16px", fontSize: 13 }}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";
import { Checkbox } from "@/components/ui/Checkbox";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/routing";
import { CommitInfo, Repo, SubscriptionInfo as UsageInfo } from "@/lib/types";
import { formatShortDate } from "@/lib/date";
import { useTranslations, useLocale } from "next-intl";
import { LoginRequired } from "@/components/ui/LoginRequired";
import { useConfirm } from "@/components/ConfirmProvider";

type Status =
  | "idle"
  | "loading-commits"
  | "selecting"
  | "generating"
  | "preview"
  | "publishing"
  | "done"
  | "error";

export default function GenerateForm() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Generate");
  const commonT = useTranslations("Common");
  const { data: session, status: sessionStatus } = useSession();
  const confirm = useConfirm();

  const [repos, setRepos] = useState<Repo[]>([]);
  const [repo, setRepo] = useState("");
  const [commits, setCommits] = useState<CommitInfo[]>([]);
  const [processedShas, setProcessedShas] = useState<string[]>([]);
  const [selectedShas, setSelectedShas] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [userContext, setUserContext] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetch("/api/github/repos")
        .then((r) => {
          if (!r.ok)
            throw new Error(
              r.status === 401 ? t("authError") : t("repoLoadError")
            );
          return r.json();
        })
        .then((d) => {
          if (d.repos) setRepos(d.repos);
        })
        .catch((err) => {
          console.error("Failed to load repos:", err);
          setError(err.message);
        });
      fetch("/api/subscription")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d) setUsage(d);
        })
        .catch(console.error);
    }
  }, [session, t]);

  // 레포 변경 시 localStorage에서 userContext 복원
  useEffect(() => {
    if (!repo) {
      setUserContext("");
      return;
    }
    try {
      const saved = localStorage.getItem(`synapso_user_context_${repo}`);
      setUserContext(saved || "");
    } catch {
      // localStorage 사용 불가 시 무시
    }
  }, [repo]);

  if (sessionStatus === "loading") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 md:py-16 animate-pulse">
        <div className="h-9 w-56 bg-surface-subtle rounded-md mb-2" />
        <div className="h-4 w-80 bg-surface-subtle rounded-md mb-8" />
        <div className="space-y-4">
          <div className="h-12 w-full bg-surface-subtle rounded-lg" />
          <div className="h-12 w-full bg-surface-subtle rounded-lg" />
          <div className="h-32 w-full bg-surface-subtle rounded-lg" />
          <div className="h-12 w-40 bg-surface-subtle rounded-lg" />
        </div>
      </div>
    );
  }

  if (!session) {
    return <LoginRequired />;
  }

  const handleUserContextChange = (value: string) => {
    setUserContext(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      try {
        localStorage.setItem(`synapso_user_context_${repo}`, value);
      } catch {
        // localStorage quota exceeded 시 무시
      }
    }, 500);
  };

  const fetchCommits = async () => {
    if (!repo) {
      setError(t("selectRepoError"));
      return;
    }
    const selectedRepo = repos.find((r) => r.name === repo);
    const owner = selectedRepo
      ? selectedRepo.full_name.split("/")[0]
      : session?.user?.name || "";
    setStatus("loading-commits");
    setError("");
    setStatusMessage(t("loadingCommits"));
    try {
      const res = await fetch(
        `/api/github?${new URLSearchParams({ owner, repo })}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const used = data.processedShas || [];
      setCommits(data.commits);
      setProcessedShas(used);
      setSelectedShas(
        data.commits
          .map((c: CommitInfo) => c.sha)
          .filter((sha: string) => !used.includes(sha))
      );
      setStatus("selecting");
      setStatusMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch commits");
      setStatus("error");
      setStatusMessage("");
    }
  };

  const toggleCommit = (sha: string) =>
    setSelectedShas((prev) =>
      prev.includes(sha) ? prev.filter((s) => s !== sha) : [...prev, sha]
    );
  const selectAll = () => setSelectedShas(commits.map((c) => c.sha));
  const deselectAll = () => setSelectedShas([]);

  const generatePost = async () => {
    if (selectedShas.length === 0) {
      setError(t("selectCommitError"));
      return;
    }

    // 컨텍스트 미입력 시 소프트 경고
    if (!userContext.trim()) {
      const isConfirmed = await confirm({
        title: t("contextLabel"),
        description: t("contextWarning"),
        confirmText: t("generateBtn"),
      });
      if (!isConfirmed) {
        document.getElementById("synapso-user-context")?.focus();
        return;
      }
    }

    setStatus("generating");
    setError("");
    setStatusMessage(t("generating"));
    const selectedRepo = repos.find((r) => r.name === repo);
    const owner = selectedRepo
      ? selectedRepo.full_name.split("/")[0]
      : session?.user?.name || "";
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner,
          repo,
          commitShas: selectedShas,
          userContext: userContext.trim() || undefined,
          isPublic: !(selectedRepo?.private ?? false),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      router.push(`/jobs?new=${data.jobId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
      setStatus("error");
      setStatusMessage("");
    }
  };

  const reset = () => {
    setCommits([]);
    setSelectedShas([]);
    setProcessedShas([]);
    setStatus("idle");
    setError("");
    setStatusMessage("");
  };

  const charCount = userContext.length;
  const charCountColor =
    charCount >= 500
      ? "text-error"
      : charCount >= 450
      ? "text-yellow-500"
      : "text-text-tertiary";

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 md:py-16 animate-fade-in-up">
      <div className="flex items-start justify-between mb-2">
        <h1 className="text-3xl font-display font-bold">{t("title")}</h1>
        {usage && (
          <div className="text-right">
            <div className="text-xs text-text-tertiary mb-1">{t("usage")}</div>
            <div
              className={`text-sm font-mono font-semibold ${
                usage.remaining === 0
                  ? "text-error"
                  : usage.remaining <= 1
                  ? "text-yellow-500"
                  : "text-text-primary"
              }`}
            >
              {usage.usageCount} /{" "}
              {usage.monthlyLimit === 999999 ? "∞" : usage.monthlyLimit}
            </div>
          </div>
        )}
      </div>
      <p className="text-text-secondary mb-8">{t("desc")}</p>

      {error && (
        <div className="border border-error/50 bg-error/10 rounded-xl p-4 mb-6 text-sm text-error">
          ⚠ {error}
        </div>
      )}
      {statusMessage && (
        <div className="border border-border-subtle rounded-xl p-4 mb-6 text-sm text-text-secondary text-center">
          {statusMessage}
        </div>
      )}

      {/* Step 1: 레포 선택 */}
      {(status === "idle" ||
        status === "loading-commits" ||
        status === "error") && (
        <div className="border border-border-subtle rounded-xl p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("owner")}{" "}
                <span className="text-text-tertiary font-normal">
                  {t("autoDetect")}
                </span>
              </label>
              <input
                type="text"
                className="w-full bg-surface border border-border-subtle rounded-lg px-4 py-3 text-sm"
                value={session?.user?.name || ""}
                readOnly
                disabled
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("repoLabel")}</label>
              <select
                className="w-full bg-surface border border-border-subtle rounded-lg px-4 py-3 text-sm text-text-secondary focus:outline-none focus:border-border-strong cursor-pointer"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
              >
                <option value="">{t("selectRepo")}</option>
                {repos.map((r) => (
                  <option key={r.name} value={r.name}>
                    {r.name} ({r.private ? "Private" : "Public"})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={fetchCommits}
              disabled={status === "loading-commits" || !repo}
              className="px-6 py-3 bg-accent text-black font-semibold rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50 cursor-pointer"
            >
              {status === "loading-commits"
                ? commonT("loading")
                : t("fetchCommits")}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: 커밋 선택 + userContext 입력 */}
      {(status === "selecting" || status === "generating") && (
        <div className="border border-border-subtle rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t("commitList")}</h2>
            <span className="text-sm text-text-secondary">
              {selectedShas.length}/{commits.length} {t("selected")}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={selectAll}
              className="px-3 py-1.5 border border-border-subtle rounded-lg text-xs text-text-secondary hover:border-border-strong transition-colors cursor-pointer"
            >
              {t("selectAll")}
            </button>
            <button
              onClick={deselectAll}
              className="px-3 py-1.5 border border-border-subtle rounded-lg text-xs text-text-secondary hover:border-border-strong transition-colors cursor-pointer"
            >
              {t("deselectAll")}
            </button>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {commits.map((commit) => {
              const selected = selectedShas.includes(commit.sha);
              const isProcessed = processedShas.includes(commit.sha);
              const dateStr = commit.date
                ? formatShortDate(commit.date, locale)
                : "";
              return (
                <div
                  key={commit.sha}
                  role="checkbox"
                  aria-checked={selected}
                  tabIndex={0}
                  onClick={() => toggleCommit(commit.sha)}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") {
                      e.preventDefault();
                      toggleCommit(commit.sha);
                    }
                  }}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    selected
                      ? "border-border-strong bg-elevated"
                      : "border-border-subtle hover:border-border-strong"
                  } ${isProcessed ? "opacity-75" : ""}`}
                >
                  <Checkbox checked={selected} />
                  <div className="min-w-0 flex-1">
                    <div
                      className={`text-sm font-medium truncate ${
                        selected ? "text-text-primary" : "text-text-secondary"
                      }`}
                    >
                      {commit.message.split("\n")[0]}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-text-tertiary flex-wrap">
                      <span className="px-1.5 py-0.5 bg-surface rounded font-mono">
                        {commit.sha.substring(0, 7)}
                      </span>
                      {isProcessed && (
                        <span className="px-1.5 py-0.5 bg-border-subtle text-text-secondary rounded">
                          Used
                        </span>
                      )}
                      <span>{commit.author}</span>
                      <span>{dateStr}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* userContext 입력 영역 */}
          <div className="space-y-2 pt-2">
            <label
              htmlFor="synapso-user-context"
              className="text-sm font-medium text-text-primary"
            >
              {t("contextLabel")}
            </label>
            <div className="border-l-2 border-accent bg-accent/5 rounded-r-lg px-3 py-2 text-sm text-text-secondary">
              {t("contextBanner")}
            </div>
            <textarea
              id="synapso-user-context"
              value={userContext}
              onChange={(e) => handleUserContextChange(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder={t("contextPlaceholder")}
              className="w-full bg-surface border border-border-subtle rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border-strong resize-none"
            />
            <div className="flex justify-end">
              <span
                className={`text-xs ${charCountColor}`}
                aria-live="polite"
              >
                {charCount}/500
              </span>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              onClick={reset}
              className="px-4 py-2 border border-border-subtle rounded-lg text-sm text-text-secondary hover:border-border-strong transition-colors cursor-pointer"
            >
              {commonT("cancel")}
            </button>
            <button
              onClick={generatePost}
              disabled={
                status === "generating" || selectedShas.length === 0
              }
              className="px-6 py-2 bg-accent text-black font-semibold rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50 cursor-pointer"
            >
              {status === "generating" ? t("generating") : t("generateBtn")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

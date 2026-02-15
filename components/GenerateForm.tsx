"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { CommitInfo } from "@/lib/types";
import PostContent from "./PostContent";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

type Status = "idle" | "loading-commits" | "selecting" | "generating" | "preview" | "publishing" | "done" | "error";

interface Repo {
  name: string;
  full_name: string;
  private: boolean;
}

interface GenerateResult {
  title: string;
  content: string;
  summary: string;
  tags: string[];
  commits: string[];
  repo: string;
  slug?: string;
  id?: string;
}

export default function GenerateForm() {
  const { data: session } = useSession();
  const [repos, setRepos] = useState<Repo[]>([]);
  const [repo, setRepo] = useState("");
  const [commits, setCommits] = useState<CommitInfo[]>([]);
  const [selectedShas, setSelectedShas] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [statusMessage, setStatusMessage] = useState("");

  if (!session) {
    return (
      <div className="generate-page animate-in">
        <h1 className="generate-page__title">새 포스트 생성</h1>
        <p className="generate-page__subtitle">
          GitHub 레포지토리의 커밋을 AI가 분석하여 블로그 글을 자동으로 작성합니다
        </p>
        <div className="status-message status-message--info" style={{ marginTop: 32, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
          <p>글 생성 기능을 이용하려면 로그인이 필요합니다.</p>
          <a href="/api/auth/signin" className="btn btn--primary">
            로그인하기
          </a>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (session?.accessToken) {
      fetch("/api/github/repos")
        .then((res) => res.json())
        .then((data) => {
          if (data.repos) setRepos(data.repos);
        })
        .catch((err) => console.error("Failed to fetch repos", err));
    }
  }, [session]);

  const fetchCommits = async () => {
    if (!repo) {
      setError("Repository를 선택해주세요.");
      return;
    }

    const owner = session?.user?.name || session?.user?.email?.split("@")[0] || ""; // Fallback

    // Find owner from selected repo url if possible, or just use session user
    // The API expects owner/repo. 
    // Actually, getUserRepos returns full_name "owner/repo". 
    // Let's use full_name from the selected repo.
    const selectedRepo = repos.find(r => r.name === repo);
    const repoOwner = selectedRepo ? selectedRepo.full_name.split("/")[0] : owner;

    setStatus("loading-commits");
    setError("");
    setStatusMessage("커밋 목록을 불러오는 중...");

    try {
      const params = new URLSearchParams({ owner: repoOwner, repo });
      // Removed since/until

      const res = await fetch(`/api/github?${params}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setCommits(data.commits);
      setSelectedShas(data.commits.map((c: CommitInfo) => c.sha));
      setStatus("selecting");
      setStatusMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "커밋 조회 실패");
      setStatus("error");
      setStatusMessage("");
    }
  };

  const toggleCommit = (sha: string) => {
    setSelectedShas((prev) =>
      prev.includes(sha)
        ? prev.filter((s) => s !== sha)
        : [...prev, sha]
    );
  };

  const selectAll = () => {
    setSelectedShas(commits.map((c) => c.sha));
  };

  const deselectAll = () => {
    setSelectedShas([]);
  };

  const generatePost = async () => {
    if (selectedShas.length === 0) {
      setError("최소 1개의 커밋을 선택해주세요.");
      return;
    }

    setStatus("generating");
    setError("");
    setStatusMessage("AI가 변경사항을 분석하고 글을 작성하는 중...");

    const selectedRepo = repos.find(r => r.name === repo);
    const repoOwner = selectedRepo ? selectedRepo.full_name.split("/")[0] : session?.user?.name || "";

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: repoOwner,
          repo,
          commitShas: selectedShas,
          publish: false,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResult(data);
      setStatus("preview");
      setStatusMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "글 생성 실패");
      setStatus("error");
      setStatusMessage("");
    }
  };

  const publishPost = async () => {
    if (!result) return;

    setStatus("publishing");
    setStatusMessage("포스트 게시 중...");

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResult({ ...result, slug: data.slug, id: data.id });
      setStatus("done");
      setStatusMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "게시 실패");
      setStatus("error");
      setStatusMessage("");
    }
  };

  const reset = () => {
    setCommits([]);
    setSelectedShas([]);
    setResult(null);
    setStatus("idle");
    setError("");
    setStatusMessage("");
  };

  return (
    <div className="generate-page animate-in">
      <h1 className="generate-page__title">새 포스트 생성</h1>
      <p className="generate-page__subtitle">
        GitHub 레포지토리의 커밋을 AI가 분석하여 블로그 글을 자동으로 작성합니다
      </p>

      {error && (
        <div className="status-message status-message--error">
          ⚠ {error}
        </div>
      )}

      {statusMessage && (
        <div className="status-message status-message--info">
          <div className="loading-spinner">
            <span className="loading-spinner__dot" />
            <span className="loading-spinner__dot" />
            <span className="loading-spinner__dot" />
          </div>
          {statusMessage}
        </div>
      )}

      {status === "done" && result?.slug && (
        <div className="status-message status-message--success">
          ✓ 포스트가 성공적으로 게시되었습니다!{" "}
          <a href={`/posts/${result.id}`} style={{ color: "inherit", fontWeight: 600 }}>
            글 보기 →
          </a>
        </div>
      )}

      {/* Step 1: Repository Input */}
      {(status === "idle" || status === "loading-commits" || status === "error") && (
        <>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Owner <span className="form-label__hint">(자동 감지)</span>
              </label>
              <input
                type="text"
                className="form-input"
                value={session?.user?.name || "로그인 필요"}
                readOnly
                disabled
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                Repository <span className="form-label__hint">(선택)</span>
              </label>
              <select
                className="form-input"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
              >
                <option value="">레포지토리 선택</option>
                {repos.map((r) => (
                  <option key={r.name} value={r.name}>
                    {r.name} ({r.private ? "Private" : "Public"})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            className="btn btn--primary"
            onClick={fetchCommits}
            disabled={status === "loading-commits"}
          >
            {status === "loading-commits" ? "로딩 중..." : "커밋 조회"}
          </button>
        </>
      )}

      {/* Step 2: Commit Selection */}
      {(status === "selecting" || status === "generating") && (
        <div className="commit-list">
          <div className="commit-list__title">
            커밋 목록
            <span className="commit-list__count">
              {selectedShas.length}/{commits.length} 선택됨
            </span>
          </div>

          <div className="btn-group" style={{ marginBottom: 16 }}>
            <button className="btn btn--secondary" onClick={selectAll} style={{ padding: "6px 14px", fontSize: 13 }}>
              전체 선택
            </button>
            <button className="btn btn--secondary" onClick={deselectAll} style={{ padding: "6px 14px", fontSize: 13 }}>
              전체 해제
            </button>
          </div>

          {commits.map((commit) => {
            const selected = selectedShas.includes(commit.sha);
            const dateStr = commit.date
              ? format(new Date(commit.date), "M/d HH:mm", { locale: ko })
              : "";
            return (
              <div
                key={commit.sha}
                className={`commit-item ${selected ? "commit-item--selected" : ""}`}
                onClick={() => toggleCommit(commit.sha)}
              >
                <div className="commit-item__checkbox" />
                <div className="commit-item__info">
                  <div className="commit-item__message">
                    {commit.message.split("\n")[0]}
                  </div>
                  <div className="commit-item__meta">
                    <span className="commit-item__sha">
                      {commit.sha.substring(0, 7)}
                    </span>
                    <span>{commit.author}</span>
                    <span>{dateStr}</span>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="btn-group" style={{ marginTop: 20 }}>
            <button
              className="btn btn--primary"
              onClick={generatePost}
              disabled={status === "generating" || selectedShas.length === 0}
            >
              {status === "generating" ? "AI 분석 중..." : "✦ AI 글 생성"}
            </button>
            <button className="btn btn--secondary" onClick={reset}>
              처음으로
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Preview */}
      {(status === "preview" || status === "publishing" || status === "done") && result && (
        <div className="preview-section">
          <div className="preview-section__label">미리보기</div>
          <h2 className="preview-section__title">{result.title}</h2>

          {result.tags.length > 0 && (
            <div className="post-card__tags" style={{ marginBottom: 24 }}>
              {result.tags.map((tag) => (
                <span key={tag} className="tag">#{tag}</span>
              ))}
            </div>
          )}

          <PostContent content={result.content} />

          {status !== "done" && (
            <div className="btn-group" style={{ marginTop: 32 }}>
              <button
                className="btn btn--success"
                onClick={publishPost}
                disabled={status === "publishing"}
              >
                {status === "publishing" ? "게시 중..." : "✓ 게시하기"}
              </button>
              <button className="btn btn--secondary" onClick={() => setStatus("selecting")}>
                다시 생성
              </button>
              <button className="btn btn--secondary" onClick={reset}>
                처음으로
              </button>
            </div>
          )}

          {status === "done" && (
            <div className="btn-group" style={{ marginTop: 32 }}>
              <a href={`/posts/${result.id}`} className="btn btn--primary">
                글 보기 →
              </a>
              <button className="btn btn--secondary" onClick={reset}>
                새 글 생성
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

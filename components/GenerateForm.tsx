"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CommitInfo, GenerateResult } from "@/lib/types";
import PostContent from "./PostContent";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

type Status = "idle" | "loading-commits" | "selecting" | "generating" | "preview" | "publishing" | "done" | "error";

interface Repo { name: string; full_name: string; private: boolean; }

export default function GenerateForm() {
  const router = useRouter();
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
      <div className="max-w-3xl mx-auto px-4 py-16 animate-fade-in-up">
        <h1 className="text-3xl font-display font-bold mb-2">새 포스트 생성</h1>
        <p className="text-text-secondary mb-8">GitHub 레포지토리의 커밋을 AI가 분석하여 블로그 글을 자동으로 작성합니다</p>
        <div className="border border-border-subtle rounded-xl p-8 text-center">
          <p className="text-text-secondary mb-4">글 생성 기능을 이용하려면 로그인이 필요합니다.</p>
          <a href="/api/auth/signin" className="inline-block px-6 py-3 bg-accent text-black font-semibold rounded-lg">로그인하기</a>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (session?.accessToken) {
      fetch("/api/github/repos").then(r => r.json()).then(d => { if (d.repos) setRepos(d.repos); }).catch(console.error);
    }
  }, [session]);

  const fetchCommits = async () => {
    if (!repo) { setError("Repository를 선택해주세요."); return; }
    const selectedRepo = repos.find(r => r.name === repo);
    const owner = selectedRepo ? selectedRepo.full_name.split("/")[0] : session?.user?.name || "";
    setStatus("loading-commits"); setError(""); setStatusMessage("커밋 목록을 불러오는 중...");
    try {
      const res = await fetch(`/api/github?${new URLSearchParams({ owner, repo })}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCommits(data.commits); setSelectedShas(data.commits.map((c: CommitInfo) => c.sha)); setStatus("selecting"); setStatusMessage("");
    } catch (err) { setError(err instanceof Error ? err.message : "커밋 조회 실패"); setStatus("error"); setStatusMessage(""); }
  };

  const toggleCommit = (sha: string) => setSelectedShas(prev => prev.includes(sha) ? prev.filter(s => s !== sha) : [...prev, sha]);
  const selectAll = () => setSelectedShas(commits.map(c => c.sha));
  const deselectAll = () => setSelectedShas([]);

  const generatePost = async () => {
    if (selectedShas.length === 0) { setError("최소 1개의 커밋을 선택해주세요."); return; }
    setStatus("generating"); setError(""); setStatusMessage("백그라운드에서 분석 작업을 시작하는 중...");
    const selectedRepo = repos.find(r => r.name === repo);
    const owner = selectedRepo ? selectedRepo.full_name.split("/")[0] : session?.user?.name || "";
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, repo, commitShas: selectedShas })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // 즉시 작업 관리 페이지로 이동
      router.push(`/jobs?new=${data.jobId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "작업 요청 실패");
      setStatus("error");
      setStatusMessage("");
    }
  };

  const publishPostFromJob = async (jobResult: GenerateResult) => {
    setStatus("publishing"); setStatusMessage("포스트 게시 중...");
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...jobResult, status: "draft" })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = "/settings"; // 초안 관리 탭으로 이동
    } catch (err) {
      setError(err instanceof Error ? err.message : "게시 실패");
      setStatus("error");
    }
  };

  const reset = () => { setCommits([]); setSelectedShas([]); setResult(null); setStatus("idle"); setError(""); setStatusMessage(""); };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 md:py-16 animate-fade-in-up">
      <h1 className="text-3xl font-display font-bold mb-2">새 포스트 생성</h1>
      <p className="text-text-secondary mb-8">GitHub 레포지토리의 커밋을 AI가 분석하여 블로그 글을 자동으로 작성합니다</p>

      {error && <div className="border border-error/50 bg-error/10 rounded-xl p-4 mb-6 text-sm text-error">⚠ {error}</div>}
      {statusMessage && <div className="border border-border-subtle rounded-xl p-4 mb-6 text-sm text-text-secondary text-center">{statusMessage}</div>}
      {status === "done" && result?.slug && (
        <div className="border border-success/50 bg-success/10 rounded-xl p-4 mb-6 text-sm text-success flex items-center justify-between">
          <span>✓ 포스트가 성공적으로 게시되었습니다!</span>
          <a href={`/posts/${result.id}`} className="px-3 py-1 border border-success/50 rounded-lg text-xs font-medium hover:bg-success/20 transition-colors">글 보기 →</a>
        </div>
      )}

      {/* Step 1 */}
      {(status === "idle" || status === "loading-commits" || status === "error") && (
        <div className="border border-border-subtle rounded-xl p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Owner <span className="text-text-tertiary font-normal">(자동 감지)</span></label>
              <input type="text" className="w-full bg-surface border border-border-subtle rounded-lg px-4 py-3 text-sm" value={session?.user?.name || "로그인 필요"} readOnly disabled />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Repository <span className="text-text-tertiary font-normal">(선택)</span></label>
              <select className="w-full bg-surface border border-border-subtle rounded-lg px-4 py-3 text-sm text-text-secondary focus:outline-none focus:border-border-strong cursor-pointer" value={repo} onChange={e => setRepo(e.target.value)}>
                <option value="">레포지토리 선택</option>
                {repos.map(r => <option key={r.name} value={r.name}>{r.name} ({r.private ? "Private" : "Public"})</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={fetchCommits} disabled={status === "loading-commits" || !repo} className="px-6 py-3 bg-accent text-black font-semibold rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50 cursor-pointer">
              {status === "loading-commits" ? "로딩 중..." : "커밋 조회"}
            </button>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {(status === "selecting" || status === "generating") && (
        <div className="border border-border-subtle rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">커밋 목록</h2>
            <span className="text-sm text-text-secondary">{selectedShas.length}/{commits.length} 선택됨</span>
          </div>
          <div className="flex gap-2">
            <button onClick={selectAll} className="px-3 py-1.5 border border-border-subtle rounded-lg text-xs text-text-secondary hover:border-border-strong transition-colors cursor-pointer">전체 선택</button>
            <button onClick={deselectAll} className="px-3 py-1.5 border border-border-subtle rounded-lg text-xs text-text-secondary hover:border-border-strong transition-colors cursor-pointer">전체 해제</button>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {commits.map(commit => {
              const selected = selectedShas.includes(commit.sha);
              const dateStr = commit.date ? format(new Date(commit.date), "M/d HH:mm", { locale: ko }) : "";
              return (
                <div key={commit.sha} onClick={() => toggleCommit(commit.sha)} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selected ? "border-border-strong bg-elevated" : "border-border-subtle hover:border-border-strong"}`}>
                  <div className={`w-5 h-5 mt-0.5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${selected ? "border-accent bg-accent" : "border-border-strong"}`}>
                    {selected && <span className="text-black text-xs font-bold">✓</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={`text-sm font-medium truncate ${selected ? "text-text-primary" : "text-text-secondary"}`}>{commit.message.split("\n")[0]}</div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-text-tertiary">
                      <span className="px-1.5 py-0.5 bg-surface rounded font-mono">{commit.sha.substring(0, 7)}</span>
                      <span>{commit.author}</span>
                      <span>{dateStr}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={reset} className="px-4 py-2 border border-border-subtle rounded-lg text-sm text-text-secondary hover:border-border-strong transition-colors cursor-pointer">처음으로</button>
            <button onClick={generatePost} disabled={status === "generating" || selectedShas.length === 0} className="px-6 py-2 bg-accent text-black font-semibold rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50 cursor-pointer">
              {status === "generating" ? "AI 분석 중..." : "✦ AI 글 생성"}
            </button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {(status === "preview" || status === "publishing" || status === "done") && result && (
        <div className="border border-border-subtle rounded-xl p-6 space-y-6">
          <div>
            <span className="inline-block px-2 py-0.5 border border-border-subtle rounded-full text-xs text-text-tertiary mb-3">미리보기</span>
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-3">{result.title}</h2>
            {result.tags.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-4">
                {result.tags.map(tag => <span key={tag} className="text-xs text-text-tertiary">#{tag}</span>)}
              </div>
            )}
          </div>
          <div className="bg-elevated rounded-lg p-6"><PostContent content={result.content} /></div>
          {status !== "done" && (
            <div className="flex gap-3 justify-end">
              <button onClick={reset} className="px-4 py-2 border border-border-subtle rounded-lg text-sm text-text-secondary hover:border-border-strong transition-colors cursor-pointer">처음으로</button>
              <button onClick={() => setStatus("selecting")} className="px-4 py-2 border border-border-subtle rounded-lg text-sm text-text-secondary hover:border-border-strong transition-colors cursor-pointer">다시 생성</button>
              <button onClick={() => result && publishPostFromJob(result)} disabled={status === "publishing"} className="px-6 py-2 bg-success text-black font-semibold rounded-lg hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer">
                {status === "publishing" ? "게시 중..." : "✓ 게시하기"}
              </button>
            </div>
          )}
          {status === "done" && (
            <div className="flex gap-3 justify-end">
              <button onClick={reset} className="px-4 py-2 border border-border-subtle rounded-lg text-sm text-text-secondary hover:border-border-strong transition-colors cursor-pointer">새 글 생성</button>
              <a href={`/posts/${result.id}`} className="px-6 py-2 bg-accent text-black font-semibold rounded-lg hover:bg-accent-hover transition-colors">글 보기 →</a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

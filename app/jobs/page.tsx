"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { AIJob, GenerateResult } from "@/lib/types";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import Link from "next/link";
import PostContent from "@/components/PostContent";
import { toast } from "sonner";
import { useConfirm } from "@/components/ConfirmProvider";

export default function JobsPage() {
  const { data: session } = useSession();
  const confirm = useConfirm();
  const [jobs, setJobs] = useState<AIJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      loadJobs();
      const interval = setInterval(loadJobs, 5000); // 5초마다 자동 리로드
      return () => clearInterval(interval);
    }
  }, [session]);

  const loadJobs = async () => {
    try {
      const res = await fetch("/api/jobs");
      const data = await res.json();
      if (data.jobs) setJobs(data.jobs);
    } catch (err) {
      console.error("Job 로드 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (job: AIJob) => {
    if (!job.result) return;
    if (publishing) return; // 중복 클릭 방지

    const isConfirmed = await confirm({
      title: "초안 생성",
      description: "✨ 이 작업 결과를 바탕으로 초안을 생성하시겠습니까?",
      confirmText: "초안 생성",
    });
    if (!isConfirmed) return;

    setPublishing(job.id);
    try {
      // 1. 초안 생성
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...job.result, status: "draft", jobId: job.id }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "초안 생성에 실패했습니다.");
      }

      // 2. 작업 내역 삭제 (DB)
      const delRes = await fetch(`/api/jobs/${job.id}`, { method: "DELETE" });
      if (!delRes.ok) {
        console.warn("작업 내역 삭제 실패:", await delRes.text());
        // 삭제에 실패하더라도 이미 초안은 생성되었으므로 사용자에게 알리고 목록에서 로컬 삭제 시도
      }

      // 3. 로컬 상태 업데이트 (성공한 경우에만 또는 강제로)
      setJobs(prev => prev.filter(j => j.id !== job.id));
      toast.success("🎉 초안이 성공적으로 생성되었습니다!", {
        description: "설정 > 초안 관리 탭에서 확인 및 게시할 수 있습니다."
      });
    } catch (err) {
      toast.error("❌ 초안 생성에 실패했습니다.", {
        description: err instanceof Error ? err.message : "알 수 없는 오류"
      });
      console.error("Publish error:", err);
    } finally {
      setPublishing(null);
    }
  };

  const handleDeleteJob = async (id: string) => {
    if (publishing) return; // 작업 처리 중 삭제 방지

    const isConfirmed = await confirm({
      title: "작업 내역 삭제",
      description: "🚨 이 작업 내역을 영구적으로 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.",
      confirmText: "삭제",
      destructive: true,
    });
    if (!isConfirmed) return;

    try {
      const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
      if (res.ok) {
        setJobs(prev => prev.filter(j => j.id !== id));
      } else {
        const data = await res.json();
        throw new Error(data.error || "작업 내역 삭제에 실패했습니다.");
      }
      toast.success("🗑️ 작업 내역이 깔끔하게 삭제되었습니다.");
    } catch (err) {
      toast.error("❌ 삭제 중 오류가 발생했습니다.", {
        description: err instanceof Error ? err.message : "알 수 없는 오류"
      });
    }
  };

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-display font-bold mb-4">로그인 필요</h1>
        <p className="text-text-secondary mb-8">작성 중인 분석 작업을 확인하려면 로그인이 필요합니다.</p>
        <Link href="/login" className="px-6 py-3 bg-accent text-black font-semibold rounded-lg">로그인하기</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-16 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold mb-2">분석 작업 현황</h1>
          <p className="text-text-secondary text-sm">AI가 백그라운드에서 진행 중인 분석 작업과 완료된 내역을 확인합니다</p>
        </div>
        <div className="flex gap-2">
          <Link href="/settings?tab=drafts" className="px-4 py-2 border border-border-subtle rounded-lg text-sm text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors">
            초안 관리함 →
          </Link>
          <Link href="/generate" className="px-4 py-2 border border-border-strong rounded-lg text-sm bg-surface hover:bg-elevated transition-colors">
            + 새 분석 요청
          </Link>
        </div>
      </div>

      {loading && jobs.length === 0 ? (
        <div className="text-center py-20 text-text-secondary">작업 목록을 불러오는 중...</div>
      ) : jobs.length === 0 ? (
        <div className="border border-border-subtle rounded-2xl p-20 text-center">
          <div className="text-5xl mb-4 opacity-50">⏳</div>
          <h2 className="text-xl font-semibold mb-2">아직 진행한 작업이 없습니다</h2>
          <p className="text-text-secondary mb-6 text-sm"> GitHub 커밋을 선택하여 분석을 시작해 보세요.</p>
          <Link href="/generate" className="px-8 py-3 bg-accent text-black font-semibold rounded-lg hover:bg-accent-hover transition-colors">분석 시작하기</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="border border-border-subtle rounded-xl p-6 bg-surface/30 hover:border-border-strong transition-all overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${job.status === "completed" ? "bg-success/20 text-success border border-success/30" :
                      job.status === "failed" ? "bg-error/20 text-error border border-error/30" :
                        job.status === "processing" ? "bg-accent/20 text-accent border border-accent/30 animate-pulse" :
                          "bg-elevated text-text-tertiary border border-border-subtle"
                      }`}>
                      {job.status === "completed" ? "완료" :
                        job.status === "failed" ? "실패" :
                          job.status === "processing" ? "분석 중" : "대기 중"}
                    </span>
                    <span className="text-xs text-text-tertiary">{format(new Date(job.created_at), "yyyy.MM.dd HH:mm:ss", { locale: ko })}</span>
                    <span className="text-xs font-mono text-text-tertiary px-1.5 py-0.5 bg-elevated rounded">{job.repo}</span>
                  </div>
                  <h3 className="text-lg font-semibold truncate mb-1">
                    {job.result?.title || `${job.commit_shas.length}건의 커밋 분석 작업`}
                  </h3>
                  {job.status === "failed" && job.error && (
                    <p className="text-xs text-error mt-1">⚠ {job.error}</p>
                  )}
                  {job.status === "processing" && (
                    <div className="w-full h-1 bg-elevated rounded-full mt-3 overflow-hidden">
                      <div className="h-full bg-accent animate-shimmer" style={{ width: "100%", backgroundSize: "200% 100%" }} />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {job.status === "completed" && job.result && (
                    <>
                      <button
                        onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                        className="px-4 py-2 text-sm border border-border-strong rounded-lg hover:bg-elevated transition-colors"
                      >
                        {expandedJob === job.id ? "내용 접기 ▲" : "미리보기 ▼"}
                      </button>
                      <button
                        onClick={() => handlePublish(job)}
                        disabled={publishing === job.id}
                        className="px-4 py-2 text-sm bg-success text-black font-semibold rounded-lg hover:opacity-90 transition-all"
                      >
                        {publishing === job.id ? "생성 중..." : "✓ 초안 생성"}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDeleteJob(job.id)}
                    className="p-2 text-text-tertiary hover:text-error transition-colors"
                    title="기록 삭제"
                  >
                    <svg height="18" width="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              </div>

              {expandedJob === job.id && job.result && (
                <div className="mt-6 pt-6 border-t border-border-subtle animate-in slide-in-from-top-4 duration-300">
                  <div className="bg-elevated/50 rounded-xl p-6 mb-4">
                    <h4 className="text-lg font-bold mb-4 border-b border-border-subtle pb-2">{job.result.title}</h4>
                    <PostContent content={job.result.content} />
                  </div>
                  <div className="flex justify-end gap-2 text-xs text-text-tertiary">
                    <span>분석된 태그: {job.result.tags.join(", ")}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

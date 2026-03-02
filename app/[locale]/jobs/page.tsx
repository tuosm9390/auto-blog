"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useRouter, Link } from "@/i18n/routing";
import { AIJob, Post } from "@/lib/types";
import { format } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import PostContent from "@/components/PostContent";
import { toast } from "sonner";
import { useConfirm } from "@/components/ConfirmProvider";
import { useTranslations, useLocale } from "next-intl";

type Tab = "jobs" | "drafts";

export default function JobsPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const confirm = useConfirm();
  const locale = useLocale();
  const t = useTranslations("Jobs");
  const commonT = useTranslations("Common");
  
  const dateLocale = locale === 'ko' ? ko : enUS;
  
  const initialTab = (searchParams.get("tab") as Tab) === "drafts" ? "drafts" : "jobs";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  
  const [jobs, setJobs] = useState<AIJob[]>([]);
  const [drafts, setDrafts] = useState<Post[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [expandedDraft, setExpandedDraft] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      loadData();
      const interval = setInterval(() => {
        if (activeTab === "jobs") loadJobs();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [session, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === "jobs") {
        await loadJobs();
      } else {
        await loadDrafts();
      }
    } finally {
      setLoading(false);
    }
  };

  const loadJobs = async () => {
    try {
      const res = await fetch("/api/jobs");
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch (err) {
      console.error("Job load failed:", err);
    }
  };

  const loadDrafts = async () => {
    try {
      const res = await fetch("/api/posts/drafts");
      if (res.ok) {
        const data = await res.json();
        setDrafts(data.drafts || []);
      }
    } catch (err) {
      console.error("Draft load failed:", err);
    }
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    router.push(`/jobs${tab === "drafts" ? "?tab=drafts" : ""}`);
  };

  const handlePublish = async (job: AIJob) => {
    if (!job.result) return;
    if (publishing) return;

    const isConfirmed = await confirm({
      title: "Create Draft",
      description: "✨ Do you want to create a draft from this result?",
      confirmText: "Create",
    });
    if (!isConfirmed) return;

    setPublishing(job.id);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...job.result, status: "draft", jobId: job.id }),
      });

      if (!res.ok) {
        throw new Error("Failed to create draft.");
      }

      await fetch(`/api/jobs/${job.id}`, { method: "DELETE" });
      setJobs(prev => prev.filter(j => j.id !== job.id));
      toast.success("🎉 Draft created successfully!");
    } catch (err) {
      toast.error("❌ Failed to create draft.");
    } finally {
      setPublishing(null);
    }
  };

  const handleDeleteJob = async (id: string) => {
    const isConfirmed = await confirm({
      title: "Delete Record",
      description: "🚨 Are you sure you want to delete this record permanentally?",
      confirmText: "Delete",
      destructive: true,
    });
    if (!isConfirmed) return;

    try {
      const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
      if (res.ok) {
        setJobs(prev => prev.filter(j => j.id !== id));
        toast.success("🗑️ Deleted successfully.");
      }
    } catch (err) {
      toast.error(commonT("error"));
    }
  };

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-display font-bold mb-4">Login Required</h1>
        <Link href="/login" className="px-6 py-3 bg-accent text-black font-semibold rounded-lg">Sign In</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-16 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold mb-2">{t("title")}</h1>
          <p className="text-text-secondary text-sm">{t("desc")}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/generate" className="px-4 py-2 border border-border-strong rounded-lg text-sm bg-surface hover:bg-elevated transition-colors">
            {t("newPost")}
          </Link>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border-subtle mb-6">
        <button onClick={() => handleTabChange("jobs")} className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${activeTab === "jobs" ? "text-text-primary border-b-2 border-accent" : "text-text-tertiary hover:text-text-secondary"}`}>
          {t("tabJobs")}
        </button>
        <button onClick={() => handleTabChange("drafts")} className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer flex items-center gap-2 ${activeTab === "drafts" ? "text-text-primary border-b-2 border-accent" : "text-text-tertiary hover:text-text-secondary"}`}>
          {t("tabDrafts")}
          {drafts.length > 0 && <span className="px-1.5 py-0.5 bg-accent text-black text-xs rounded-full font-bold">{drafts.length}</span>}
        </button>
      </div>

      {activeTab === "jobs" && (
        <>
          {loading && jobs.length === 0 ? (
            <div className="text-center py-20 text-text-secondary">{t("loading")}</div>
          ) : jobs.length === 0 ? (
            <div className="border border-border-subtle rounded-2xl p-20 text-center">
              <div className="text-5xl mb-4 opacity-50">⏳</div>
              <h2 className="text-xl font-semibold mb-2">{t("empty")}</h2>
              <p className="text-text-secondary mb-6 text-sm">{t("emptyDesc")}</p>
              <Link href="/generate" className="px-8 py-3 bg-accent text-black font-semibold rounded-lg hover:bg-accent-hover transition-colors">{t("startBtn")}</Link>
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
                          {job.status === "completed" ? t("statusCompleted") :
                            job.status === "failed" ? t("statusFailed") :
                              job.status === "processing" ? t("statusProcessing") : t("statusPending")}
                        </span>
                        <span className="text-xs text-text-tertiary">{format(new Date(job.created_at), "yyyy.MM.dd HH:mm", { locale: dateLocale })}</span>
                        <span className="text-xs font-mono text-text-tertiary px-1.5 py-0.5 bg-elevated rounded">{job.repo}</span>
                      </div>
                      <h3 className="text-lg font-semibold truncate mb-1">
                        {job.result?.title || `Commit analysis job (${job.commit_shas.length} commits)`}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      {job.status === "completed" && job.result && (
                        <>
                          <button
                            onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                            className="px-4 py-2 text-sm border border-border-strong rounded-lg hover:bg-elevated transition-colors cursor-pointer"
                          >
                            {expandedJob === job.id ? t("collapse") : t("expand")}
                          </button>
                          <button
                            onClick={() => handlePublish(job)}
                            disabled={publishing === job.id}
                            className="px-4 py-2 text-sm bg-success text-black font-semibold rounded-lg hover:opacity-90 transition-all cursor-pointer"
                          >
                            {publishing === job.id ? t("creating") : t("createDraft")}
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteJob(job.id)}
                        className="p-2 text-text-tertiary hover:text-error transition-colors cursor-pointer"
                        title={t("deleteJob")}
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
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "drafts" && (
        <>
          {loading && drafts.length === 0 ? (
            <div className="text-center py-20 text-text-secondary">{t("loading")}</div>
          ) : drafts.length === 0 ? (
            <div className="border border-border-subtle rounded-xl p-12 text-center">
              <div className="text-5xl opacity-50 mb-4">📝</div>
              <h2 className="text-xl font-semibold mb-2">{t("noDrafts")}</h2>
              <p className="text-text-secondary text-sm mb-6">{t("noDraftsDesc")}</p>
              <Link href="/generate" className="px-6 py-2 bg-accent text-black font-semibold rounded-lg hover:bg-accent-hover transition-colors">{t("newPost")}</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {drafts.map((draft) => (
                <div key={draft.id} className="border border-border-subtle rounded-xl p-6 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-xs">
                      <span className="px-2 py-0.5 bg-accent text-black rounded-full font-semibold">Draft</span>
                      {draft.repo && <span className="px-2 py-0.5 border border-border-subtle rounded-full text-text-tertiary">{draft.repo}</span>}
                      <span className="text-text-tertiary">{format(new Date(draft.date || new Date()), "yyyy.MM.dd HH:mm", { locale: dateLocale })}</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-1">{draft.title}</h3>
                    <p className="text-sm text-text-secondary line-clamp-2">{draft.summary}</p>
                  </div>
                  <button onClick={() => setExpandedDraft(expandedDraft === draft.id ? null : draft.id)} className="text-sm text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer">
                    {expandedDraft === draft.id ? t("collapse") : t("expand")}
                  </button>
                  {expandedDraft === draft.id && (
                    <div className="bg-elevated rounded-lg p-4"><PostContent content={draft.content} /></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

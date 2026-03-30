"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useRouter, Link } from "@/i18n/routing";
import { AIJob, Post } from "@/lib/types";
import { toast } from "sonner";
import { LoginRequired } from "@/components/ui/LoginRequired";
import { useConfirm } from "@/components/ConfirmProvider";
import { useTranslations, useLocale } from "next-intl";
import { JobTabs } from "@/components/jobs/JobTabs";
import { JobCard } from "@/components/jobs/JobCard";
import { DraftCard } from "@/components/jobs/DraftCard";

type Tab = "jobs" | "drafts";

export default function JobsPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const confirm = useConfirm();
  const locale = useLocale();
  const t = useTranslations("Jobs");
  const commonT = useTranslations("Common");
  
    const initialTab = (searchParams.get("tab") as Tab) === "drafts" ? "drafts" : "jobs";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  
  const [jobs, setJobs] = useState<AIJob[]>([]);
  const [drafts, setDrafts] = useState<Post[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [expandedDraft, setExpandedDraft] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      setLoading(true);
      try {
        if (activeTab === "jobs") {
          await loadJobs();
        } else {
          await loadDrafts();
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (session?.user) {
      loadData();
      const interval = setInterval(() => {
        if (activeTab === "jobs") loadJobs();
      }, 5000);
      return () => clearInterval(interval);
    }
    
    return () => { isMounted = false; };
  }, [session, activeTab]);

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
      title: t("createDraftTitle"),
      description: t("createDraftDesc"),
      confirmText: t("createDraftConfirm"),
    });
    if (!isConfirmed) return;

    setPublishing(job.id);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...job.result, status: "draft", jobId: job.id, is_public: job.is_public ?? true }),
      });

      if (!res.ok) {
        throw new Error("Failed to create draft.");
      }

      await fetch(`/api/jobs/${job.id}`, { method: "DELETE" });
      setJobs(prev => prev.filter(j => j.id !== job.id));
      toast.success("🎉 Draft created successfully!");
    } catch {
      toast.error("❌ Failed to create draft.");
    } finally {
      setPublishing(null);
    }
  };

  const handleDeleteJob = async (id: string) => {
    const isConfirmed = await confirm({
      title: t("deleteJobTitle"),
      description: t("deleteJobDesc"),
      confirmText: t("deleteJobConfirm"),
      destructive: true,
    });
    if (!isConfirmed) return;

    try {
      const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
      if (res.ok) {
        setJobs(prev => prev.filter(j => j.id !== id));
        toast.success("🗑️ Deleted successfully.");
      }
    } catch {
      toast.error(commonT("error"));
    }
  };

  const handlePublishDraft = async (postId: string) => {
    if (publishing) return;

    const isConfirmed = await confirm({
      title: "게시 확인",
      description: "✨ 이 초안을 게시하시겠습니까?",
      confirmText: "게시",
    });
    if (!isConfirmed) return;

    setPublishing(postId);
    try {
      const res = await fetch("/api/posts/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish", postId }),
      });

      if (!res.ok) throw new Error("게시 실패");

      setDrafts(prev => prev.filter(d => d.id !== postId));
      toast.success("🎉 포스트가 게시되었습니다!");
    } catch {
      toast.error("❌ 게시에 실패했습니다.");
    } finally {
      setPublishing(null);
    }
  };

  const handleDeleteDraft = async (postId: string) => {
    const isConfirmed = await confirm({
      title: "삭제 확인",
      description: "🚨 이 초안을 영구적으로 삭제하시겠습니까?",
      confirmText: "삭제",
      destructive: true,
    });
    if (!isConfirmed) return;

    try {
      const res = await fetch("/api/posts/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", postId }),
      });

      if (res.ok) {
        setDrafts(prev => prev.filter(d => d.id !== postId));
        toast.success("🗑️ 초안이 삭제되었습니다.");
      }
    } catch {
      toast.error(commonT("error"));
    }
  };

  if (status === "loading") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16 animate-pulse">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <div className="h-9 w-48 bg-surface-subtle rounded-md mb-2" />
            <div className="h-4 w-64 bg-surface-subtle rounded-md" />
          </div>
          <div className="h-9 w-24 bg-surface-subtle rounded-lg" />
        </div>
        <div className="h-10 w-64 bg-surface-subtle rounded-lg mb-6" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-surface/50 border border-border-subtle rounded-2xl p-6" />
          ))}
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <LoginRequired />
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

      <JobTabs activeTab={activeTab} onTabChange={handleTabChange} draftsCount={drafts.length} t={t} />

      {activeTab === "jobs" && (
        <div id="tabpanel-jobs" role="tabpanel">
          {loading && jobs.length === 0 ? (
            <div className="space-y-4 animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-surface/50 border border-border-subtle rounded-2xl p-6" />
              ))}
            </div>
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
                <JobCard 
                  key={job.id} 
                  job={job} 
                  locale={locale} 
                  expandedJob={expandedJob} 
                  publishing={publishing} 
                  onToggleExpand={(id) => setExpandedJob(expandedJob === id ? null : id)} 
                  onPublish={handlePublish} 
                  onDelete={handleDeleteJob} 
                  t={t} 
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "drafts" && (
        <div id="tabpanel-drafts" role="tabpanel">
          {loading && drafts.length === 0 ? (
            <div className="space-y-4 animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-surface/50 border border-border-subtle rounded-xl p-6" />
              ))}
            </div>
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
                <DraftCard
                  key={draft.id}
                  draft={draft}
                  locale={locale}
                  expandedDraft={expandedDraft}
                  onToggleExpand={(id) => setExpandedDraft(expandedDraft === id ? null : id)}
                  onPublish={handlePublishDraft}
                  onDelete={handleDeleteDraft}
                  publishing={publishing}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";
import { useState } from "react";
import { AIJob } from "@/lib/types";
import { formatDateTime } from "@/lib/date";
import PostContent from "@/components/PostContent";
import { CommitTimeline } from "./CommitTimeline";
import { parseContentSections } from "./parseContentSections";
import { SECTION_HEADINGS } from "@/lib/constants/sections";

const DEV_STORY_INDEX = 3; // 0-indexed → "개발 스토리" (Section 4)
const WORK_ORDER_INDEX = 1; // 0-indexed → "작업 순서" (Section 2)

export function JobCard({
  job,
  locale,
  expandedJob,
  publishing,
  onToggleExpand,
  onPublish,
  onDelete,
  t,
}: {
  job: AIJob;
  locale: string;
  expandedJob: string | null;
  publishing: string | null;
  onToggleExpand: (id: string) => void;
  onPublish: (job: AIJob) => void;
  onDelete: (id: string) => void;
  t: (key: string) => string;
}) {
  const [activeTab, setActiveTab] = useState<string>(
    SECTION_HEADINGS[DEV_STORY_INDEX].tabLabel
  );

  // content를 5섹션으로 파싱 (구형 포맷이면 null → "전체" fallback)
  const sections = job.result?.content
    ? parseContentSections(job.result.content, SECTION_HEADINGS)
    : null;

  const tabs = sections ?? [
    { label: "전체", content: job.result?.content ?? "" },
  ];
  const currentTab = tabs.find((s) => s.label === activeTab) ?? tabs[0];

  const isDevStoryTab =
    currentTab.label === SECTION_HEADINGS[DEV_STORY_INDEX].tabLabel;
  const isWorkOrderTab =
    currentTab.label === SECTION_HEADINGS[WORK_ORDER_INDEX].tabLabel;
  const hasUserContext = Boolean(job.result?.userContext);

  return (
    <div className="border border-border-subtle rounded-xl p-6 bg-surface/30 hover:border-border-strong transition-all overflow-hidden">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                job.status === "completed"
                  ? "bg-success/20 text-success border border-success/30"
                  : job.status === "failed"
                  ? "bg-error/20 text-error border border-error/30"
                  : job.status === "processing"
                  ? "bg-accent/20 text-accent border border-accent/30 animate-pulse"
                  : "bg-elevated text-text-tertiary border border-border-subtle"
              }`}
            >
              {job.status === "completed"
                ? t("statusCompleted")
                : job.status === "failed"
                ? t("statusFailed")
                : job.status === "processing"
                ? t("statusProcessing")
                : t("statusPending")}
            </span>
            <span className="text-xs text-text-tertiary">
              {formatDateTime(job.created_at, locale)}
            </span>
            <span className="text-xs font-mono text-text-tertiary px-1.5 py-0.5 bg-elevated rounded">
              {job.repo}
            </span>
          </div>
          <h3 className="text-lg font-semibold truncate mb-1">
            {job.result?.title ||
              `Commit analysis job (${job.commit_shas.length} commits)`}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {job.status === "completed" && job.result && (
            <>
              <button
                onClick={() => onToggleExpand(job.id)}
                className="px-4 py-2 text-sm border border-border-strong rounded-lg hover:bg-elevated transition-colors cursor-pointer"
              >
                {expandedJob === job.id ? t("collapse") : t("expand")}
              </button>
              <button
                onClick={() => onPublish(job)}
                disabled={publishing === job.id}
                className="px-4 py-2 text-sm bg-success text-black font-semibold rounded-lg hover:opacity-90 transition-all cursor-pointer"
              >
                {publishing === job.id ? t("creating") : t("createDraft")}
              </button>
            </>
          )}
          <button
            onClick={() => onDelete(job.id)}
            className="p-2 text-text-tertiary hover:text-error transition-colors cursor-pointer"
            title={t("deleteJob")}
            aria-label={t("deleteJob")}
          >
            <svg
              height="18"
              width="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>

      {/* 확장 콘텐츠 */}
      {expandedJob === job.id && job.result && (
        <div className="mt-6 pt-6 border-t border-border-subtle animate-in slide-in-from-top-4 duration-300">
          <h4 className="text-lg font-bold mb-4">{job.result.title}</h4>

          {/* 탭 내비게이션 */}
          <div
            className="flex overflow-x-auto scrollbar-none border-b border-border-subtle mb-4"
            role="tablist"
          >
            {tabs.map((section) => (
              <button
                key={section.label}
                role="tab"
                aria-selected={currentTab.label === section.label}
                aria-controls={`tabpanel-${job.id}-${section.label}`}
                onClick={() => setActiveTab(section.label)}
                className={`flex-shrink-0 whitespace-nowrap px-4 py-2 text-sm transition-colors border-b-2 -mb-px cursor-pointer ${
                  currentTab.label === section.label
                    ? "border-accent text-text-primary font-medium"
                    : "border-transparent text-text-tertiary hover:text-text-secondary"
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>

          {/* 탭 패널 */}
          <div
            id={`tabpanel-${job.id}-${currentTab.label}`}
            role="tabpanel"
            className="bg-elevated/50 rounded-xl p-6"
          >
            {/* AI 배지 — 개발 스토리 탭에만 표시 */}
            {isDevStoryTab && (
              <div className="border-l-2 border-accent bg-accent/5 rounded-r-lg px-3 py-2 text-sm text-text-secondary mb-4">
                {hasUserContext
                  ? `✦ ${t("userContextBadge")}`
                  : `✦ ${t("aiInferredBadge")}`}
              </div>
            )}

            {/* 커밋 타임라인 — 작업 순서 탭에만 표시 */}
            {isWorkOrderTab && (
              <CommitTimeline
                commitShas={job.commit_shas}
                repo={job.repo}
              />
            )}

            <PostContent content={currentTab.content} />
          </div>
        </div>
      )}
    </div>
  );
}

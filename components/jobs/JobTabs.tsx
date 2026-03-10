"use client";

type Tab = "jobs" | "drafts";

export function JobTabs({
  activeTab,
  onTabChange,
  draftsCount,
  t,
}: {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  draftsCount: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}) {
  return (
    <div className="flex gap-1 border-b border-border-subtle mb-6">
      <button onClick={() => onTabChange("jobs")} className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${activeTab === "jobs" ? "text-text-primary border-b-2 border-accent" : "text-text-tertiary hover:text-text-secondary"}`}>
        {t("tabJobs")}
      </button>
      <button onClick={() => onTabChange("drafts")} className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer flex items-center gap-2 ${activeTab === "drafts" ? "text-text-primary border-b-2 border-accent" : "text-text-tertiary hover:text-text-secondary"}`}>
        {t("tabDrafts")}
        {draftsCount > 0 && <span className="px-1.5 py-0.5 bg-accent text-black text-xs rounded-full font-bold">{draftsCount}</span>}
      </button>
    </div>
  );
}
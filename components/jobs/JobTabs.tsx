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
    <div
      role="tablist"
      className="flex overflow-x-auto scrollbar-none border-b border-border-subtle mb-6 pb-px"
    >
      <button
        role="tab"
        aria-selected={activeTab === "jobs"}
        aria-controls="tabpanel-jobs"
        onClick={() => onTabChange("jobs")}
        className={`flex-shrink-0 whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px ${activeTab === "jobs" ? "text-text-primary border-accent" : "border-transparent text-text-tertiary hover:text-text-secondary"}`}
      >
        {t("tabJobs")}
      </button>
      <button
        role="tab"
        aria-selected={activeTab === "drafts"}
        aria-controls="tabpanel-drafts"
        onClick={() => onTabChange("drafts")}
        className={`flex-shrink-0 whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px flex items-center gap-2 ${activeTab === "drafts" ? "text-text-primary border-accent" : "border-transparent text-text-tertiary hover:text-text-secondary"}`}
      >
        {t("tabDrafts")}
        {draftsCount > 0 && (
          <span className="px-1.5 py-0.5 bg-accent text-black text-xs rounded-full font-bold">
            {draftsCount}
          </span>
        )}
      </button>
    </div>
  );
}
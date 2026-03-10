import { AIJob } from "@/lib/types";
import { formatDateTime } from "@/lib/date";
import PostContent from "@/components/PostContent";

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}) {
  return (
    <div className="border border-border-subtle rounded-xl p-6 bg-surface/30 hover:border-border-strong transition-all overflow-hidden">
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
            <span className="text-xs text-text-tertiary">{formatDateTime(job.created_at, locale)}</span>
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
  );
}
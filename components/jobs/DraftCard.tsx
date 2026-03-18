import { Post } from "@/lib/types";
import { formatDateTime } from "@/lib/date";
import PostContent from "@/components/PostContent";

export function DraftCard({
  draft,
  locale,
  expandedDraft,
  onToggleExpand,
  onPublish,
  onDelete,
  publishing,
  t,
}: {
  draft: Post;
  locale: string;
  expandedDraft: string | null;
  onToggleExpand: (id: string) => void;
  onPublish: (id: string) => void;
  onDelete: (id: string) => void;
  publishing: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}) {
  return (
    <div className="border border-border-subtle rounded-xl p-6 space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-2 text-xs">
          <span className="px-2 py-0.5 bg-accent text-black rounded-full font-semibold">Draft</span>
          {draft.repo && <span className="px-2 py-0.5 border border-border-subtle rounded-full text-text-tertiary">{draft.repo}</span>}
          <span className="text-text-tertiary">{formatDateTime(draft.date || new Date(), locale)}</span>
        </div>
        <h3 className="text-lg font-semibold mb-1">{draft.title}</h3>
        <p className="text-sm text-text-secondary line-clamp-2">{draft.summary}</p>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => onToggleExpand(draft.id)} className="text-sm text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer">
          {expandedDraft === draft.id ? t("collapse") : t("expand")}
        </button>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => onPublish(draft.id)}
            disabled={publishing === draft.id}
            className="px-4 py-1.5 bg-accent text-black text-sm font-semibold rounded-lg hover:bg-accent-hover transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {publishing === draft.id ? t("creating") : t("publish")}
          </button>
          <button
            onClick={() => onDelete(draft.id)}
            disabled={publishing === draft.id}
            className="px-4 py-1.5 border border-red-500/30 text-red-400 text-sm rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("delete")}
          </button>
        </div>
      </div>
      {expandedDraft === draft.id && (
        <div className="bg-elevated rounded-lg p-4"><PostContent content={draft.content} /></div>
      )}
    </div>
  );
}
// 프로젝트 Evidence 문서의 마크다운 편집 폼을 렌더링한다.
import type { ProjectDocumentReadiness, ProjectDocumentType } from "@/lib/types";

interface ProjectDocumentEditorProps {
  documentType: ProjectDocumentType;
  documentId: string | null;
  title: string;
  contentMarkdown: string;
  label: string;
  description: string;
  readiness: ProjectDocumentReadiness;
  isApplied: boolean;
  isPrd: boolean;
  signals: string[];
  saveAction: (formData: FormData) => void | Promise<void>;
  createFromTemplateAction: (formData: FormData) => void | Promise<void>;
  applyAction?: () => void | Promise<void>;
  excludeAction?: () => void | Promise<void>;
  supersedeAction?: () => void | Promise<void>;
  labels: {
    title: string;
    body: string;
    save: string;
    createFromTemplate: string;
    apply: string;
    exclude: string;
    supersede: string;
    applied: string;
    prdAlwaysApplied: string;
    analysisSignals: string;
    readiness: Record<ProjectDocumentReadiness, string>;
    emptyHint: string;
  };
}

export default function ProjectDocumentEditor({
  documentType,
  documentId,
  title,
  contentMarkdown,
  label,
  description,
  readiness,
  isApplied,
  isPrd,
  signals,
  saveAction,
  createFromTemplateAction,
  applyAction,
  excludeAction,
  supersedeAction,
  labels,
}: ProjectDocumentEditorProps) {
  const hasDocument = Boolean(documentId || contentMarkdown.trim());

  return (
    <section className="border border-border-subtle rounded-2xl p-6 bg-surface/30">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent mb-2">
            {labels.readiness[readiness]}
          </p>
          <h2 className="text-2xl font-display font-bold tracking-tight mb-2">{label}</h2>
          <p className="text-sm leading-6 text-text-secondary max-w-3xl">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={createFromTemplateAction}>
            <input type="hidden" name="documentType" value={documentType} />
            <button
              type="submit"
              className="px-4 py-2 border border-border-subtle rounded-lg text-sm text-text-secondary hover:border-border-strong hover:text-text-primary transition-colors"
            >
              {labels.createFromTemplate}
            </button>
          </form>
          {!isPrd && documentId && (applyAction || excludeAction) ? (
            <>
              <form action={(isApplied ? excludeAction : applyAction) as () => void | Promise<void>}>
                <button
                  type="submit"
                  className="px-4 py-2 bg-accent text-black rounded-lg text-sm font-semibold hover:bg-accent-hover transition-colors"
                >
                  {isApplied ? labels.exclude : labels.apply}
                </button>
              </form>
              {supersedeAction ? (
                <form action={supersedeAction}>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-border-subtle rounded-lg text-sm text-text-secondary hover:border-border-strong hover:text-text-primary transition-colors"
                  >
                    {labels.supersede}
                  </button>
                </form>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <form action={saveAction} className="space-y-4">
          <input type="hidden" name="documentId" value={documentId ?? ""} />
          <input type="hidden" name="documentType" value={documentType} />
          <label className="block space-y-2">
            <span className="text-sm font-medium text-text-primary">{labels.title}</span>
            <input
              name="title"
              defaultValue={title}
              className="w-full bg-surface border border-border-subtle rounded-lg px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-border-strong"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-text-primary">{labels.body}</span>
            <textarea
              name="contentMarkdown"
              rows={18}
              defaultValue={contentMarkdown}
              placeholder={labels.emptyHint}
              className="w-full bg-surface border border-border-subtle rounded-lg px-4 py-3 text-sm leading-6 text-text-primary focus:outline-none focus:border-border-strong font-mono"
            />
          </label>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-3 bg-accent text-black font-semibold rounded-lg hover:bg-accent-hover transition-colors"
            >
              {labels.save}
            </button>
          </div>
        </form>

        <aside className="space-y-4">
          <div className="border border-border-subtle rounded-xl p-4 bg-canvas/30">
            <p className="text-sm font-semibold mb-2">{labels.analysisSignals}</p>
            <div className="flex flex-wrap gap-2">
              {signals.map((signal) => (
                <span
                  key={signal}
                  className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-elevated text-text-secondary border border-border-subtle"
                >
                  {signal}
                </span>
              ))}
            </div>
          </div>
          <div className="border border-border-subtle rounded-xl p-4 bg-canvas/30">
            <p className="text-sm font-semibold mb-2">{labels.applied}</p>
            <p className="text-sm leading-6 text-text-secondary">
              {isPrd ? labels.prdAlwaysApplied : isApplied ? labels.apply : labels.exclude}
            </p>
          </div>
          {!hasDocument ? (
            <p className="text-sm leading-6 text-text-tertiary">{labels.emptyHint}</p>
          ) : null}
        </aside>
      </div>
    </section>
  );
}

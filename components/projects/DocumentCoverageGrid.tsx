// 프로젝트 Evidence 문서의 준비 상태 카드를 렌더링한다.
import type { ProjectDocumentReadiness, ProjectDocumentType } from "@/lib/types";

export interface DocumentCoverageItem {
  type: ProjectDocumentType;
  label: string;
  description: string;
  readiness: ProjectDocumentReadiness;
  isApplied: boolean;
  updatedAt: string | null;
  signals: string[];
}

export default function DocumentCoverageGrid({
  selectedType,
  items,
  labels,
  onSelect,
}: {
  selectedType: ProjectDocumentType;
  items: DocumentCoverageItem[];
  labels: {
    applied: string;
    notApplied: string;
    updated: string;
    noContent: string;
    readiness: Record<ProjectDocumentReadiness, string>;
  };
  onSelect: (type: ProjectDocumentType) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const isSelected = item.type === selectedType;
        return (
          <button
            key={item.type}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(item.type)}
            className={`text-left border rounded-2xl p-4 transition-colors ${
              isSelected
                ? "border-accent bg-accent/10"
                : "border-border-subtle bg-surface/30 hover:border-border-strong"
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <span className="text-sm font-semibold leading-5">{item.label}</span>
              <span className={getReadinessClass(item.readiness)}>
                {labels.readiness[item.readiness]}
              </span>
            </div>
            <p className="text-xs leading-5 text-text-secondary mb-4">{item.description}</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {item.signals.map((signal) => (
                <span
                  key={signal}
                  className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-elevated text-text-secondary border border-border-subtle"
                >
                  {signal}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between gap-2 text-[11px] text-text-tertiary">
              <span>{item.isApplied ? labels.applied : labels.notApplied}</span>
              <span>{item.updatedAt ? `${labels.updated} ${formatDate(item.updatedAt)}` : labels.noContent}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function getReadinessClass(readiness: ProjectDocumentReadiness) {
  const base = "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border";
  if (readiness === "usable") {
    return `${base} bg-success/10 text-success border-success/30`;
  }
  if (readiness === "stale") {
    return `${base} bg-yellow-500/10 text-yellow-500 border-yellow-500/30`;
  }
  if (readiness === "draft") {
    return `${base} bg-accent/10 text-accent border-accent/30`;
  }
  return `${base} bg-elevated text-text-secondary border-border-subtle`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-CA");
}

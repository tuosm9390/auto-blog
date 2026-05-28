// 프로젝트 Evidence 문서 유형과 기본 템플릿을 정의한다.
import type {
  ProjectDocumentReadiness,
  ProjectDocumentSummary,
  ProjectDocumentType,
  StoredProjectDocumentType,
} from "./types";

export type ProjectDocumentLocale = "ko" | "en";

export interface ProjectDocumentTypeMeta {
  type: ProjectDocumentType;
  label: string;
  description: string;
  signals: string[];
  requiredKeywords: string[];
  stored: boolean;
}

export interface ProjectDocumentTemplate {
  title: string;
  contentMarkdown: string;
}

export const PROJECT_DOCUMENT_TYPES: ProjectDocumentType[] = [
  "prd",
  "roadmap",
  "backlog",
  "sprint_plan",
  "decision_log",
  "technical_design",
  "risk_log",
  "release_ops_learning",
];

export const STORED_PROJECT_DOCUMENT_TYPES: StoredProjectDocumentType[] = [
  "roadmap",
  "backlog",
  "sprint_plan",
  "decision_log",
  "technical_design",
  "risk_log",
  "release_ops_learning",
];

const META: Record<ProjectDocumentType, Omit<ProjectDocumentTypeMeta, "type">> = {
  prd: {
    label: "PRD / Requirements",
    description: "Defines the product goal, scope, scenarios, and acceptance criteria.",
    signals: ["progress", "scope", "acceptance"],
    requiredKeywords: ["goal", "objective", "scope", "acceptance", "완료", "목표", "범위"],
    stored: false,
  },
  roadmap: {
    label: "Roadmap",
    description: "Maps phases, milestones, and upcoming work.",
    signals: ["progress", "watchNext", "drift"],
    requiredKeywords: ["milestone", "phase", "timeline", "단계", "마일스톤", "일정"],
    stored: true,
  },
  backlog: {
    label: "Backlog",
    description: "Tracks prioritized execution units and open work.",
    signals: ["progress", "blocker", "watchNext"],
    requiredKeywords: ["priority", "status", "owner", "우선순위", "상태", "작업"],
    stored: true,
  },
  sprint_plan: {
    label: "Sprint Plan",
    description: "Captures the short-term execution plan.",
    signals: ["progress", "blocker"],
    requiredKeywords: ["sprint", "commitment", "capacity", "이번", "스프린트", "완료"],
    stored: true,
  },
  decision_log: {
    label: "Decision Log / ADR",
    description: "Records accepted decisions and why direction changed.",
    signals: ["drift", "risk"],
    requiredKeywords: ["decision", "context", "consequence", "결정", "맥락", "영향"],
    stored: true,
  },
  technical_design: {
    label: "Technical Design / RFC",
    description: "Explains architecture, tradeoffs, and implementation shape.",
    signals: ["risk", "blocker", "drift"],
    requiredKeywords: ["architecture", "tradeoff", "interface", "구조", "트레이드오프", "API"],
    stored: true,
  },
  risk_log: {
    label: "Risk / Issue / Dependency Log",
    description: "Tracks risks, blockers, mitigations, and dependencies.",
    signals: ["risk", "blocker"],
    requiredKeywords: ["risk", "blocker", "mitigation", "리스크", "막힘", "대응"],
    stored: true,
  },
  release_ops_learning: {
    label: "Release / Ops Learning",
    description: "Captures release outcomes, incidents, and operational learning.",
    signals: ["progress", "risk", "watchNext"],
    requiredKeywords: ["release", "result", "learning", "출시", "결과", "학습"],
    stored: true,
  },
};

const TEMPLATES: Record<ProjectDocumentLocale, Record<ProjectDocumentType, ProjectDocumentTemplate>> = {
  ko: {
    prd: {
      title: "Current Plan",
      contentMarkdown:
        "# PRD\n\n## 목표\n- \n\n## 대상 사용자\n- \n\n## 범위\n### 포함\n- \n\n### 제외\n- \n\n## 완료 기준\n- [ ] \n\n## 리스크와 열린 질문\n- ",
    },
    roadmap: {
      title: "Roadmap",
      contentMarkdown:
        "# Roadmap\n\n## 현재 단계\n- \n\n## 마일스톤\n| 단계 | 목표 | 예상 시점 | 상태 |\n| --- | --- | --- | --- |\n| 1 |  |  | planned |\n\n## 다음 확인사항\n- \n\n## 변경된 일정 또는 범위\n- ",
    },
    backlog: {
      title: "Backlog",
      contentMarkdown:
        "# Backlog\n\n## 우선순위 작업\n| 작업 | 우선순위 | 상태 | 근거 |\n| --- | --- | --- | --- |\n|  | P1 | not_started |  |\n\n## 막힌 작업\n- \n\n## 다음 작업 후보\n- ",
    },
    sprint_plan: {
      title: "Sprint Plan",
      contentMarkdown:
        "# Sprint Plan\n\n## 이번 스프린트 목표\n- \n\n## 커밋할 작업\n- [ ] \n\n## 완료 기준\n- [ ] \n\n## 예상 막힘\n- ",
    },
    decision_log: {
      title: "Decision Log",
      contentMarkdown:
        "# Decision Log\n\n## 결정\n- \n\n## 맥락\n- \n\n## 선택지\n- \n\n## 결정 이유\n- \n\n## 영향과 후속 작업\n- ",
    },
    technical_design: {
      title: "Technical Design",
      contentMarkdown:
        "# Technical Design\n\n## 문제\n- \n\n## 제안 구조\n- \n\n## API / 데이터 변경\n- \n\n## 트레이드오프\n- \n\n## 리스크\n- ",
    },
    risk_log: {
      title: "Risk Log",
      contentMarkdown:
        "# Risk / Issue / Dependency Log\n\n## 리스크\n| 항목 | 영향 | 가능성 | 대응 |\n| --- | --- | --- | --- |\n|  |  |  |  |\n\n## 막힘\n- \n\n## 의존성\n- ",
    },
    release_ops_learning: {
      title: "Release / Ops Learning",
      contentMarkdown:
        "# Release / Ops Learning\n\n## 출시 결과\n- \n\n## 관찰된 문제\n- \n\n## 배운 점\n- \n\n## 다음 릴리스에 반영할 것\n- ",
    },
  },
  en: {
    prd: {
      title: "Current Plan",
      contentMarkdown:
        "# PRD\n\n## Objective\n- \n\n## Target users\n- \n\n## Scope\n### In scope\n- \n\n### Out of scope\n- \n\n## Acceptance criteria\n- [ ] \n\n## Risks and open questions\n- ",
    },
    roadmap: {
      title: "Roadmap",
      contentMarkdown:
        "# Roadmap\n\n## Current phase\n- \n\n## Milestones\n| Phase | Goal | Target | Status |\n| --- | --- | --- | --- |\n| 1 |  |  | planned |\n\n## Watch next\n- \n\n## Changed timing or scope\n- ",
    },
    backlog: {
      title: "Backlog",
      contentMarkdown:
        "# Backlog\n\n## Prioritized work\n| Item | Priority | Status | Evidence |\n| --- | --- | --- | --- |\n|  | P1 | not_started |  |\n\n## Blocked work\n- \n\n## Next candidates\n- ",
    },
    sprint_plan: {
      title: "Sprint Plan",
      contentMarkdown:
        "# Sprint Plan\n\n## Sprint goal\n- \n\n## Committed work\n- [ ] \n\n## Done criteria\n- [ ] \n\n## Expected blockers\n- ",
    },
    decision_log: {
      title: "Decision Log",
      contentMarkdown:
        "# Decision Log\n\n## Decision\n- \n\n## Context\n- \n\n## Options\n- \n\n## Rationale\n- \n\n## Consequences and follow-up\n- ",
    },
    technical_design: {
      title: "Technical Design",
      contentMarkdown:
        "# Technical Design\n\n## Problem\n- \n\n## Proposed architecture\n- \n\n## API / data changes\n- \n\n## Tradeoffs\n- \n\n## Risks\n- ",
    },
    risk_log: {
      title: "Risk Log",
      contentMarkdown:
        "# Risk / Issue / Dependency Log\n\n## Risks\n| Item | Impact | Likelihood | Mitigation |\n| --- | --- | --- | --- |\n|  |  |  |  |\n\n## Blockers\n- \n\n## Dependencies\n- ",
    },
    release_ops_learning: {
      title: "Release / Ops Learning",
      contentMarkdown:
        "# Release / Ops Learning\n\n## Release result\n- \n\n## Observed issues\n- \n\n## Learning\n- \n\n## Next release follow-up\n- ",
    },
  },
};

export function isStoredProjectDocumentType(type: ProjectDocumentType): type is StoredProjectDocumentType {
  return type !== "prd";
}

export function normalizeProjectDocumentType(value: FormDataEntryValue | string | null | undefined): ProjectDocumentType | null {
  if (typeof value !== "string") {
    return null;
  }
  return PROJECT_DOCUMENT_TYPES.includes(value as ProjectDocumentType)
    ? (value as ProjectDocumentType)
    : null;
}

export function getProjectDocumentTypeMeta(type: ProjectDocumentType): ProjectDocumentTypeMeta {
  return {
    type,
    ...META[type],
  };
}

export function getProjectDocumentTemplate(
  type: ProjectDocumentType,
  locale: string | undefined
): ProjectDocumentTemplate {
  return TEMPLATES[locale === "ko" ? "ko" : "en"][type];
}

export function estimateDocumentReadiness(
  type: ProjectDocumentType,
  contentMarkdown: string | null | undefined,
  updatedAt?: string | null,
  now: Date = new Date()
): ProjectDocumentReadiness {
  const content = (contentMarkdown ?? "").trim();
  if (!content) {
    return "missing";
  }

  if (updatedAt) {
    const updated = new Date(updatedAt).getTime();
    if (Number.isFinite(updated)) {
      const ageMs = now.getTime() - updated;
      if (ageMs > 45 * 24 * 60 * 60 * 1000) {
        return "stale";
      }
    }
  }

  const lower = content.toLowerCase();
  const matchedKeywords = getProjectDocumentTypeMeta(type).requiredKeywords.filter((keyword) =>
    lower.includes(keyword.toLowerCase())
  );

  return content.length >= 200 && matchedKeywords.length >= 2 ? "usable" : "draft";
}

export function buildDocumentSummary(input: {
  id: string;
  documentType: ProjectDocumentType;
  title: string;
  contentMarkdown: string | null | undefined;
  isApplied: boolean;
  updatedAt: string | null;
}): ProjectDocumentSummary {
  return {
    id: input.id,
    documentType: input.documentType,
    title: input.title,
    readiness: estimateDocumentReadiness(input.documentType, input.contentMarkdown, input.updatedAt),
    isApplied: input.isApplied,
    contentPreview: (input.contentMarkdown ?? "").replace(/\s+/g, " ").trim().slice(0, 1500),
    updatedAt: input.updatedAt,
  };
}

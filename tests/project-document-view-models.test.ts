// 프로젝트 Evidence 문서 화면용 view model 생성을 검증한다.
import { describe, expect, it } from "vitest";
import { getProjectDocumentTemplate } from "@/lib/project-document-templates";
import { buildProjectDocumentViewModels } from "@/lib/project-document-view-models";
import type { ProjectDocument, ProjectPlan } from "@/lib/types";

describe("project document view models", () => {
  it("shows template bodies for missing Evidence documents without treating them as saved", () => {
    const viewModels = buildProjectDocumentViewModels({
      locale: "en",
      plan: null,
      documents: [],
    });
    const roadmap = viewModels.find((item) => item.type === "roadmap");
    const backlog = viewModels.find((item) => item.type === "backlog");

    expect(roadmap?.id).toBeNull();
    expect(roadmap?.title).toBe("Roadmap");
    expect(roadmap?.contentMarkdown).toBe(getProjectDocumentTemplate("roadmap", "en").contentMarkdown);
    expect(roadmap?.readiness).toBe("draft");
    expect(roadmap?.isApplied).toBe(false);
    expect(backlog?.contentMarkdown).toBe(getProjectDocumentTemplate("backlog", "en").contentMarkdown);
  });

  it("shows the PRD template when no current plan exists", () => {
    const viewModels = buildProjectDocumentViewModels({
      locale: "ko",
      plan: null,
      documents: [],
    });
    const prd = viewModels.find((item) => item.type === "prd");

    expect(prd?.id).toBeNull();
    expect(prd?.title).toBe("Current Plan");
    expect(prd?.contentMarkdown).toBe(getProjectDocumentTemplate("prd", "ko").contentMarkdown);
    expect(prd?.readiness).toBe("draft");
    expect(prd?.isApplied).toBe(false);
  });

  it("prefers persisted document content over templates", () => {
    const savedRoadmap = makeDocument({
      document_type: "roadmap",
      title: "Saved Roadmap",
      content_markdown: "# Saved Roadmap\n\n## 단계\n" + "x".repeat(240),
      is_applied: true,
    });
    const viewModels = buildProjectDocumentViewModels({
      locale: "ko",
      plan: null,
      documents: [savedRoadmap],
    });
    const roadmap = viewModels.find((item) => item.type === "roadmap");

    expect(roadmap?.id).toBe(savedRoadmap.id);
    expect(roadmap?.title).toBe("Saved Roadmap");
    expect(roadmap?.contentMarkdown).toBe(savedRoadmap.content_markdown);
    expect(roadmap?.isApplied).toBe(true);
  });

  it("prefers current plan content for PRD when a plan exists", () => {
    const plan = makePlan({
      title: "Saved PRD",
      content_markdown: "# Saved PRD\n\n## 목표\n" + "x".repeat(240),
    });
    const viewModels = buildProjectDocumentViewModels({
      locale: "ko",
      plan,
      documents: [],
    });
    const prd = viewModels.find((item) => item.type === "prd");

    expect(prd?.id).toBe(plan.id);
    expect(prd?.title).toBe("Saved PRD");
    expect(prd?.contentMarkdown).toBe(plan.content_markdown);
    expect(prd?.isApplied).toBe(true);
  });
});

function makeDocument(overrides: Partial<ProjectDocument>): ProjectDocument {
  return {
    id: "doc-1",
    project_id: "project-1",
    document_type: "roadmap",
    title: "Roadmap",
    status: "draft",
    content_markdown: "",
    is_applied: false,
    related_links_json: [],
    analysis_signals_json: [],
    last_used_snapshot_id: null,
    created_at: "2026-05-28T00:00:00.000Z",
    updated_at: "2026-05-28T00:00:00.000Z",
    ...overrides,
  };
}

function makePlan(overrides: Partial<ProjectPlan>): ProjectPlan {
  return {
    id: "plan-1",
    project_id: "project-1",
    title: "Current Plan",
    content_markdown: "",
    summary: null,
    version: 1,
    is_current: true,
    created_at: "2026-05-28T00:00:00.000Z",
    updated_at: "2026-05-28T00:00:00.000Z",
    ...overrides,
  };
}

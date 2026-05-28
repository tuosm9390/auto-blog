// Evidence 문서 AI 초안 생성 프롬프트 구성을 검증한다.
import { describe, expect, it } from "vitest";
import { buildProjectDocumentDraftPrompt } from "@/lib/project-document-draft-ai";
import { getProjectDocumentTemplate } from "@/lib/project-document-templates";
import type { Project, ProjectDocumentSummary, ProjectPlan, StateSnapshot } from "@/lib/types";

describe("project document draft AI prompt", () => {
  it("includes document-specific authoring guidance for PRD drafts", () => {
    const prompt = buildProjectDocumentDraftPrompt({
      project: makeProject(),
      documentType: "prd",
      template: getProjectDocumentTemplate("prd", "ko"),
      currentPlan: makePlan(),
      documents: [makeDocumentSummary()],
      latestSnapshot: makeSnapshot(),
      existingContent: "# Existing PRD\n\n## Goal\n- Ship useful evidence docs.",
      locale: "ko",
    });

    expect(prompt).toContain("[WHAT TO CHECK BEFORE WRITING]");
    expect(prompt).toContain("original thesis, current thesis");
    expect(prompt).toContain("Acceptance Criteria");
    expect(prompt).toContain("[LATEST STATE SNAPSHOT]");
    expect(prompt).toContain("## Agent Collaboration Prompt");
  });

  it("includes backlog-specific guidance and related documents", () => {
    const prompt = buildProjectDocumentDraftPrompt({
      project: makeProject(),
      documentType: "backlog",
      template: getProjectDocumentTemplate("backlog", "en"),
      currentPlan: makePlan(),
      documents: [makeDocumentSummary()],
      latestSnapshot: makeSnapshot(),
      existingContent: "",
      locale: "en",
    });

    expect(prompt).toContain("Turn PRD acceptance criteria");
    expect(prompt).toContain("Priority, Status, Owner, and Blocker");
    expect(prompt).toContain("Related Roadmap");
    expect(prompt).toContain("JSON shape");
  });
});

function makeProject(): Project {
  return {
    id: "project-1",
    owner_id: "user-1",
    name: "Synapso",
    slug: "synapso",
    description: "AI-native project memory for solo builders.",
    original_thesis: "AI tech blog generator",
    current_thesis: "PRD-aware project memory",
    status: "active",
    github_repo_owner: "owner",
    github_repo_name: "repo",
    created_at: "2026-05-28T00:00:00.000Z",
    updated_at: "2026-05-28T00:00:00.000Z",
  };
}

function makePlan(): ProjectPlan {
  return {
    id: "plan-1",
    project_id: "project-1",
    title: "Current PRD",
    content_markdown: "# PRD\n\n## Goal\n- Build project memory.",
    summary: null,
    version: 1,
    is_current: true,
    created_at: "2026-05-28T00:00:00.000Z",
    updated_at: "2026-05-28T00:00:00.000Z",
  };
}

function makeDocumentSummary(): ProjectDocumentSummary {
  return {
    id: "doc-1",
    documentType: "roadmap",
    title: "Related Roadmap",
    readiness: "usable",
    isApplied: true,
    contentPreview: "Milestone 1 ships project document management.",
    updatedAt: "2026-05-28T00:00:00.000Z",
  };
}

function makeSnapshot(): StateSnapshot {
  return {
    id: "snapshot-1",
    project_id: "project-1",
    analysis_run_id: "run-1",
    summary: "Documents are ready for deeper analysis.",
    progress_percent: 60,
    current_phase: "Evidence document automation",
    blocker_count: 1,
    risk_count: 2,
    drift_count: 0,
    watch_next: ["Generate document drafts", "Apply reviewed documents"],
    plan_progress_json: [],
    drift_json: [],
    evidence_json: [],
    raw_output_json: {},
    generated_at: "2026-05-28T00:00:00.000Z",
    created_at: "2026-05-28T00:00:00.000Z",
  };
}

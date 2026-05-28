// 프로젝트 Evidence 문서 템플릿과 readiness 계산을 검증한다.
import { describe, expect, it } from "vitest";
import {
  estimateDocumentReadiness,
  PROJECT_DOCUMENT_TYPES,
  STORED_PROJECT_DOCUMENT_TYPES,
} from "@/lib/project-document-templates";

describe("project document templates", () => {
  it("keeps PRD visible but out of stored project documents", () => {
    expect(PROJECT_DOCUMENT_TYPES).toHaveLength(8);
    expect(PROJECT_DOCUMENT_TYPES[0]).toBe("prd");
    expect(STORED_PROJECT_DOCUMENT_TYPES).toHaveLength(7);
    expect(STORED_PROJECT_DOCUMENT_TYPES).not.toContain("prd");
  });

  it("marks empty content as missing", () => {
    expect(estimateDocumentReadiness("roadmap", "")).toBe("missing");
  });

  it("marks short content as draft", () => {
    expect(estimateDocumentReadiness("roadmap", "# Roadmap\n\n## 단계\n- one")).toBe("draft");
  });

  it("marks sufficiently structured content as usable", () => {
    const content = `
# Roadmap

## 단계
- Phase 1 focuses on project document management and evidence coverage.
- Phase 2 connects analysis metadata to snapshot review.

## 마일스톤
- Milestone 1 ships the documents page.
- Milestone 2 connects applied documents to refresh state.

## 다음 확인사항
- Validate that the roadmap changes watchNext and drift reasoning.
`;

    expect(estimateDocumentReadiness("roadmap", content)).toBe("usable");
  });

  it("marks old content as stale", () => {
    const oldDate = "2026-01-01T00:00:00.000Z";
    const now = new Date("2026-05-28T00:00:00.000Z");
    const content = "# Roadmap\n\n## 단계\n" + "x".repeat(240);

    expect(estimateDocumentReadiness("roadmap", content, oldDate, now)).toBe("stale");
  });
});

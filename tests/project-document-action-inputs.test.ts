// Evidence 문서 서버 액션 FormData 입력 검증을 테스트한다.
import { describe, expect, it } from "vitest";
import {
  parseProjectDocumentApplyInput,
  parseProjectDocumentSupersedeInput,
} from "@/lib/project-document-action-inputs";

describe("project document action inputs", () => {
  it("parses apply input for stored document types", () => {
    const formData = new FormData();
    formData.set("documentId", "doc-1");
    formData.set("documentType", "roadmap");
    formData.set("isApplied", "true");

    expect(parseProjectDocumentApplyInput(formData)).toEqual({
      documentId: "doc-1",
      documentType: "roadmap",
      isApplied: true,
    });
  });

  it("rejects PRD apply input", () => {
    const formData = new FormData();
    formData.set("documentId", "plan-1");
    formData.set("documentType", "prd");
    formData.set("isApplied", "true");

    expect(() => parseProjectDocumentApplyInput(formData)).toThrow("적용 상태를 바꿀 수 없는 문서입니다.");
  });

  it("parses supersede input for stored document types", () => {
    const formData = new FormData();
    formData.set("documentId", "doc-1");
    formData.set("documentType", "risk_log");

    expect(parseProjectDocumentSupersedeInput(formData)).toEqual({
      documentId: "doc-1",
      documentType: "risk_log",
    });
  });

  it("rejects invalid document types", () => {
    const formData = new FormData();
    formData.set("documentId", "doc-1");
    formData.set("documentType", "unknown");

    expect(() => parseProjectDocumentSupersedeInput(formData)).toThrow("이 문서는 superseded 처리할 수 없습니다.");
  });
});

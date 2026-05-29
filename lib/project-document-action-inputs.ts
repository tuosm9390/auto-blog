// Evidence 문서 서버 액션의 FormData 입력을 검증한다.
import { z } from "zod";
import { normalizeProjectDocumentType } from "./project-document-templates";
import type { StoredProjectDocumentType } from "./types";

const documentApplySchema = z.object({
  documentId: z.string().min(1, "문서 ID는 필수입니다."),
  documentType: z.string().min(1),
  isApplied: z.enum(["true", "false"]),
});

const documentSupersedeSchema = z.object({
  documentId: z.string().min(1, "문서 ID는 필수입니다."),
  documentType: z.string().min(1),
});

export function parseProjectDocumentApplyInput(formData: FormData): {
  documentId: string;
  documentType: StoredProjectDocumentType;
  isApplied: boolean;
} {
  const parsed = documentApplySchema.safeParse({
    documentId: formData.get("documentId"),
    documentType: formData.get("documentType"),
    isApplied: formData.get("isApplied"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "문서 적용 입력값이 올바르지 않습니다.");
  }

  const normalizedType = normalizeProjectDocumentType(parsed.data.documentType);
  if (!normalizedType || normalizedType === "prd") {
    throw new Error("적용 상태를 바꿀 수 없는 문서입니다.");
  }

  return {
    documentId: parsed.data.documentId,
    documentType: normalizedType,
    isApplied: parsed.data.isApplied === "true",
  };
}

export function parseProjectDocumentSupersedeInput(formData: FormData): {
  documentId: string;
  documentType: StoredProjectDocumentType;
} {
  const parsed = documentSupersedeSchema.safeParse({
    documentId: formData.get("documentId"),
    documentType: formData.get("documentType"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "문서 상태 변경 입력값이 올바르지 않습니다.");
  }

  const normalizedType = normalizeProjectDocumentType(parsed.data.documentType);
  if (!normalizedType || normalizedType === "prd") {
    throw new Error("이 문서는 superseded 처리할 수 없습니다.");
  }

  return {
    documentId: parsed.data.documentId,
    documentType: normalizedType,
  };
}

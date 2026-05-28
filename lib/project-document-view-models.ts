// 프로젝트 Evidence 문서 화면에서 사용할 view model을 만든다.
import {
  buildDocumentSummary,
  getProjectDocumentTemplate,
  getProjectDocumentTypeMeta,
  PROJECT_DOCUMENT_TYPES,
} from "./project-document-templates";
import type {
  ProjectDocument,
  ProjectDocumentReadiness,
  ProjectDocumentType,
  ProjectPlan,
} from "./types";

export interface ProjectDocumentViewModel {
  type: ProjectDocumentType;
  label: string;
  description: string;
  signals: string[];
  readiness: ProjectDocumentReadiness;
  isApplied: boolean;
  updatedAt: string | null;
  id: string | null;
  title: string;
  contentMarkdown: string;
  isPrd: boolean;
}

export function buildProjectDocumentViewModels({
  locale,
  plan,
  documents,
}: {
  locale: string;
  plan: ProjectPlan | null;
  documents: ProjectDocument[];
}): ProjectDocumentViewModel[] {
  const documentsByType = new Map(documents.map((document) => [document.document_type, document]));

  return PROJECT_DOCUMENT_TYPES.map((type) => {
    const meta = getProjectDocumentTypeMeta(type);
    const template = getProjectDocumentTemplate(type, locale);

    if (type === "prd") {
      if (!plan) {
        return {
          ...meta,
          id: null,
          title: template.title,
          contentMarkdown: template.contentMarkdown,
          readiness: "draft",
          isApplied: false,
          updatedAt: null,
          isPrd: true,
        };
      }

      const summary = buildDocumentSummary({
        id: plan.id,
        documentType: "prd",
        title: plan.title,
        contentMarkdown: plan.content_markdown,
        isApplied: Boolean(plan.content_markdown.trim()),
        updatedAt: plan.updated_at,
      });

      return {
        ...meta,
        id: plan.id,
        title: summary.title,
        contentMarkdown: plan.content_markdown,
        readiness: summary.readiness,
        isApplied: summary.isApplied,
        updatedAt: summary.updatedAt,
        isPrd: true,
      };
    }

    const document = documentsByType.get(type);
    if (!document) {
      return {
        ...meta,
        id: null,
        title: template.title,
        contentMarkdown: template.contentMarkdown,
        readiness: "draft",
        isApplied: false,
        updatedAt: null,
        isPrd: false,
      };
    }

    const summary = buildDocumentSummary({
      id: document.id,
      documentType: type,
      title: document.title,
      contentMarkdown: document.content_markdown,
      isApplied: document.is_applied,
      updatedAt: document.updated_at,
    });

    return {
      ...meta,
      id: document.id,
      title: summary.title,
      contentMarkdown: document.content_markdown,
      readiness: summary.readiness,
      isApplied: summary.isApplied,
      updatedAt: summary.updatedAt,
      isPrd: false,
    };
  });
}

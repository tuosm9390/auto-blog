// 프로젝트 Evidence 문서의 저장과 조회를 담당한다.
import { cache } from "react";
import { buildDocumentSummary } from "./project-document-templates";
import { supabaseAdmin as supabase } from "./supabase-admin";
import type {
  ProjectDocument,
  ProjectDocumentStatus,
  ProjectDocumentSummary,
  StoredProjectDocumentType,
} from "./types";

const PROJECT_DOCUMENTS_SETUP_MESSAGE =
  "Project Documents schema가 아직 적용되지 않았습니다. scripts/add-project-documents.sql을 먼저 실행하세요.";

function isMissingProjectDocumentsTableError(error: { code?: string; message?: string } | null | undefined) {
  return (
    error?.code === "42P01" ||
    error?.message?.toLowerCase().includes("project_documents") === true ||
    error?.message?.toLowerCase().includes("does not exist") === true
  );
}

export async function getProjectDocumentsSetupState(): Promise<{
  ready: boolean;
  message?: string;
}> {
  const { error } = await supabase.from("project_documents").select("id").limit(1);

  if (error && isMissingProjectDocumentsTableError(error)) {
    return {
      ready: false,
      message: PROJECT_DOCUMENTS_SETUP_MESSAGE,
    };
  }

  return { ready: true };
}

export const getProjectDocuments = cache(async function getProjectDocuments(
  projectId: string
): Promise<ProjectDocument[]> {
  const { data, error } = await supabase
    .from("project_documents")
    .select("*")
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });

  if (error || !data) {
    if (isMissingProjectDocumentsTableError(error)) {
      console.error(PROJECT_DOCUMENTS_SETUP_MESSAGE);
    } else {
      console.error("getProjectDocuments error:", error?.message);
    }
    return [];
  }

  return data as ProjectDocument[];
});

export async function getAppliedProjectDocuments(projectId: string): Promise<ProjectDocument[]> {
  const { data, error } = await supabase
    .from("project_documents")
    .select("*")
    .eq("project_id", projectId)
    .eq("is_applied", true)
    .neq("status", "archived")
    .neq("status", "superseded")
    .order("updated_at", { ascending: false });

  if (error || !data) {
    if (isMissingProjectDocumentsTableError(error)) {
      console.error(PROJECT_DOCUMENTS_SETUP_MESSAGE);
    } else {
      console.error("getAppliedProjectDocuments error:", error?.message);
    }
    return [];
  }

  return data as ProjectDocument[];
}

export async function getProjectDocumentById(
  projectId: string,
  documentId: string
): Promise<ProjectDocument | null> {
  const { data, error } = await supabase
    .from("project_documents")
    .select("*")
    .eq("project_id", projectId)
    .eq("id", documentId)
    .single();

  if (error || !data) {
    if (isMissingProjectDocumentsTableError(error)) {
      console.error(PROJECT_DOCUMENTS_SETUP_MESSAGE);
    }
    return null;
  }

  return data as ProjectDocument;
}

export async function upsertProjectDocument(input: {
  projectId: string;
  documentType: StoredProjectDocumentType;
  title: string;
  contentMarkdown: string;
  isApplied?: boolean;
  status?: ProjectDocumentStatus;
  analysisSignals?: string[];
}): Promise<ProjectDocument> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("project_documents")
    .upsert(
      {
        project_id: input.projectId,
        document_type: input.documentType,
        title: input.title,
        content_markdown: input.contentMarkdown,
        is_applied: input.isApplied ?? false,
        status: input.status ?? "draft",
        analysis_signals_json: input.analysisSignals ?? [],
        updated_at: now,
      },
      { onConflict: "project_id,document_type" }
    )
    .select("*")
    .single();

  if (error || !data) {
    console.error("upsertProjectDocument error:", error?.message);
    if (isMissingProjectDocumentsTableError(error)) {
      throw new Error(PROJECT_DOCUMENTS_SETUP_MESSAGE);
    }
    throw new Error("프로젝트 문서 저장에 실패했습니다.");
  }

  return data as ProjectDocument;
}

export async function updateProjectDocument(input: {
  projectId: string;
  documentId: string;
  title: string;
  contentMarkdown: string;
}): Promise<ProjectDocument> {
  const { data, error } = await supabase
    .from("project_documents")
    .update({
      title: input.title,
      content_markdown: input.contentMarkdown,
      status: "draft" as ProjectDocumentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("project_id", input.projectId)
    .eq("id", input.documentId)
    .select("*")
    .single();

  if (error || !data) {
    console.error("updateProjectDocument error:", error?.message);
    if (isMissingProjectDocumentsTableError(error)) {
      throw new Error(PROJECT_DOCUMENTS_SETUP_MESSAGE);
    }
    throw new Error("프로젝트 문서 수정에 실패했습니다.");
  }

  return data as ProjectDocument;
}

export async function setProjectDocumentApplied(
  projectId: string,
  documentId: string,
  isApplied: boolean
): Promise<boolean> {
  const { error } = await supabase
    .from("project_documents")
    .update({
      is_applied: isApplied,
      status: isApplied ? "active" : "draft",
      updated_at: new Date().toISOString(),
    })
    .eq("project_id", projectId)
    .eq("id", documentId);

  if (error) {
    console.error("setProjectDocumentApplied error:", error.message);
    return false;
  }

  return true;
}

export async function markProjectDocumentSuperseded(
  projectId: string,
  documentId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("project_documents")
    .update({
      is_applied: false,
      status: "superseded" as ProjectDocumentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("project_id", projectId)
    .eq("id", documentId);

  if (error) {
    console.error("markProjectDocumentSuperseded error:", error.message);
    return false;
  }

  return true;
}

export async function updateDocumentsLastUsed(
  projectId: string,
  documentIds: string[],
  snapshotId: string
): Promise<void> {
  if (documentIds.length === 0) {
    return;
  }

  const { error } = await supabase
    .from("project_documents")
    .update({ last_used_snapshot_id: snapshotId })
    .eq("project_id", projectId)
    .in("id", documentIds);

  if (error) {
    console.error("updateDocumentsLastUsed error:", error.message);
  }
}

export function summarizeStoredProjectDocuments(documents: ProjectDocument[]): ProjectDocumentSummary[] {
  return documents.map((document) =>
    buildDocumentSummary({
      id: document.id,
      documentType: document.document_type,
      title: document.title,
      contentMarkdown: document.content_markdown,
      isApplied: document.is_applied,
      updatedAt: document.updated_at,
    })
  );
}

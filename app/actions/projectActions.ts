"use server";

import { auth } from "@/auth";
import { refreshProjectState } from "@/lib/project-refresh";
import { generateProjectDocumentDraft } from "@/lib/project-document-draft-ai";
import {
  parseProjectDocumentApplyInput,
  parseProjectDocumentSupersedeInput,
} from "@/lib/project-document-action-inputs";
import {
  getProjectDocuments,
  markProjectDocumentSuperseded,
  setProjectDocumentApplied,
  summarizeStoredProjectDocuments,
  updateProjectDocument,
  upsertProjectDocument,
} from "@/lib/project-documents";
import {
  getProjectDocumentTemplate,
  getProjectDocumentTypeMeta,
  isStoredProjectDocumentType,
  normalizeProjectDocumentType,
} from "@/lib/project-document-templates";
import {
  createProject,
  getProjectById,
  getCurrentProjectPlan,
  getLatestStateSnapshot,
  updateProject,
  upsertCurrentProjectPlan,
} from "@/lib/projects";
import type { Project, ProjectStatus } from "@/lib/types";
import { redirect } from "@/i18n/routing";
import { unstable_rethrow } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createProjectSchema = z.object({
  name: z.string().min(1, "프로젝트 이름은 필수입니다."),
  description: z.string().optional().default(""),
  originalThesis: z.string().optional().default(""),
  currentThesis: z.string().optional().default(""),
  githubRepoOwner: z.string().optional().default(""),
  githubRepoName: z.string().optional().default(""),
  planTitle: z.string().optional().default("Current Plan"),
  planContentMarkdown: z.string().optional().default(""),
});

const updateProjectSchema = createProjectSchema.extend({
  status: z.enum(["active", "paused", "archived"]).default("active"),
});

const documentSaveSchema = z.object({
  documentId: z.string().optional().default(""),
  documentType: z.string().min(1),
  title: z.string().min(1, "문서 제목은 필수입니다."),
  contentMarkdown: z.string().optional().default(""),
});

export async function createProjectAction(locale: string, formData: FormData) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    redirect({ href: "/login", locale });
  }
  const safeUserId = userId as string;

  const parsed = createProjectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    originalThesis: formData.get("originalThesis"),
    currentThesis: formData.get("currentThesis"),
    githubRepoOwner: formData.get("githubRepoOwner"),
    githubRepoName: formData.get("githubRepoName"),
    planTitle: formData.get("planTitle"),
    planContentMarkdown: formData.get("planContentMarkdown"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "입력값이 올바르지 않습니다.");
  }

  const project = await createProject({
    ownerId: safeUserId,
    ...parsed.data,
  });

  revalidatePath(`/${locale}/projects`);
  redirect({ href: `/projects/${project.id}`, locale });
}

export async function refreshProjectStateAction(locale: string, projectId: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    redirect({ href: "/login", locale });
  }
  const safeUserId = userId as string;

  const project = await getProjectById(projectId);
  if (!project || project.owner_id !== safeUserId) {
    redirect({ href: "/projects", locale });
  }
  const accessToken = (session?.user as { accessToken?: string } | undefined)?.accessToken;
  try {
    await refreshProjectState({
      projectId,
      triggeredBy: safeUserId,
      accessToken,
      locale,
      sourceWindowDays: 7,
    });

    revalidatePath(`/${locale}/projects`);
    revalidatePath(`/${locale}/projects/${projectId}`);
    revalidatePath(`/${locale}/projects/${projectId}/drift`);
    revalidatePath(`/${locale}/projects/${projectId}/runs`);
    redirect({ href: `/projects/${projectId}`, locale });
  } catch (error) {
    unstable_rethrow(error);

    const message =
      error instanceof Error ? error.message : "상태 새로고침 중 오류가 발생했습니다.";

    console.error("refreshProjectStateAction error:", message);

    revalidatePath(`/${locale}/projects/${projectId}`);
    revalidatePath(`/${locale}/projects/${projectId}/runs`);

    redirect({
      href: `/projects/${projectId}?refresh=failed&message=${encodeURIComponent(message)}`,
      locale,
    });
  }
}

export async function updateProjectAction(locale: string, projectId: string, formData: FormData) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    redirect({ href: "/login", locale });
  }
  const safeUserId = userId as string;

  const project = await getProjectById(projectId);
  if (!project || project.owner_id !== safeUserId) {
    redirect({ href: "/projects", locale });
  }

  const parsed = updateProjectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    originalThesis: formData.get("originalThesis"),
    currentThesis: formData.get("currentThesis"),
    status: formData.get("status"),
    githubRepoOwner: formData.get("githubRepoOwner"),
    githubRepoName: formData.get("githubRepoName"),
    planTitle: formData.get("planTitle"),
    planContentMarkdown: formData.get("planContentMarkdown"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "입력값이 올바르지 않습니다.");
  }

  const updated = await updateProject(projectId, safeUserId, {
    name: parsed.data.name,
    description: parsed.data.description || null,
    originalThesis: parsed.data.originalThesis || null,
    currentThesis: parsed.data.currentThesis || null,
    status: parsed.data.status as ProjectStatus,
    githubRepoOwner: parsed.data.githubRepoOwner || null,
    githubRepoName: parsed.data.githubRepoName || null,
  });

  if (!updated) {
    throw new Error("프로젝트 수정에 실패했습니다.");
  }

  const existingPlan = await getCurrentProjectPlan(projectId);
  const shouldPersistPlan =
    Boolean(existingPlan) ||
    parsed.data.planContentMarkdown.trim().length > 0 ||
    parsed.data.planTitle.trim().length > 0;

  if (shouldPersistPlan) {
    await upsertCurrentProjectPlan(
      projectId,
      parsed.data.planTitle.trim() || "Current Plan",
      parsed.data.planContentMarkdown
    );
  }

  revalidatePath(`/${locale}/projects`);
  revalidatePath(`/${locale}/projects/${projectId}`);
  revalidatePath(`/${locale}/projects/${projectId}/drift`);
  revalidatePath(`/${locale}/projects/${projectId}/runs`);
  revalidatePath(`/${locale}/projects/${projectId}/edit`);
  redirect({ href: `/projects/${projectId}`, locale });
}

async function requireOwnedProject(locale: string, projectId: string): Promise<Project> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    redirect({ href: "/login", locale });
  }
  const safeUserId = userId as string;

  const project = await getProjectById(projectId);
  if (!project || project.owner_id !== safeUserId) {
    redirect({ href: "/projects", locale });
    throw new Error("프로젝트를 찾을 수 없습니다.");
  }

  return project;
}

function revalidateProjectDocumentPaths(locale: string, projectId: string) {
  revalidatePath(`/${locale}/projects`);
  revalidatePath(`/${locale}/projects/${projectId}`);
  revalidatePath(`/${locale}/projects/${projectId}/documents`);
}

export async function createProjectDocumentFromTemplateAction(
  locale: string,
  projectId: string,
  formData: FormData
) {
  await requireOwnedProject(locale, projectId);

  const documentType = normalizeProjectDocumentType(formData.get("documentType"));
  if (!documentType) {
    throw new Error("문서 유형이 올바르지 않습니다.");
  }

  const template = getProjectDocumentTemplate(documentType, locale);
  if (documentType === "prd") {
    await upsertCurrentProjectPlan(projectId, template.title, template.contentMarkdown);
  } else if (isStoredProjectDocumentType(documentType)) {
    const meta = getProjectDocumentTypeMeta(documentType);
    await upsertProjectDocument({
      projectId,
      documentType,
      title: template.title,
      contentMarkdown: template.contentMarkdown,
      analysisSignals: meta.signals,
    });
  }

  revalidateProjectDocumentPaths(locale, projectId);
  redirect({ href: `/projects/${projectId}/documents?type=${documentType}`, locale });
}

export async function saveProjectDocumentAction(
  locale: string,
  projectId: string,
  formData: FormData
) {
  await requireOwnedProject(locale, projectId);

  const parsed = documentSaveSchema.safeParse({
    documentId: formData.get("documentId"),
    documentType: formData.get("documentType"),
    title: formData.get("title"),
    contentMarkdown: formData.get("contentMarkdown"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "문서 입력값이 올바르지 않습니다.");
  }

  const documentType = normalizeProjectDocumentType(parsed.data.documentType);
  if (!documentType) {
    throw new Error("문서 유형이 올바르지 않습니다.");
  }

  if (documentType === "prd") {
    await upsertCurrentProjectPlan(
      projectId,
      parsed.data.title.trim() || "Current Plan",
      parsed.data.contentMarkdown
    );
  } else if (isStoredProjectDocumentType(documentType)) {
    if (parsed.data.documentId) {
      await updateProjectDocument({
        projectId,
        documentId: parsed.data.documentId,
        title: parsed.data.title.trim(),
        contentMarkdown: parsed.data.contentMarkdown,
      });
    } else {
      const meta = getProjectDocumentTypeMeta(documentType);
      await upsertProjectDocument({
        projectId,
        documentType,
        title: parsed.data.title.trim(),
        contentMarkdown: parsed.data.contentMarkdown,
        analysisSignals: meta.signals,
      });
    }
  }

  revalidateProjectDocumentPaths(locale, projectId);
  redirect({ href: `/projects/${projectId}/documents?type=${documentType}`, locale });
}

export async function generateProjectDocumentDraftAction(
  locale: string,
  projectId: string,
  formData: FormData
) {
  const project = await requireOwnedProject(locale, projectId);

  const documentType = normalizeProjectDocumentType(formData.get("documentType"));
  if (!documentType) {
    throw new Error("문서 유형이 올바르지 않습니다.");
  }

  const [plan, documents, latestSnapshot] = await Promise.all([
    getCurrentProjectPlan(projectId),
    getProjectDocuments(projectId),
    getLatestStateSnapshot(projectId),
  ]);
  const template = getProjectDocumentTemplate(documentType, locale);
  const existingDocument = documents.find((document) => document.document_type === documentType);
  const existingContent =
    documentType === "prd" ? plan?.content_markdown : existingDocument?.content_markdown;
  const draft = await generateProjectDocumentDraft({
    project,
    documentType,
    template,
    currentPlan: plan,
    documents: summarizeStoredProjectDocuments(documents),
    latestSnapshot,
    existingContent,
    locale: locale === "ko" ? "ko" : "en",
  });

  if (documentType === "prd") {
    await upsertCurrentProjectPlan(projectId, draft.title, draft.contentMarkdown);
  } else if (isStoredProjectDocumentType(documentType)) {
    const meta = getProjectDocumentTypeMeta(documentType);
    await upsertProjectDocument({
      projectId,
      documentType,
      title: draft.title,
      contentMarkdown: draft.contentMarkdown,
      isApplied: false,
      status: "draft",
      analysisSignals: meta.signals,
    });
  }

  revalidateProjectDocumentPaths(locale, projectId);
  redirect({ href: `/projects/${projectId}/documents?type=${documentType}`, locale });
}

export async function applyProjectDocumentAction(
  locale: string,
  projectId: string,
  formData: FormData
) {
  await requireOwnedProject(locale, projectId);
  const parsed = parseProjectDocumentApplyInput(formData);

  const updated = await setProjectDocumentApplied(
    projectId,
    parsed.documentId,
    parsed.isApplied
  );
  if (!updated) {
    throw new Error("문서 적용 상태 변경에 실패했습니다.");
  }

  revalidateProjectDocumentPaths(locale, projectId);
  redirect({ href: `/projects/${projectId}/documents?type=${parsed.documentType}`, locale });
}

export async function markProjectDocumentSupersededAction(
  locale: string,
  projectId: string,
  formData: FormData
) {
  await requireOwnedProject(locale, projectId);
  const parsed = parseProjectDocumentSupersedeInput(formData);

  const updated = await markProjectDocumentSuperseded(projectId, parsed.documentId);
  if (!updated) {
    throw new Error("문서 상태 변경에 실패했습니다.");
  }

  revalidateProjectDocumentPaths(locale, projectId);
  redirect({ href: `/projects/${projectId}/documents?type=${parsed.documentType}`, locale });
}

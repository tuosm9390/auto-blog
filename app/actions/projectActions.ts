"use server";

import { auth } from "@/auth";
import { refreshProjectState } from "@/lib/project-refresh";
import {
  createProject,
  getProjectById,
  getCurrentProjectPlan,
  updateProject,
  upsertCurrentProjectPlan,
} from "@/lib/projects";
import { ProjectStatus } from "@/lib/types";
import { redirect } from "@/i18n/routing";
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
  await refreshProjectState({
    projectId,
    triggeredBy: safeUserId,
    accessToken,
    sourceWindowDays: 7,
  });

  revalidatePath(`/${locale}/projects`);
  revalidatePath(`/${locale}/projects/${projectId}`);
  revalidatePath(`/${locale}/projects/${projectId}/drift`);
  redirect({ href: `/projects/${projectId}`, locale });
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

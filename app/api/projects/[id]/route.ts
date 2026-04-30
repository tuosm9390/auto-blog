import { NextRequest } from "next/server";
import { requireAuth, requireProjectOwnership, apiError, apiSuccess, isAuthError, parseJsonBody } from "@/lib/api-utils";
import {
  getAnalysisRunsByProject,
  getCurrentProjectPlan,
  getLatestStateSnapshot,
  updateProject,
  upsertCurrentProjectPlan,
} from "@/lib/projects";
import { ProjectStatus } from "@/lib/types";
import { z } from "zod";

interface RouteProps {
  params: Promise<{ id: string }>;
}

const updateProjectSchema = z.object({
  name: z.string().min(1, "프로젝트 이름은 필수입니다."),
  description: z.string().optional().nullable(),
  originalThesis: z.string().optional().nullable(),
  currentThesis: z.string().optional().nullable(),
  status: z.enum(["active", "paused", "archived"]).default("active"),
  githubRepoOwner: z.string().optional().nullable(),
  githubRepoName: z.string().optional().nullable(),
  planTitle: z.string().optional().default("Current Plan"),
  planContentMarkdown: z.string().optional().default(""),
});

export async function GET(request: Request, { params }: RouteProps) {
  try {
    const { session } = await requireAuth();
    const userId = session.user.id;

    if (!userId) {
      return apiError("인증이 필요합니다.", 401);
    }

    const { id } = await params;
    const project = await requireProjectOwnership(id, userId);
    const [plan, latestSnapshot, runs] = await Promise.all([
      getCurrentProjectPlan(id),
      getLatestStateSnapshot(id),
      getAnalysisRunsByProject(id),
    ]);

    return apiSuccess({
      project,
      plan,
      latestSnapshot,
      runs,
    });
  } catch (error: unknown) {
    if (isAuthError(error)) return apiError(error.message, error.message === "권한이 없습니다." ? 403 : 401);
    const message = error instanceof Error ? error.message : "프로젝트를 가져오는 중 오류가 발생했습니다.";
    return apiError(message, 500);
  }
}

export async function PUT(request: NextRequest, { params }: RouteProps) {
  try {
    const { session } = await requireAuth();
    const userId = session.user.id;

    if (!userId) {
      return apiError("인증이 필요합니다.", 401);
    }

    const { id } = await params;
    await requireProjectOwnership(id, userId);

    const body = await parseJsonBody(request);
    const parsed = updateProjectSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || "잘못된 입력값입니다.", 400);
    }

    const updated = await updateProject(id, userId, {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      originalThesis: parsed.data.originalThesis ?? null,
      currentThesis: parsed.data.currentThesis ?? null,
      status: parsed.data.status as ProjectStatus,
      githubRepoOwner: parsed.data.githubRepoOwner ?? null,
      githubRepoName: parsed.data.githubRepoName ?? null,
    });

    if (!updated) {
      return apiError("프로젝트 수정에 실패했습니다.", 500);
    }

    const existingPlan = await getCurrentProjectPlan(id);
    const shouldPersistPlan =
      Boolean(existingPlan) ||
      parsed.data.planContentMarkdown.trim().length > 0 ||
      parsed.data.planTitle.trim().length > 0;

    let plan = existingPlan;
    if (shouldPersistPlan) {
      plan = await upsertCurrentProjectPlan(
        id,
        parsed.data.planTitle.trim() || "Current Plan",
        parsed.data.planContentMarkdown
      );
    }

    const project = await requireProjectOwnership(id, userId);

    return apiSuccess({
      project,
      plan,
    });
  } catch (error: unknown) {
    if (isAuthError(error)) return apiError(error.message, error.message === "권한이 없습니다." ? 403 : 401);
    const message = error instanceof Error ? error.message : "프로젝트 수정 중 오류가 발생했습니다.";
    return apiError(message, 500);
  }
}

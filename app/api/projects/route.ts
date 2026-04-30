import { NextRequest } from "next/server";
import { requireAuth, apiError, apiSuccess, parseJsonBody, isAuthError } from "@/lib/api-utils";
import { createProject, getLatestStateSnapshot, getProjectsByOwner } from "@/lib/projects";
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

export async function GET() {
  try {
    const { session } = await requireAuth();
    const userId = session.user.id;

    if (!userId) {
      return apiError("인증이 필요합니다.", 401);
    }

    const projects = await getProjectsByOwner(userId);
    const enriched = await Promise.all(
      projects.map(async (project) => ({
        ...project,
        latestSnapshot: await getLatestStateSnapshot(project.id),
      }))
    );

    return apiSuccess({ projects: enriched });
  } catch (error: unknown) {
    if (isAuthError(error)) return apiError(error.message, 401);
    const message = error instanceof Error ? error.message : "프로젝트 목록을 가져오는 중 오류가 발생했습니다.";
    return apiError(message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { session } = await requireAuth();
    const userId = session.user.id;

    if (!userId) {
      return apiError("인증이 필요합니다.", 401);
    }

    const body = await parseJsonBody(request);
    const parsed = createProjectSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || "잘못된 입력값입니다.", 400);
    }

    const project = await createProject({
      ownerId: userId,
      ...parsed.data,
    });

    return apiSuccess({ project });
  } catch (error: unknown) {
    if (isAuthError(error)) return apiError(error.message, 401);
    const message = error instanceof Error ? error.message : "프로젝트 생성 중 오류가 발생했습니다.";
    return apiError(message, 500);
  }
}

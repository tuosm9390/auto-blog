import { NextRequest } from "next/server";
import { requireAuth, requireProjectOwnership, apiError, apiSuccess, parseJsonBody, isAuthError } from "@/lib/api-utils";
import { refreshProjectState } from "@/lib/project-refresh";
import { z } from "zod";

const refreshSchema = z.object({
  sourceWindowDays: z.number().int().min(1).max(30).optional().default(7),
});

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteProps) {
  try {
    const { session, accessToken } = await requireAuth();
    const userId = session.user.id;

    if (!userId) {
      return apiError("인증이 필요합니다.", 401);
    }

    const { id } = await params;
    await requireProjectOwnership(id, userId);

    const body = await parseJsonBody<Record<string, unknown>>(request).catch(() => ({}));
    const parsed = refreshSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message || "잘못된 입력값입니다.", 400);
    }

    const { snapshot, runId } = await refreshProjectState({
      projectId: id,
      triggeredBy: userId,
      accessToken,
      sourceWindowDays: parsed.data.sourceWindowDays,
    });

    return apiSuccess({
      success: true,
      runId,
      snapshot,
    });
  } catch (error: unknown) {
    if (isAuthError(error)) return apiError(error.message, error.message === "권한이 없습니다." ? 403 : 401);
    const message = error instanceof Error ? error.message : "상태 새로고침 중 오류가 발생했습니다.";
    return apiError(message, 500);
  }
}

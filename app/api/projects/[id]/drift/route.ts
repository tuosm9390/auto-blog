import { requireAuth, requireProjectOwnership, apiError, apiSuccess, isAuthError } from "@/lib/api-utils";
import { getLatestStateSnapshot } from "@/lib/projects";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteProps) {
  try {
    const { session } = await requireAuth();
    const userId = session.user.id;

    if (!userId) {
      return apiError("인증이 필요합니다.", 401);
    }

    const { id } = await params;
    const project = await requireProjectOwnership(id, userId);
    const latestSnapshot = await getLatestStateSnapshot(id);

    return apiSuccess({
      project: {
        id: project.id,
        name: project.name,
        originalThesis: project.original_thesis,
        currentThesis: project.current_thesis,
      },
      drift: latestSnapshot?.drift_json ?? [],
      generatedAt: latestSnapshot?.generated_at ?? null,
      driftCount: latestSnapshot?.drift_count ?? 0,
    });
  } catch (error: unknown) {
    if (isAuthError(error)) return apiError(error.message, error.message === "권한이 없습니다." ? 403 : 401);
    const message = error instanceof Error ? error.message : "드리프트 정보를 가져오는 중 오류가 발생했습니다.";
    return apiError(message, 500);
  }
}

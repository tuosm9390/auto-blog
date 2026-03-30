import { requireAuth, apiError, apiSuccess, isAuthError } from "@/lib/api-utils";
import { getUserRepos } from "@/lib/github";

export async function GET() {
  try {
    const { accessToken } = await requireAuth();
    const repos = await getUserRepos(accessToken);
    return apiSuccess({ repos });
  } catch (error: unknown) {
    console.error("Error fetching repos:", error);
    if (isAuthError(error)) return apiError(error.message, 401);
    return apiError("서버 오류가 발생했습니다.", 500);
  }
}

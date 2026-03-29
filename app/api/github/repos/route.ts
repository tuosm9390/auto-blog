import { NextRequest } from "next/server";
import { requireAuth, getServerAccessToken, apiError, apiSuccess, isAuthError } from "@/lib/api-utils";
import { getUserRepos } from "@/lib/github";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const accessToken = await getServerAccessToken(request);
    const repos = await getUserRepos(accessToken);
    return apiSuccess({ repos });
  } catch (error: unknown) {
    console.error("Error fetching repos:", error);
    if (isAuthError(error)) return apiError(error.message, 401);
    return apiError("서버 오류가 발생했습니다.", 500);
  }
}

import { requireAuth, apiError, apiSuccess, isAuthError } from "@/lib/api-utils";
import { getJobsByAuthor } from "@/lib/jobs";

export async function GET() {
  try {
    const { username } = await requireAuth();
    const jobs = await getJobsByAuthor(username);
    return apiSuccess({ jobs });
  } catch (error: unknown) {
    if (isAuthError(error)) return apiError(error.message, 401);
    return apiError("작업 목록을 가져오는 중 오류가 발생했습니다.", 500);
  }
}

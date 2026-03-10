import { NextRequest } from "next/server";
import { requireAuth, apiError, apiSuccess, isAuthError } from "@/lib/api-utils";
import { getJobById, deleteJob } from "@/lib/jobs";
import { decrementUsage } from "@/lib/subscription";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { username } = await requireAuth();
    const { id } = await params;
    
    const job = await getJobById(id);
    if (!job) return apiError("작업을 찾을 수 없습니다.", 404);

    if (job.github_username !== username) {
      return apiError("권한이 없습니다.", 403);
    }

    return apiSuccess({ job });
  } catch (error: unknown) {
    if (isAuthError(error)) return apiError(error.message, 401);
    return apiError("작업을 가져오는 중 오류가 발생했습니다.", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { username } = await requireAuth();
    const { id } = await params;
    
    const job = await getJobById(id);
    if (!job) return apiError("작업을 찾을 수 없습니다.", 404);
    if (job.github_username !== username) return apiError("권한이 없습니다.", 403);

    if (job.status === "pending" || job.status === "processing") {
      await decrementUsage(username);
    }

    await deleteJob(id);
    return apiSuccess({ success: true });
  } catch (error: unknown) {
    if (isAuthError(error)) return apiError(error.message, 401);
    return apiError("삭제 처리 중 오류가 발생했습니다.", 500);
  }
}

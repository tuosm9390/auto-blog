import { NextRequest } from "next/server";
import { getRecentCommits } from "@/lib/github";
import { getProcessedCommitShas } from "@/lib/settings";
import { requireAuth, apiError, apiSuccess, isAuthError } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const { username, accessToken } = await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const owner = searchParams.get("owner");
    const repo = searchParams.get("repo");
    const since = searchParams.get("since") || undefined;
    const until = searchParams.get("until") || undefined;

    if (!owner || !repo) {
      return apiError("owner와 repo 파라미터가 필요합니다.", 400);
    }

    const commits = await getRecentCommits(owner, repo, since, until, 30, accessToken);
    const processedShas = await getProcessedCommitShas(username, `${owner}/${repo}`);

    return apiSuccess({ commits, processedShas });
  } catch (error: unknown) {
    console.error("Github API error:", error);
    if (isAuthError(error)) return apiError(error.message, 401);
    const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다.";
    return apiError(message, 500);
  }
}

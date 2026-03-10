import { NextRequest } from "next/server";
import { getAllPosts, createPost, deletePost } from "@/lib/posts";
import { deleteJob } from "@/lib/jobs";
import { recordProcessedCommits } from "@/lib/settings";
import { requireAuth, apiError, apiSuccess, parseJsonBody, isAuthError } from "@/lib/api-utils";
import { z } from "zod";

const createPostSchema = z.object({
  title: z.string().min(1, "제목은 필수입니다."),
  content: z.string().min(1, "내용은 필수입니다."),
  summary: z.string().optional().default(""),
  repo: z.string().optional().default(""),
  commits: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  status: z.enum(["draft", "published"]).optional().default("published"),
  jobId: z.string().optional(),
});

export async function GET() {
  try {
    const posts = await getAllPosts({ includeContent: true });
    return apiSuccess({ posts });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다.";
    return apiError(message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { username } = await requireAuth();
    const body = await parseJsonBody(request);
    const parsedData = createPostSchema.safeParse(body);

    if (!parsedData.success) {
      return apiError("잘못된 입력값입니다.", 400);
    }

    const { title, content, summary, repo, commits, tags, status, jobId } = parsedData.data;

    const { id, slug } = await createPost(title, content, {
      summary,
      repo,
      commits,
      tags,
      status,
      author: username,
    });

    if (repo && commits.length > 0) {
      await recordProcessedCommits(username, repo, commits, id);
    }

    if (jobId) {
      await deleteJob(jobId).catch(err => console.error("Job cleanup error:", err));
    }

    return apiSuccess({ id, slug, message: "포스트가 생성되었습니다." });
  } catch (error: unknown) {
    if (isAuthError(error)) return apiError(error.message, 401);
    const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다.";
    return apiError(message, 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { username } = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get("slug");

    if (!slug) {
      return apiError("slug 파라미터가 필요합니다.", 400);
    }

    const deleted = await deletePost(slug, username);
    if (!deleted) {
      return apiError("포스트를 찾을 수 없거나 삭제에 실패했습니다.", 404);
    }

    return apiSuccess({ message: "포스트가 삭제되었습니다." });
  } catch (error: unknown) {
    if (isAuthError(error)) return apiError(error.message, 401);
    return apiError("서버 오류가 발생했습니다.", 500);
  }
}

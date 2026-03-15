import { NextRequest } from "next/server";
import { deletePost, updatePost } from "@/lib/posts";
import { requireAuth, requirePostOwnership, apiError, apiSuccess, parseJsonBody, isAuthError } from "@/lib/api-utils";
import { z } from "zod";

const updatePostSchema = z.object({
  title: z.string().min(1, "제목은 필수입니다."),
  content: z.string().min(1, "내용은 필수입니다."),
  summary: z.string().optional().default(""),
  repo: z.string().optional().default(""),
  commits: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
});

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteProps) {
  try {
    const { username } = await requireAuth();
    const { id } = await params;

    await requirePostOwnership(id, username);

    const success = await deletePost(id, username);
    if (success) {
      return apiSuccess({ success: true });
    } else {
      return apiError("삭제 처리 중 오류가 발생했습니다.", 500);
    }
  } catch (error: unknown) {
    if (isAuthError(error)) return apiError(error.message, error.message === "권한이 없습니다." ? 403 : 401);
    return apiError("서버 오류가 발생했습니다.", 500);
  }
}

export async function PUT(request: NextRequest, { params }: RouteProps) {
  try {
    const { username } = await requireAuth();
    const { id } = await params;

    await requirePostOwnership(id, username);

    const body = await parseJsonBody(request);
    const parsedData = updatePostSchema.safeParse(body);
    if (!parsedData.success) {
      return apiError("잘못된 입력값입니다.", 400);
    }

    const { title, content, summary, repo, commits, tags } = parsedData.data;

    const success = await updatePost(id, username, title, content, {
      summary,
      repo,
      commits,
      tags,
    });

    if (success) {
      return apiSuccess({ success: true });
    } else {
      return apiError("업데이트 처리 중 오류가 발생했습니다.", 500);
    }
  } catch (error: unknown) {
    if (isAuthError(error)) return apiError(error.message, error.message === "권한이 없습니다." ? 403 : 401);
    return apiError("서버 오류가 발생했습니다.", 500);
  }
}
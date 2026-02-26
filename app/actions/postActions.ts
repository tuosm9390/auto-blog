"use server";

import { auth } from "@/auth";
import { updatePost, publishDraft, deletePost, createPost } from "@/lib/posts";
import { deleteJob } from "@/lib/jobs";
import { recordProcessedCommits } from "@/lib/settings";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const updateSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "제목은 필수입니다."),
  content: z.string().min(1, "내용은 필수입니다."),
  summary: z.string().optional().default(""),
  repo: z.string().optional().default(""),
  commits: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
});

const createSchema = z.object({
  title: z.string().min(1, "제목은 필수입니다."),
  content: z.string().min(1, "내용은 필수입니다."),
  summary: z.string().optional().default(""),
  repo: z.string().optional().default(""),
  commits: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  status: z.enum(["draft", "published"]).optional().default("published"),
  jobId: z.string().optional(),
});

export async function createPostAction(formData: z.infer<typeof createSchema>) {
  const session = await auth();
  if (!session?.user?.username) {
    return { error: "권한이 없습니다." };
  }

  const parsed = createSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: "입력값이 올바르지 않습니다." };
  }

  const { title, content, summary, repo, commits, tags, status, jobId } = parsed.data;

  try {
    const { id, slug } = await createPost(title, content, {
      summary,
      repo,
      commits,
      tags,
      status,
      author: session.user.username,
    });

    if (repo && commits.length > 0) {
      await recordProcessedCommits(session.user.username, repo, commits, id);
    }

    if (jobId) {
      await deleteJob(jobId).catch(err => console.error("Job cleanup error:", err));
    }

    revalidatePath("/settings");
    revalidatePath("/");
    
    return { success: true, id, slug };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "포스트 생성에 실패했습니다." };
  }
}

export async function updatePostAction(formData: z.infer<typeof updateSchema>) {
  const session = await auth();
  if (!session?.user?.username) {
    return { error: "권한이 없습니다." };
  }

  const parsed = updateSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: "입력값이 올바르지 않습니다." };
  }

  const { id, title, content, ...metadata } = parsed.data;
  
  const success = await updatePost(id, title, content, metadata);
  if (success) {
    revalidatePath(`/posts/${id}`);
    revalidatePath(`/@${session.user.username}/${id}`);
    return { success: true };
  }
  return { error: "업데이트에 실패했습니다." };
}

export async function publishDraftAction(postId: string) {
  const session = await auth();
  if (!session?.user?.username) {
    return { error: "권한이 없습니다." };
  }

  const success = await publishDraft(postId);
  if (success) {
    revalidatePath("/jobs"); // Draft 목록 갱신
    return { success: true };
  }
  return { error: "게시에 실패했습니다." };
}

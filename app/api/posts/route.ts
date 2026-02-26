import { NextRequest, NextResponse } from "next/server";
import { getAllPosts, createPost, deletePost } from "@/lib/posts";
import { deleteJob } from "@/lib/jobs";
import { recordProcessedCommits } from "@/lib/settings";
import { auth } from "@/auth";
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
    const posts = await getAllPosts();
    return NextResponse.json({ posts });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsedData = createPostSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json(
        { error: "잘못된 입력값입니다.", details: parsedData.error.format() },
        { status: 400 }
      );
    }

    const { title, content, summary, repo, commits, tags, status, jobId } = parsedData.data;

    // author는 반드시 세션의 GitHub username만 사용
    const author = session.user.username;
    if (!author) {
      return NextResponse.json({ error: "사용자 정보를 확인할 수 없습니다." }, { status: 401 });
    }

    const { id, slug } = await createPost(title, content, {
      summary,
      repo,
      commits,
      tags,
      status,
      author,
    });

    if (repo && commits.length > 0) {
      await recordProcessedCommits(author, repo, commits, id);
    }

    if (jobId) {
      await deleteJob(jobId).catch(err => console.error("Job cleanup error:", err));
    }

    return NextResponse.json({ id, slug, message: "포스트가 생성되었습니다." });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  // 인증 확인
  const session = await auth();
  if (!session?.user?.username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json(
      { error: "slug 파라미터가 필요합니다." },
      { status: 400 }
    );
  }

  const deleted = await deletePost(slug, session.user.username);
  if (!deleted) {
    return NextResponse.json(
      { error: "포스트를 찾을 수 없거나 삭제에 실패했습니다." },
      { status: 404 }
    );
  }

  return NextResponse.json({ message: "포스트가 삭제되었습니다." });
}

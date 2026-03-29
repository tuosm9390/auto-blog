import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { getPostById } from "@/lib/posts";
import { getToken } from "next-auth/jwt";

export class AuthError extends Error {
  constructor(message: string = "인증이 필요합니다.") {
    super(message);
    this.name = "AuthError";
  }
}

export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.username) {
    throw new AuthError("인증이 필요합니다.");
  }
  return { session, username: session.user.username };
}

export async function requirePrivilegedAuth() {
  const session = await auth();
  const role = (session?.user as any)?.role || 'user';
  const isPrivileged = role === 'admin' || role === 'tester';

  if (!session?.user?.username) {
    throw new AuthError("인증이 필요합니다.");
  }

  if (!isPrivileged) {
    throw new AuthError("권한이 없습니다. 테스터 신청 후 이용 가능합니다.");
  }

  return { session, username: session.user.username, role };
}

// GitHub accessToken은 세션에 포함하지 않고 JWT(서버 전용)에서 직접 조회
// GitHub API 호출이 필요한 route handler에서만 사용 (request 객체 필요)
export async function getServerAccessToken(req: Request): Promise<string> {
  const token = await getToken({ req: req as any });
  if (!token?.accessToken) {
    throw new AuthError("인증이 필요합니다.");
  }
  return token.accessToken as string;
}

export async function requireAdminAuth() {
  const session = await auth();
  const role = (session?.user as any)?.role || 'user';

  if (role !== 'admin') {
    throw new AuthError("관리자 권한이 필요합니다.");
  }

  return { session, username: session?.user?.username };
}

export function apiError(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function apiSuccess(data: unknown) {
  return NextResponse.json(data);
}

export async function parseJsonBody<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new Error("Invalid JSON body");
  }
}

export async function requirePostOwnership(postId: string, username: string) {
  const post = await getPostById(postId);
  if (!post) {
    throw new Error("Post not found");
  }
  if (post.author !== username) {
    throw new AuthError("권한이 없습니다.");
  }
  return post;
}

export async function requireJobOwnership(jobId: string, username: string) {
  const { getJobById } = await import("./jobs");
  const job = await getJobById(jobId);
  if (!job) {
    throw new Error("Job not found");
  }
  if (job.github_username !== username) {
    throw new AuthError("권한이 없습니다.");
  }
  return job;
}

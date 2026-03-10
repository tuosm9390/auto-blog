import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { getPostById } from "@/lib/posts";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.username || !session?.user?.accessToken) {
    throw new AuthError("인증이 필요합니다.");
  }
  return { session, username: session.user.username, accessToken: session.user.accessToken };
}

export class AuthError extends Error {
  constructor(message: string = "인증이 필요합니다.") {
    super(message);
    this.name = "AuthError";
  }
}

export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
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

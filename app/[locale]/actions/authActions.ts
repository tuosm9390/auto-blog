"use server";

import { signIn, signOut } from "@/auth";

/**
 * 로그인 처리 서버 액션
 * @param provider 제공자 이름 (github 등)
 */
export async function handleSignIn(provider?: string) {
  await signIn(provider);
}

/**
 * 로그아웃 처리 서버 액션
 */
export async function handleSignOut() {
  await signOut();
}

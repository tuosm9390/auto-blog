"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 animate-fade-in-up">
      <div className="w-full max-w-sm border border-border-subtle rounded-2xl p-8 bg-surface/50">
        <div className="text-center mb-8">
          <span className="inline-block px-3 py-1 border border-border-subtle rounded-full text-xs tracking-widest text-text-tertiary uppercase mb-4">
            Secure Login
          </span>
          <h1 className="text-2xl font-display font-semibold mb-2">로그인</h1>
          <p className="text-sm text-text-secondary">GitHub 계정으로 시작하세요</p>
        </div>
        <button
          onClick={() => signIn("github", { callbackUrl: "/" })}
          className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-accent text-black font-semibold rounded-lg hover:bg-accent-hover transition-colors cursor-pointer"
        >
          <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
          </svg>
          Continue with GitHub
        </button>
        <p className="text-xs text-text-tertiary text-center mt-6 whitespace-pre-line">
          로그인 시 GitHub 커밋 읽기 권한이 필요합니다.{"\n"}
          비공개 레포지토리는 설정에서 선택적으로 연동 가능합니다.
        </p>
      </div>
    </div>
  );
}

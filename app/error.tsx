"use client";

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="bg-surface border border-border-subtle p-8 rounded-2xl max-w-md w-full">
        <h2 className="text-2xl font-bold text-error mb-4">문제가 발생했습니다</h2>
        <p className="text-text-secondary mb-6">
          데이터를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
        </p>
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-accent text-black font-semibold rounded-lg hover:bg-accent-hover transition-colors"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}

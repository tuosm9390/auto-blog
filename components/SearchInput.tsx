"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function SearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [text, setText] = useState(initialQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      const currentQ = searchParams.get("q") || "";
      if (currentQ === text) return;

      const params = new URLSearchParams(searchParams.toString());
      if (text) {
        params.set("q", text);
      } else {
        params.delete("q");
      }
      router.push(`/posts?${params.toString()}`);
    }, 500);

    return () => clearTimeout(timer);
  }, [text, router, searchParams]);

  return (
    <div className="relative">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="검색어 입력..."
        className="w-full bg-surface border border-border-subtle rounded-lg pl-10 pr-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border-strong transition-colors"
      />
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary text-sm">🔍</span>
    </div>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function SearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [text, setText] = useState(initialQuery);

  // Debounce handling
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
      router.push(`/?${params.toString()}`);
    }, 500);

    return () => clearTimeout(timer);
  }, [text, router, searchParams]);

  return (
    <div className="search-input-wrapper">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="검색어 입력..."
        className="form-input search-input"
      />
      <span className="search-icon">🔍</span>
    </div>
  );
}

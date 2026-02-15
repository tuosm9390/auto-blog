"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function TagFilter({ tags }: { tags: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTag = searchParams.get("tag");

  const toggleTag = (tag: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (currentTag === tag) {
      params.delete("tag");
    } else {
      params.set("tag", tag);
    }
    router.push(`/?${params.toString()}`);
  };

  if (tags.length === 0) return null;

  return (
    <div className="tag-filter">
      <div className="tag-filter__label">Tags:</div>
      <div className="tag-filter__list">
        {tags.map((tag) => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={`tag-btn ${currentTag === tag ? "tag-btn--active" : ""}`}
          >
            #{tag}
          </button>
        ))}
        {currentTag && (
          <button
            onClick={() => router.push("/")}
            className="tag-reset-btn"
          >
            ✕ 초기화
          </button>
        )}
      </div>
    </div>
  );
}

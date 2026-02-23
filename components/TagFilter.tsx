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
    router.push(`/posts?${params.toString()}`);
  };

  if (tags.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-text-tertiary font-medium">Tags:</span>
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => toggleTag(tag)}
          className={`px-2.5 py-1 rounded-full text-xs transition-all cursor-pointer ${currentTag === tag
              ? "bg-accent text-black font-semibold"
              : "border border-border-subtle text-text-secondary hover:border-border-strong"
            }`}
        >
          #{tag}
        </button>
      ))}
      {currentTag && (
        <button
          onClick={() => router.push("/posts")}
          className="px-2.5 py-1 rounded-full text-xs text-error border border-error/50 hover:bg-error/10 transition-colors cursor-pointer"
        >
          ✕ 초기화
        </button>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import type { Post } from "@/lib/types";

interface PostsClientProps {
  initialPosts: Post[];
  tags: string[];
  repos: string[];
}

export default function PostsClient({ initialPosts, tags, repos }: PostsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRepo, setSelectedRepo] = useState("");
  const [selectedTag, setSelectedTag] = useState("");

  const filteredPosts = initialPosts.filter((post) => {
    const matchQuery =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRepo = selectedRepo ? post.repo === selectedRepo : true;
    const matchTag = selectedTag ? post.tags.includes(selectedTag) : true;
    return matchQuery && matchRepo && matchTag;
  });

  return (
    <div>
      {/* 필터 바 */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          type="text"
          placeholder="검색어를 입력하세요..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-surface border border-border-subtle rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border-strong transition-colors"
        />
        <select
          value={selectedRepo}
          onChange={(e) => setSelectedRepo(e.target.value)}
          className="bg-surface border border-border-subtle rounded-lg px-4 py-3 text-sm text-text-secondary focus:outline-none focus:border-border-strong transition-colors cursor-pointer"
        >
          <option value="">전체 저장소</option>
          {repos.map((repo) => (
            <option key={repo} value={repo}>{repo}</option>
          ))}
        </select>
        <select
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
          className="bg-surface border border-border-subtle rounded-lg px-4 py-3 text-sm text-text-secondary focus:outline-none focus:border-border-strong transition-colors cursor-pointer"
        >
          <option value="">전체 태그</option>
          {tags.map((tag) => (
            <option key={tag} value={tag}>#{tag}</option>
          ))}
        </select>
      </div>

      {/* 포스트 리스트 (1열) */}
      <div className="flex flex-col gap-4">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post, idx) => (
            <Link
              key={post.id}
              href={`/posts/${post.id}`}
              className="block border border-border-subtle rounded-xl p-6 hover:bg-surface hover:border-border-strong transition-all duration-300 group animate-fade-in-up"
              style={{ animationDelay: `${Math.min(idx * 0.05, 0.3)}s` }}
            >
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="text-text-tertiary">
                  {format(new Date(post.date || new Date()), "yyyy.MM.dd", { locale: ko })}
                </span>
                <span className="px-2 py-0.5 border border-border-subtle rounded-full text-text-tertiary">
                  {post.repo || "Unknown"}
                </span>
              </div>
              <h2 className="text-lg font-semibold mb-2 text-text-primary group-hover:text-accent transition-colors line-clamp-2">
                {post.title}
              </h2>
              <p className="text-sm text-text-secondary mb-3 line-clamp-2">{post.summary}</p>
              <div className="flex gap-2 flex-wrap">
                {post.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-xs text-text-tertiary">#{tag}</span>
                ))}
                {post.tags.length > 3 && <span className="text-xs text-text-tertiary">+{post.tags.length - 3}</span>}
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-16 text-text-secondary whitespace-pre-line">
            <p>조건에 맞는 포스트가 발견되지 않았습니다.{"\n"}다른 검색어나 태그를 선택해 보세요.</p>
          </div>
        )}
      </div>
    </div>
  );
}

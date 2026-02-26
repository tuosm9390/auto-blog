"use client";

import { useState } from "react";
import PostCard from "./PostCard";
import type { Post } from "@/lib/types";

interface PostsClientProps {
  initialPosts: Post[];
  tags: string[];
  repos: string[];
  basePath?: string; // 특정 유저 프로필 페이지일 경우 해당 유저 경로 (예: /@username)
}

export default function PostsClient({
  initialPosts,
  tags,
  repos,
  basePath,
}: PostsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRepo, setSelectedRepo] = useState("");
  const [selectedTag, setSelectedTag] = useState("");

  const filteredPosts = initialPosts.filter((post) => {
    const matchQuery =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.summary &&
        post.summary.toLowerCase().includes(searchQuery.toLowerCase()));
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
            <option key={repo} value={repo}>
              {repo}
            </option>
          ))}
        </select>
        <select
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
          className="bg-surface border border-border-subtle rounded-lg px-4 py-3 text-sm text-text-secondary focus:outline-none focus:border-border-strong transition-colors cursor-pointer"
        >
          <option value="">전체 태그</option>
          {tags.map((tag) => (
            <option key={tag} value={tag}>
              #{tag}
            </option>
          ))}
        </select>
      </div>

      {/* 포스트 리스트 (그리드 레이아웃) */}
      {filteredPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post, idx) => {
            const authorPart = post.author || "unknown";
            const slugPart = post.id;
            const postHref = basePath
              ? `${basePath}/${slugPart}`
              : `/@${authorPart}/${slugPart}`;

            return (
              <PostCard key={post.id} post={post} index={idx} href={postHref} />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-text-secondary whitespace-pre-line border border-dashed border-border-subtle rounded-xl bg-surface/30">
          <p>
            조건에 맞는 포스트가 발견되지 않았습니다.{"\n"}다른 검색어나 태그를
            선택해 보세요.
          </p>
        </div>
      )}
    </div>
  );
}

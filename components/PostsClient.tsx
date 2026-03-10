"use client";

import { useState } from "react";
import { Post } from "@/lib/types";
import PostCard from "./PostCard";
import SearchInput from "./SearchInput";
import { SelectFilter } from "@/components/ui/SelectFilter";
import { useTranslations } from "next-intl";

interface PostsClientProps {
  initialPosts: Post[];
  tags: string[];
  repos?: string[];
  basePath?: string;
}

export default function PostsClient({ initialPosts, tags, repos, basePath }: PostsClientProps) {
  const [query, setValue] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [activeRepo, setActiveRepo] = useState("");
  const t = useTranslations("Search");

  const filteredPosts = initialPosts.filter((post) => {
    const matchesQuery =
      post.title.toLowerCase().includes(query.toLowerCase()) ||
      post.summary.toLowerCase().includes(query.toLowerCase());
    const matchesTag = activeTag === "" || post.tags.includes(activeTag);
    const matchesRepo = activeRepo === "" || post.repo === activeRepo;
    return matchesQuery && matchesTag && matchesRepo;
  });

  return (
    <div className="space-y-8">
      {/* 필터 섹션 */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <SearchInput initialValue={query} onSearch={setValue} />
          
          <div className="flex gap-3 w-full md:w-auto">
            {repos && repos.length > 0 && (
              <SelectFilter
                options={repos}
                activeValue={activeRepo}
                onChange={setActiveRepo}
                labelAll={t("allRepos")}
                formatOption={(val) => val.split("/").pop() || val}
                className="min-w-40"
              />
            )}
            <SelectFilter
              options={tags}
              activeValue={activeTag}
              onChange={setActiveTag}
              labelAll={t("allTags")}
              formatOption={(val) => "#" + val}
              className="min-w-32"
            />
          </div>
        </div>
      </div>

      {/* 결과 수 */}
      <div className="text-xs text-text-tertiary font-medium">
        {t("totalCount", { count: filteredPosts.length })}
      </div>

      {/* 그리드 레이아웃 */}
      {filteredPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post, idx) => (
            <PostCard 
              key={post.id} 
              post={post} 
              index={idx} 
              href={basePath ? `${basePath}/` : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center border border-dashed border-border-subtle rounded-3xl bg-surface/30">
          <p className="text-text-tertiary">{t("noResults")}</p>
        </div>
      )}
    </div>
  );
}

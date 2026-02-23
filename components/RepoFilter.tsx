"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface RepoFilterProps {
  repos: string[];
}

export default function RepoFilter({ repos }: RepoFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentRepo = searchParams.get("repo");

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );

  const handleRepoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    router.push(`/posts?${createQueryString("repo", value)}`);
  };

  if (repos.length === 0) return null;

  return (
    <select
      className="bg-surface border border-border-subtle rounded-lg px-4 py-3 text-sm text-text-secondary focus:outline-none focus:border-border-strong transition-colors cursor-pointer min-w-40"
      value={currentRepo || ""}
      onChange={handleRepoChange}
    >
      <option value="">모든 프로젝트</option>
      {repos.map((repo) => (
        <option key={repo} value={repo}>
          {repo.split("/")[1] || repo}
        </option>
      ))}
    </select>
  );
}

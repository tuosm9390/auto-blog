"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import classNames from "classnames";

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
    router.push(`/?${createQueryString("repo", value)}`);
  };

  if (repos.length === 0) return null;

  return (
    <div className="repo-filter">
      <select
        className="form-input form-input--sm"
        value={currentRepo || ""}
        onChange={handleRepoChange}
        style={{ minWidth: "160px" }}
      >
        <option value="">모든 프로젝트</option>
        {repos.map((repo) => (
          <option key={repo} value={repo}>
            {repo.split("/")[1] || repo} {/* owner/repo -> repo */}
          </option>
        ))}
      </select>
    </div>
  );
}

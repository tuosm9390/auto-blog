"use client";

interface RepoFilterProps {
  repos: string[];
  activeRepo: string;
  onRepoChange: (repo: string) => void;
  labelAll?: string;
}

export default function RepoFilter({ 
  repos, 
  activeRepo, 
  onRepoChange, 
  labelAll = "All Repositories" 
}: RepoFilterProps) {
  if (repos.length === 0) return null;

  return (
    <select
      className="bg-surface border border-border-subtle rounded-lg px-4 py-2 text-sm text-text-secondary focus:outline-none focus:border-border-strong transition-colors cursor-pointer min-w-40"
      value={activeRepo}
      onChange={(e) => onRepoChange(e.target.value)}
    >
      <option value="">{labelAll}</option>
      {repos.map((repo) => (
        <option key={repo} value={repo}>
          {repo.split("/").pop() || repo}
        </option>
      ))}
    </select>
  );
}

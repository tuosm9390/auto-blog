export interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

export interface FileDiff {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
}

export interface CommitDiff {
  commit: CommitInfo;
  files: FileDiff[];
  stats: {
    total: number;
    additions: number;
    deletions: number;
  };
}

export type PostingMode = "auto" | "manual";
export type PostStatus = "draft" | "published";
export type AutoSchedule = "daily" | "weekly";

export interface Post {
  id: string;
  slug: string;
  title: string;
  date: string;
  summary: string;
  content: string;
  repo: string;
  commits: string[];
  tags: string[];
  status: PostStatus;
  author: string;
}

export interface UserSettings {
  id: string;
  github_username: string;
  posting_mode: PostingMode;
  auto_repos: string[];
  auto_schedule: AutoSchedule;
  created_at: string;
  updated_at: string;
}

export interface GenerateRequest {
  owner: string;
  repo: string;
  since?: string;
  until?: string;
  commitShas?: string[];
}

export interface GenerateResult {
  title: string;
  content: string;
  summary: string;
  tags: string[];
  commits: string[];
  repo: string;
}

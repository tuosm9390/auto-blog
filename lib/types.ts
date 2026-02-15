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

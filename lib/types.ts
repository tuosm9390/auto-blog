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
export type SubscriptionTier = "free" | "pro" | "business";

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
  userContext?: string;
}

export interface GenerateResult {
  title: string;
  content: string;
  summary: string;
  tags: string[];
  commits: string[];
  repo: string;
  userContext?: string;
  id?: string;
  slug?: string;
  author?: string;
}
export type JobStatus = "pending" | "processing" | "completed" | "failed";

export interface AIJob {
  id: string;
  github_username: string;
  repo: string;
  commit_shas: string[];
  status: JobStatus;
  result?: GenerateResult;
  error?: string;
  created_at: string;
  updated_at: string;
}

export interface Repo {
  name: string;
  full_name: string;
  private: boolean;
}

export interface SubscriptionInfo {
  tier: string;
  usageCount: number;
  monthlyLimit: number;
  remaining: number;
  resetDate: string | null;
  billingCycle?: 'monthly' | 'yearly' | null;
}

export interface UserSettingsData {
  github_username: string;
  posting_mode: PostingMode;
  auto_repos: string[];
  auto_schedule: AutoSchedule;
}

export interface DemoPost extends Omit<Post, 'author' | 'repo'> {
  author: "";
  repo: "";
}

import { z } from "zod";

export const DemoPostSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  date: z.string(),
  summary: z.string(),
  content: z.string(),
  tags: z.array(z.string()),
  author: z.literal(""),
  repo: z.literal(""),
  status: z.literal("published"),
});

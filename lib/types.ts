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

export interface PullRequestContext {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: string;
  merged: boolean;
  url: string;
  author: string;
  merged_at?: string | null;
}

export interface IssueContext {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: string;
  url: string;
  author: string;
}

export type PostingMode = "auto" | "manual";
export type AutoSchedule = "daily" | "weekly";
export type SubscriptionTier = "free" | "pro" | "business";

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

export interface Repo {
  name: string;
  full_name: string;
  private: boolean;
  description?: string | null;
  url?: string;
  updated_at?: string | null;
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

export interface DemoPost {
  id: string;
  slug: string;
  title: string;
  date: string;
  summary: string;
  content: string;
  commits: string[];
  tags: string[];
  is_public: boolean;
  author: "";
  repo: "";
}

export type ProjectStatus = "active" | "paused" | "archived";
export type AnalysisRunStatus = "pending" | "processing" | "completed" | "failed";
export type PlanItemStatus = "not_started" | "in_progress" | "done" | "at_risk" | "changed";
export type DriftType = "strategic" | "scope" | "execution";

export interface Project {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  original_thesis: string | null;
  current_thesis: string | null;
  status: ProjectStatus;
  github_repo_owner: string | null;
  github_repo_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectPlan {
  id: string;
  project_id: string;
  title: string;
  content_markdown: string;
  summary: string | null;
  version: number;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlanProgressItem {
  label: string;
  status: PlanItemStatus | string;
  evidence?: string;
  notes?: string;
}

export interface DriftItem {
  title: string;
  drift_type?: DriftType | string;
  original: string;
  current: string;
  why: string;
  evidence_refs?: string[];
}

export interface EvidenceItem {
  type: string;
  title: string;
  ref?: string | null;
  url?: string | null;
}

export interface StateSnapshot {
  id: string;
  project_id: string;
  analysis_run_id: string | null;
  summary: string;
  progress_percent: number;
  current_phase: string;
  blocker_count: number;
  risk_count: number;
  drift_count: number;
  watch_next: string[];
  plan_progress_json: PlanProgressItem[];
  drift_json: DriftItem[];
  evidence_json: EvidenceItem[];
  raw_output_json: Record<string, unknown>;
  generated_at: string;
  created_at: string;
}

export interface AnalysisRun {
  id: string;
  project_id: string;
  status: AnalysisRunStatus;
  triggered_by: string | null;
  input_summary: string | null;
  source_window_days: number;
  latest_snapshot_id: string | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
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
  is_public: z.boolean().default(true),
});

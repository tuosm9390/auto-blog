import { cache } from "react";
import { supabaseAdmin as supabase } from "./supabase-admin";
import {
  AnalysisRun,
  AnalysisRunStatus,
  Project,
  ProjectPlan,
  ProjectStatus,
  StateSnapshot,
} from "./types";

const PROJECT_MEMORY_SETUP_MESSAGE =
  "Project Memory schema가 아직 적용되지 않았습니다. scripts/add-project-memory-core.sql을 먼저 실행하세요.";

function isMissingProjectMemoryTableError(error: { code?: string; message?: string } | null | undefined) {
  return (
    error?.code === "42P01" ||
    error?.message?.toLowerCase().includes("relation") === true ||
    error?.message?.toLowerCase().includes("does not exist") === true
  );
}

export async function getProjectMemorySetupState(): Promise<{
  ready: boolean;
  message?: string;
}> {
  const { error } = await supabase.from("projects").select("id").limit(1);

  if (error && isMissingProjectMemoryTableError(error)) {
    return {
      ready: false,
      message: PROJECT_MEMORY_SETUP_MESSAGE,
    };
  }

  return { ready: true };
}

function slugifyProjectName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s가-힣-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

async function getUniqueProjectSlug(ownerId: string, name: string): Promise<string> {
  const baseSlug = slugifyProjectName(name);
  let uniqueSlug = baseSlug;

  const { data: existing, error } = await supabase
    .from("projects")
    .select("slug")
    .eq("owner_id", ownerId)
    .like("slug", `${baseSlug}%`);

  if (error || !existing || existing.length === 0) {
    return uniqueSlug;
  }

  const slugSet = new Set(existing.map((item) => item.slug));
  if (!slugSet.has(baseSlug)) {
    return uniqueSlug;
  }

  let counter = 1;
  while (slugSet.has(`${baseSlug}-${counter}`)) {
    counter++;
    if (counter > 100) {
      throw new Error("project slug 생성에 실패했습니다.");
    }
  }

  uniqueSlug = `${baseSlug}-${counter}`;
  return uniqueSlug;
}

interface CreateProjectInput {
  ownerId: string;
  name: string;
  description?: string;
  originalThesis?: string;
  currentThesis?: string;
  githubRepoOwner?: string;
  githubRepoName?: string;
  planTitle?: string;
  planContentMarkdown?: string;
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const slug = await getUniqueProjectSlug(input.ownerId, input.name);
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("projects")
    .insert({
      owner_id: input.ownerId,
      name: input.name,
      slug,
      description: input.description ?? null,
      original_thesis: input.originalThesis ?? null,
      current_thesis: input.currentThesis ?? input.originalThesis ?? null,
      status: "active" as ProjectStatus,
      github_repo_owner: input.githubRepoOwner ?? null,
      github_repo_name: input.githubRepoName ?? null,
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("createProject DB error:", error?.message);
    if (isMissingProjectMemoryTableError(error)) {
      throw new Error(PROJECT_MEMORY_SETUP_MESSAGE);
    }
    throw new Error("프로젝트 생성에 실패했습니다.");
  }

  if (input.planContentMarkdown?.trim()) {
    const { error: planError } = await supabase.from("project_plans").insert({
      project_id: data.id,
      title: input.planTitle ?? "Current Plan",
      content_markdown: input.planContentMarkdown,
      summary: null,
      version: 1,
      is_current: true,
      created_at: now,
      updated_at: now,
    });

    if (planError) {
      console.error("createProject plan insert error:", planError.message);
      throw new Error("프로젝트는 생성됐지만 계획 문서 저장에 실패했습니다.");
    }
  }

  return data as Project;
}

export async function getProjectsByOwner(ownerId: string): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("owner_id", ownerId)
    .order("updated_at", { ascending: false });

  if (error || !data) {
    console.error("getProjectsByOwner error:", error?.message);
    if (isMissingProjectMemoryTableError(error)) {
      console.error(PROJECT_MEMORY_SETUP_MESSAGE);
    }
    return [];
  }

  return data as Project[];
}

export const getProjectById = cache(async function getProjectById(id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    if (isMissingProjectMemoryTableError(error)) {
      console.error(PROJECT_MEMORY_SETUP_MESSAGE);
    }
    return null;
  }

  return data as Project;
});

export const getProjectByOwnerAndSlug = cache(async function getProjectByOwnerAndSlug(
  ownerId: string,
  slug: string
): Promise<Project | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("owner_id", ownerId)
    .eq("slug", slug)
    .single();

  if (error || !data) {
    if (isMissingProjectMemoryTableError(error)) {
      console.error(PROJECT_MEMORY_SETUP_MESSAGE);
    }
    return null;
  }

  return data as Project;
});

export async function updateProject(
  id: string,
  ownerId: string,
  updates: {
    name?: string;
    description?: string | null;
    originalThesis?: string | null;
    currentThesis?: string | null;
    status?: ProjectStatus;
    githubRepoOwner?: string | null;
    githubRepoName?: string | null;
  }
): Promise<boolean> {
  const updateData = {
    name: updates.name,
    description: updates.description,
    original_thesis: updates.originalThesis,
    current_thesis: updates.currentThesis,
    status: updates.status,
    github_repo_owner: updates.githubRepoOwner,
    github_repo_name: updates.githubRepoName,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("projects")
    .update(updateData)
    .eq("id", id)
    .eq("owner_id", ownerId);

  if (error) {
    console.error("updateProject error:", error.message);
    return false;
  }

  return true;
}

export async function getCurrentProjectPlan(projectId: string): Promise<ProjectPlan | null> {
  const { data, error } = await supabase
    .from("project_plans")
    .select("*")
    .eq("project_id", projectId)
    .eq("is_current", true)
    .order("version", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    if (isMissingProjectMemoryTableError(error)) {
      console.error(PROJECT_MEMORY_SETUP_MESSAGE);
    }
    return null;
  }

  return data as ProjectPlan;
}

export async function upsertCurrentProjectPlan(
  projectId: string,
  title: string,
  contentMarkdown: string
): Promise<ProjectPlan> {
  const existing = await getCurrentProjectPlan(projectId);
  const now = new Date().toISOString();

  if (!existing) {
    const { data, error } = await supabase
      .from("project_plans")
      .insert({
        project_id: projectId,
        title,
        content_markdown: contentMarkdown,
        summary: null,
        version: 1,
        is_current: true,
        created_at: now,
        updated_at: now,
      })
      .select("*")
      .single();

    if (error || !data) {
      console.error("upsertCurrentProjectPlan insert error:", error?.message);
      if (isMissingProjectMemoryTableError(error)) {
        throw new Error(PROJECT_MEMORY_SETUP_MESSAGE);
      }
      throw new Error("프로젝트 계획 저장에 실패했습니다.");
    }

    return data as ProjectPlan;
  }

  const { data, error } = await supabase
    .from("project_plans")
    .update({
      title,
      content_markdown: contentMarkdown,
      updated_at: now,
    })
    .eq("id", existing.id)
    .select("*")
    .single();

  if (error || !data) {
    console.error("upsertCurrentProjectPlan update error:", error?.message);
    if (isMissingProjectMemoryTableError(error)) {
      throw new Error(PROJECT_MEMORY_SETUP_MESSAGE);
    }
    throw new Error("프로젝트 계획 수정에 실패했습니다.");
  }

  return data as ProjectPlan;
}

export async function createAnalysisRun(input: {
  projectId: string;
  triggeredBy?: string;
  inputSummary?: string;
  sourceWindowDays?: number;
}): Promise<AnalysisRun> {
  const { data, error } = await supabase
    .from("analysis_runs")
    .insert({
      project_id: input.projectId,
      status: "pending" as AnalysisRunStatus,
      triggered_by: input.triggeredBy ?? null,
      input_summary: input.inputSummary ?? null,
      source_window_days: input.sourceWindowDays ?? 7,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("createAnalysisRun error:", error?.message);
    if (isMissingProjectMemoryTableError(error)) {
      throw new Error(PROJECT_MEMORY_SETUP_MESSAGE);
    }
    throw new Error("분석 실행 생성에 실패했습니다.");
  }

  return data as AnalysisRun;
}

export async function updateAnalysisRunStatus(
  runId: string,
  status: AnalysisRunStatus,
  updates?: {
    latestSnapshotId?: string | null;
    errorMessage?: string | null;
    startedAt?: string | null;
    completedAt?: string | null;
  }
): Promise<boolean> {
  const updateData = {
    status,
    latest_snapshot_id: updates?.latestSnapshotId,
    error_message: updates?.errorMessage,
    started_at: updates?.startedAt,
    completed_at: updates?.completedAt,
  };

  const { error } = await supabase
    .from("analysis_runs")
    .update(updateData)
    .eq("id", runId);

  if (error) {
    console.error("updateAnalysisRunStatus error:", error.message);
    return false;
  }

  return true;
}

export async function createStateSnapshot(input: {
  projectId: string;
  analysisRunId?: string | null;
  summary: string;
  progressPercent: number;
  currentPhase: string;
  blockerCount?: number;
  riskCount?: number;
  driftCount?: number;
  watchNext?: string[];
  planProgressJson?: unknown[];
  driftJson?: unknown[];
  evidenceJson?: unknown[];
  rawOutputJson?: Record<string, unknown>;
}): Promise<StateSnapshot> {
  const { data, error } = await supabase
    .from("state_snapshots")
    .insert({
      project_id: input.projectId,
      analysis_run_id: input.analysisRunId ?? null,
      summary: input.summary,
      progress_percent: input.progressPercent,
      current_phase: input.currentPhase,
      blocker_count: input.blockerCount ?? 0,
      risk_count: input.riskCount ?? 0,
      drift_count: input.driftCount ?? 0,
      watch_next: input.watchNext ?? [],
      plan_progress_json: input.planProgressJson ?? [],
      drift_json: input.driftJson ?? [],
      evidence_json: input.evidenceJson ?? [],
      raw_output_json: input.rawOutputJson ?? {},
      generated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("createStateSnapshot error:", error?.message);
    if (isMissingProjectMemoryTableError(error)) {
      throw new Error(PROJECT_MEMORY_SETUP_MESSAGE);
    }
    throw new Error("상태 스냅샷 저장에 실패했습니다.");
  }

  return data as StateSnapshot;
}

export const getLatestStateSnapshot = cache(async function getLatestStateSnapshot(
  projectId: string
): Promise<StateSnapshot | null> {
  const { data, error } = await supabase
    .from("state_snapshots")
    .select("*")
    .eq("project_id", projectId)
    .order("generated_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    if (isMissingProjectMemoryTableError(error)) {
      console.error(PROJECT_MEMORY_SETUP_MESSAGE);
    }
    return null;
  }

  return data as StateSnapshot;
});

export async function getStateSnapshotsByProject(
  projectId: string,
  limit: number = 10
): Promise<StateSnapshot[]> {
  const { data, error } = await supabase
    .from("state_snapshots")
    .select("*")
    .eq("project_id", projectId)
    .order("generated_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    console.error("getStateSnapshotsByProject error:", error?.message);
    if (isMissingProjectMemoryTableError(error)) {
      console.error(PROJECT_MEMORY_SETUP_MESSAGE);
    }
    return [];
  }

  return data as StateSnapshot[];
}

export async function getAnalysisRunsByProject(projectId: string): Promise<AnalysisRun[]> {
  const { data, error } = await supabase
    .from("analysis_runs")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("getAnalysisRunsByProject error:", error?.message);
    if (isMissingProjectMemoryTableError(error)) {
      console.error(PROJECT_MEMORY_SETUP_MESSAGE);
    }
    return [];
  }

  return data as AnalysisRun[];
}

export const getAnalysisRunById = cache(async function getAnalysisRunById(
  runId: string
): Promise<AnalysisRun | null> {
  const { data, error } = await supabase
    .from("analysis_runs")
    .select("*")
    .eq("id", runId)
    .single();

  if (error || !data) {
    if (isMissingProjectMemoryTableError(error)) {
      console.error(PROJECT_MEMORY_SETUP_MESSAGE);
    }
    return null;
  }

  return data as AnalysisRun;
});

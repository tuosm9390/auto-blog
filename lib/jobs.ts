import { supabaseAdmin as supabase } from "./supabase-admin";
import { AIJob, JobStatus, GenerateResult, SubscriptionTier } from "./types";

export async function createJob(
  githubUsername: string,
  repo: string,
  commitShas: string[]
): Promise<AIJob> {
  const { data, error } = await supabase
    .from("jobs")
    .insert({
      github_username: githubUsername,
      repo,
      commit_shas: commitShas,
      status: "pending" as JobStatus,
    })
    .select()
    .single();

  if (error) {
    console.error("createJob DB error:", error.message);
    throw new Error("작업 생성에 실패했습니다. 잠시 후 다시 시도해주세요.");
  }

  return data as AIJob;
}

export async function updateJobStatus(
  jobId: string,
  status: JobStatus,
  result?: GenerateResult,
  errorText?: string
): Promise<void> {
  const updateData: { status: JobStatus; updated_at: string; result?: GenerateResult; error?: string } = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (result) updateData.result = result;
  if (errorText) updateData.error = errorText;

  // 시스템 레벨의 상태 업데이트 (백그라운드 작업용)
  const { error } = await supabase
    .from("jobs")
    .update(updateData)
    .eq("id", jobId);

  if (error) {
    console.error(작업 상태 업데이트 실패 ():, error.message);
  }
}

export async function getJobById(jobId: string): Promise<AIJob | null> {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (error || !data) return null;
  return data as AIJob;
}

export async function getJobsByAuthor(githubUsername: string): Promise<AIJob[]> {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("github_username", githubUsername)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as AIJob[];
}

export async function deleteJob(jobId: string, githubUsername: string): Promise<boolean> {
  const { error } = await supabase
    .from("jobs")
    .delete()
    .eq("id", jobId)
    .eq("github_username", githubUsername);
  return !error;
}

const JOB_TIMEOUT_MS = 5 * 60 * 1000; // 5분

export async function runAIAnalysisBackground(
  jobId: string,
  owner: string,
  repo: string,
  shas: string[],
  tier: SubscriptionTier = "free"
): Promise<void> {
  const { getCommitDiff } = await import("./github");
  const { analyzeCommits } = await import("./ai");

  const run = async () => {
    await updateJobStatus(jobId, "processing");
    const commitDiffs = await Promise.all(
      shas.slice(0, 5).map((sha) => getCommitDiff(owner, repo, sha))
    );
    const repoFullName = ${owner}/;
    const result = await analyzeCommits(commitDiffs, repoFullName, tier);
    await updateJobStatus(jobId, "completed", result);
    console.log(Job  completed successfully.);
  };

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Job timed out after 5 minutes")), JOB_TIMEOUT_MS)
  );

  try {
    await Promise.race([run(), timeout]);
  } catch (error: unknown) {
    let message = "AI 분석 중 오류가 발생했습니다.";
    if (error instanceof Error) message = error.message;
    else if (typeof error === 'string') message = error;

    if (message.includes("429") || message.includes("quota") || message.includes("limit")) {
      message = message.includes("20") 
        ? "Gemini API 일일 할당량(20회)을 초과했습니다." 
        : "AI 서비스 요청이 너무 많습니다.";
    }

    console.error(Job  failed:, error);
    await updateJobStatus(jobId, "failed", undefined, message);
  }
}

import { supabase } from "./supabase";
import { AIJob, JobStatus, GenerateResult } from "./types";

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
    throw new Error(`작업 생성 실패: ${error.message}`);
  }

  return data as AIJob;
}

export async function updateJobStatus(
  jobId: string,
  status: JobStatus,
  result?: GenerateResult,
  errorText?: string
): Promise<void> {
  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (result) updateData.result = result;
  if (errorText) updateData.error = errorText;

  const { error } = await supabase
    .from("jobs")
    .update(updateData)
    .eq("id", jobId);

  if (error) {
    console.error(`작업 상태 업데이트 실패 (${jobId}):`, error.message);
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

export async function deleteJob(jobId: string): Promise<boolean> {
  const { error } = await supabase.from("jobs").delete().eq("id", jobId);
  return !error;
}

export async function runAIAnalysisBackground(
  jobId: string,
  owner: string,
  repo: string,
  shas: string[],
  githubUsername: string
): Promise<void> {
  const { getCommitDiff } = await import("./github");
  const { analyzeCommits } = await import("./ai");
  // const { createPost } = await import("./posts");
  // const { recordProcessedCommits } = await import("./settings");

  try {
    // 1. 상태를 processing으로 변경
    await updateJobStatus(jobId, "processing");

    // 2. Diff 가져오기
    // 성능을 위해 최대 5개 커밋만 분석
    const commitDiffs = await Promise.all(
      shas.slice(0, 5).map((sha) => getCommitDiff(owner, repo, sha))
    );

    // 3. AI 분석
    const repoFullName = `${owner}/${repo}`;
    const result = await analyzeCommits(commitDiffs, repoFullName);

    // 4. 분석 결과와 함께 Job 완료
    await updateJobStatus(jobId, "completed", result);

    console.log(`Job ${jobId} completed successfully.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI 분석 중 오류 발생";
    console.error(`Job ${jobId} failed:`, error);
    await updateJobStatus(jobId, "failed", undefined, message);
  }
}

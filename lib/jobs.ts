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

const JOB_TIMEOUT_MS = 5 * 60 * 1000; // 5분

export async function runAIAnalysisBackground(
  jobId: string,
  owner: string,
  repo: string,
  shas: string[]
): Promise<void> {
  const { getCommitDiff } = await import("./github");
  const { analyzeCommits } = await import("./ai");

  const run = async () => {
    // 1. 상태를 processing으로 변경
    await updateJobStatus(jobId, "processing");

    // 2. Diff 가져오기 (최대 5개 커밋)
    const commitDiffs = await Promise.all(
      shas.slice(0, 5).map((sha) => getCommitDiff(owner, repo, sha))
    );

    // 3. AI 분석 (Gemini)
    const repoFullName = `${owner}/${repo}`;
    const result = await analyzeCommits(commitDiffs, repoFullName);

    // 4. 분석 결과와 함께 Job 완료
    await updateJobStatus(jobId, "completed", result);
    console.log(`Job ${jobId} completed successfully.`);
  };

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Job timed out after 5 minutes")), JOB_TIMEOUT_MS)
  );

  try {
    await Promise.race([run(), timeout]);
  } catch (error: any) {
    let message = "AI 분석 중 오류가 발생했습니다.";
    
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }

    // 구체적인 에러 타입에 따른 사용자 친화적 문구 보강 (Fallback)
    if (message.includes("429") || message.includes("quota") || message.includes("limit")) {
      if (message.includes("20")) {
        message = "Gemini API 일일 할당량(20회)을 초과했습니다. 내일 다시 시도해주세요.";
      } else {
        message = "AI 서비스 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
      }
    }

    console.error(`Job ${jobId} failed:`, error);
    await updateJobStatus(jobId, "failed", undefined, message);
  }
}

import { supabase } from "./supabase";
import { UserSettings, PostingMode, AutoSchedule } from "./types";
import { getRecentCommits } from "./github";

// ─── 사용자 설정 관리 ───

export async function getUserSettings(
  githubUsername: string
): Promise<UserSettings | null> {
  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("github_username", githubUsername)
    .single();

  if (error || !data) return null;
  return data as UserSettings;
}

export async function upsertUserSettings(
  githubUsername: string,
  settings: {
    posting_mode?: PostingMode;
    auto_repos?: string[];
    auto_schedule?: AutoSchedule;
  }
): Promise<UserSettings> {
  const { data, error } = await supabase
    .from("user_settings")
    .upsert(
      {
        github_username: githubUsername,
        ...settings,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "github_username" }
    )
    .select()
    .single();

  if (error) {
    throw new Error(`설정 저장 실패: ${error.message}`);
  }

  return data as UserSettings;
}

// ─── 모든 자동 모드 사용자 조회 ───

export async function getAutoModeUsers(): Promise<UserSettings[]> {
  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("posting_mode", "auto");

  if (error || !data) return [];
  return data as UserSettings[];
}

// ─── 처리된 커밋 관리 ───

export async function getProcessedCommitShas(
  githubUsername: string,
  repo: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("processed_commits")
    .select("commit_sha")
    .eq("github_username", githubUsername)
    .eq("repo", repo);

  if (error || !data) return [];
  return data.map((row: { commit_sha: string }) => row.commit_sha);
}

export async function recordProcessedCommits(
  githubUsername: string,
  repo: string,
  shas: string[],
  postId: string
): Promise<void> {
  const rows = shas.map((sha) => ({
    github_username: githubUsername,
    repo,
    commit_sha: sha,
    post_id: postId,
  }));

  const { error } = await supabase
    .from("processed_commits")
    .upsert(rows, { onConflict: "repo,commit_sha" });

  if (error) {
    console.error("커밋 처리 기록 실패:", error);
  }
}

// ─── 미처리 커밋 조회 ───

export async function getUnprocessedCommits(
  githubUsername: string,
  repo: string,
  token: string
): Promise<{ sha: string; message: string; date: string }[]> {
  const [owner, repoName] = repo.split("/");
  if (!owner || !repoName) return [];

  // GitHub에서 최근 커밋 조회
  const recentCommits = await getRecentCommits(
    owner,
    repoName,
    undefined,
    undefined,
    30,
    token
  );

  // 이미 처리된 커밋 SHA 목록 조회
  const processedShas = await getProcessedCommitShas(githubUsername, repo);
  const processedSet = new Set(processedShas);

  // 미처리 커밋만 필터링
  return recentCommits
    .filter((c) => !processedSet.has(c.sha))
    .map((c) => ({
      sha: c.sha,
      message: c.message,
      date: c.date,
    }));
}

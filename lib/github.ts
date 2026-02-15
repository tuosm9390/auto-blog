import { Octokit } from "octokit";
import { CommitInfo, CommitDiff, FileDiff } from "./types";

function getOctokit(token?: string) {
  const authToken = token || process.env.GITHUB_TOKEN;
  if (!authToken) {
    throw new Error("GITHUB_TOKEN 환경변수가 설정되지 않았고, 사용자 토큰도 제공되지 않았습니다.");
  }
  return new Octokit({ auth: authToken });
}

export async function getRecentCommits(
  owner: string,
  repo: string,
  since?: string,
  until?: string,
  perPage: number = 30,
  token?: string
): Promise<CommitInfo[]> {
  const octokit = getOctokit(token);

  const params: Record<string, unknown> = {
    owner,
    repo,
    per_page: perPage,
  };
  if (since) params.since = since;
  if (until) params.until = until;

  const { data } = await octokit.rest.repos.listCommits(
    params as Parameters<typeof octokit.rest.repos.listCommits>[0]
  );

  return data.map((commit) => ({
    sha: commit.sha,
    message: commit.commit.message,
    author: commit.commit.author?.name || "Unknown",
    date: commit.commit.author?.date || new Date().toISOString(),
    url: commit.html_url,
  }));
}

export async function getCommitDiff(
  owner: string,
  repo: string,
  sha: string
): Promise<CommitDiff> {
  const octokit = getOctokit();

  const { data } = await octokit.rest.repos.getCommit({
    owner,
    repo,
    ref: sha,
  });

  const files: FileDiff[] = (data.files || []).map((file) => ({
    filename: file.filename,
    status: file.status || "modified",
    additions: file.additions,
    deletions: file.deletions,
    patch: file.patch,
  }));

  return {
    commit: {
      sha: data.sha,
      message: data.commit.message,
      author: data.commit.author?.name || "Unknown",
      date: data.commit.author?.date || new Date().toISOString(),
      url: data.html_url,
    },
    files,
    stats: {
      total: data.stats?.total || 0,
      additions: data.stats?.additions || 0,
      deletions: data.stats?.deletions || 0,
    },
  };
}

export async function getCommitComparison(
  owner: string,
  repo: string,
  base: string,
  head: string
): Promise<CommitDiff[]> {
  const octokit = getOctokit();

  const { data } = await octokit.rest.repos.compareCommits({
    owner,
    repo,
    base,
    head,
  });

  return data.commits.map((commit) => ({
    commit: {
      sha: commit.sha,
      message: commit.commit.message,
      author: commit.commit.author?.name || "Unknown",
      date: commit.commit.author?.date || new Date().toISOString(),
      url: commit.html_url,
    },
    files: (data.files || []).map((file) => ({
      filename: file.filename,
      status: file.status || "modified",
      additions: file.additions,
      deletions: file.deletions,
      patch: file.patch,
    })),
    stats: {
      total: data.files?.length || 0,
      additions: data.files?.reduce((sum, f) => sum + f.additions, 0) || 0,
      deletions: data.files?.reduce((sum, f) => sum + f.deletions, 0) || 0,
    },
  }));
}

export async function getRepoInfo(owner: string, repo: string) {
  const octokit = getOctokit();
  const { data } = await octokit.rest.repos.get({ owner, repo });
  return {
    name: data.full_name,
    description: data.description,
    language: data.language,
    url: data.html_url,
  };
}
export async function getUserRepos(token: string) {
  const octokit = getOctokit(token);
  const { data } = await octokit.rest.repos.listForAuthenticatedUser({
    sort: "updated",
    per_page: 100,
  });
  return data.map((repo) => ({
    name: repo.name,
    full_name: repo.full_name,
    private: repo.private,
    description: repo.description,
    url: repo.html_url,
    updated_at: repo.updated_at,
  }));
}

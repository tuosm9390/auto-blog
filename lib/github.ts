import { Octokit } from "octokit";
import { CommitInfo, CommitDiff, FileDiff } from "./types";

// 변경사항 분석에서 제외할 파일 패턴
// - 자동 생성 파일, 민감 정보, 바이너리 등 AI 분석에 불필요한 파일 제외
const EXCLUDED_FILE_PATTERNS: string[] = [
  // 패키지 관리 (Lock 파일 + manifest)
  "package-lock.json",
  "package.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "bun.lockb",
  // 환경변수 / 시크릿
  ".env",
  ".env.local",
  ".env.development",
  ".env.production",
  ".env.test",
  // 빌드 결과물 디렉토리
  ".next/",
  "dist/",
  "build/",
  "out/",
  "node_modules/",
  // 바이너리 / 미디어 확장자
  ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp",
  ".woff", ".woff2", ".ttf", ".eot",
  ".mp4", ".mp3", ".wav",
  ".pdf", ".zip", ".tar", ".gz",
  // 설정 / 메타데이터
  ".eslintcache",
  "tsconfig.tsbuildinfo",
  ".DS_Store",
  "Thumbs.db",
];

/**
 * 파일명이 제외 대상인지 판별
 * - 정확한 파일명 매칭 (예: package-lock.json)
 * - 확장자 매칭 (예: .png)
 * - 디렉토리 접두사 매칭 (예: .next/)
 */
function shouldExcludeFile(filename: string): boolean {
  const lowerFilename = filename.toLowerCase();
  return EXCLUDED_FILE_PATTERNS.some((pattern) => {
    if (pattern.endsWith("/")) {
      // 디렉토리 패턴: 경로에 해당 디렉토리가 포함되면 제외
      return lowerFilename.startsWith(pattern) || lowerFilename.includes("/" + pattern);
    }
    if (pattern.startsWith(".") && !pattern.includes("/") && !pattern.includes("env")) {
      // 확장자 패턴 (.png, .jpg 등) — .env 계열은 정확 매칭
      return lowerFilename.endsWith(pattern);
    }
    // 정확한 파일명 매칭 (경로 끝부분 또는 단독 파일명)
    return lowerFilename === pattern || lowerFilename.endsWith("/" + pattern);
  });
}

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

  const files: FileDiff[] = (data.files || [])
    .filter((file) => !shouldExcludeFile(file.filename))
    .map((file) => ({
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
    files: (data.files || [])
      .filter((file) => !shouldExcludeFile(file.filename))
      .map((file) => ({
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

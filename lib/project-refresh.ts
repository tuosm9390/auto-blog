import { getCommitDiff, getIssuesByNumbers, getPullRequestsForCommit, getRecentCommits } from "./github";
import { analyzeProjectState } from "./project-memory-ai";
import {
  createAnalysisRun,
  createStateSnapshot,
  getCurrentProjectPlan,
  getProjectById,
  updateAnalysisRunStatus,
} from "./projects";
import type { CommitDiff, IssueContext, PullRequestContext, StateSnapshot } from "./types";

function buildPlanSummary(markdown: string | null | undefined) {
  const lines = (markdown ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const previewLines = lines
    .filter((line) => line.startsWith("#") || line.startsWith("-") || line.startsWith("*"))
    .slice(0, 5)
    .map((line) => line.replace(/^#+\s*/, ""));

  const objective =
    lines.find((line) => !line.startsWith("#") && !line.startsWith("-") && !line.startsWith("*")) ?? null;

  return {
    previewLines,
    objective,
  };
}

function buildCommitCoverage(commitDiffs: CommitDiff[]) {
  const uniqueFiles = new Set<string>();

  commitDiffs.forEach((diff) => {
    diff.files.forEach((file) => uniqueFiles.add(file.filename));
  });

  return {
    analyzedCommitRefs: commitDiffs.map((diff) => diff.commit.sha.slice(0, 7)),
    analyzedCommitMessages: commitDiffs.map((diff) => diff.commit.message),
    touchedFileCount: uniqueFiles.size,
    touchedFilesSample: Array.from(uniqueFiles).slice(0, 8),
  };
}

function dedupePullRequests(pullRequests: PullRequestContext[]) {
  const seen = new Set<number>();
  return pullRequests.filter((pull) => {
    if (seen.has(pull.id)) {
      return false;
    }
    seen.add(pull.id);
    return true;
  });
}

function extractIssueNumbers(text: string | null | undefined): number[] {
  if (!text) {
    return [];
  }

  return Array.from(
    new Set(
      Array.from(text.matchAll(/#(\d{1,6})/g)).map((match) => Number(match[1])).filter(Number.isFinite)
    )
  );
}

function buildIssueCoverage(issues: IssueContext[]) {
  return {
    linkedIssueNumbers: issues.map((issue) => issue.number),
    linkedIssueTitles: issues.map((issue) => issue.title),
    openIssueCount: issues.filter((issue) => issue.state === "open").length,
  };
}

export async function refreshProjectState(params: {
  projectId: string;
  triggeredBy: string;
  accessToken?: string;
  sourceWindowDays?: number;
}): Promise<{ snapshot: StateSnapshot; runId: string }> {
  const project = await getProjectById(params.projectId);
  if (!project) {
    throw new Error("프로젝트를 찾을 수 없습니다.");
  }

  const currentProject = project;
  const plan = await getCurrentProjectPlan(params.projectId);
  const now = new Date().toISOString();
  const sourceWindowDays = params.sourceWindowDays ?? 7;
  const accessToken = params.accessToken;
  const hasPlan = Boolean(plan?.content_markdown?.trim());
  const hasRepoConfigured =
    Boolean(currentProject.github_repo_owner) && Boolean(currentProject.github_repo_name);
  const planSummary = buildPlanSummary(plan?.content_markdown);

  const run = await createAnalysisRun({
    projectId: params.projectId,
    triggeredBy: params.triggeredBy,
    inputSummary: `Refresh state on ${now} | plan:${hasPlan ? "yes" : "no"} repo:${hasRepoConfigured ? "yes" : "no"} token:${accessToken ? "yes" : "no"}`,
    sourceWindowDays,
  });

  await updateAnalysisRunStatus(run.id, "processing", { startedAt: now });

  try {
    let commitDiffs: CommitDiff[] = [];
    let pullRequests: PullRequestContext[] = [];
    let issues: IssueContext[] = [];
    const hasRepoConnection =
      hasRepoConfigured &&
      Boolean(accessToken);

    if (hasRepoConnection) {
      const commits = await getRecentCommits(
        currentProject.github_repo_owner as string,
        currentProject.github_repo_name as string,
        new Date(Date.now() - sourceWindowDays * 24 * 60 * 60 * 1000).toISOString(),
        undefined,
        5,
        accessToken
      );

      commitDiffs = await Promise.all(
        commits.slice(0, 5).map((commit) =>
          getCommitDiff(
            currentProject.github_repo_owner as string,
            currentProject.github_repo_name as string,
            commit.sha,
            accessToken
          )
        )
      );

      const pullRequestGroups = await Promise.all(
        commits.slice(0, 5).map((commit) =>
          getPullRequestsForCommit(
            currentProject.github_repo_owner as string,
            currentProject.github_repo_name as string,
            commit.sha,
            accessToken
          ).catch(() => [])
        )
      );
      pullRequests = dedupePullRequests(pullRequestGroups.flat()).slice(0, 5);

      const issueNumbers = Array.from(
        new Set([
          ...commits.flatMap((commit) => extractIssueNumbers(commit.message)),
          ...pullRequests.flatMap((pull) => [
            ...extractIssueNumbers(pull.title),
            ...extractIssueNumbers(pull.body),
          ]),
        ])
      ).slice(0, 8);

      if (issueNumbers.length > 0) {
        issues = await getIssuesByNumbers(
          currentProject.github_repo_owner as string,
          currentProject.github_repo_name as string,
          issueNumbers,
          accessToken
        ).catch(() => []);
      }
    }

    const commitCoverage = buildCommitCoverage(commitDiffs);
    const issueCoverage = buildIssueCoverage(issues);

    const analysis = hasRepoConnection
      ? await analyzeProjectState(currentProject, plan, commitDiffs, pullRequests, issues)
      : {
          summary:
            "Initial state board created. GitHub activity is not connected yet, so this snapshot is based on the current thesis and attached plan only.",
          progressPercent: plan ? 12 : 4,
          currentPhase: plan ? "Baseline setup" : "Project setup",
          blockerCount: plan ? 0 : 1,
          riskCount: 2,
          driftCount: 0,
          watchNext: plan
            ? [
                "Connect GitHub activity to future refresh runs",
                "Translate the current plan into progress states",
                "Validate drift detection with real project changes",
              ]
            : [
                "Attach a current PRD or plan",
                "Connect GitHub activity to future refresh runs",
                "Validate state board usefulness with one real project",
              ],
          planProgress: plan
            ? [
                {
                  label: "Plan attached",
                  status: "done",
                  evidence: "Current plan document exists",
                  notes: "Use this as the baseline for progress tracking",
                },
                {
                  label: "GitHub activity source",
                  status: "at_risk",
                  evidence: "Repo connection missing or token unavailable",
                  notes: "State quality stays shallow until activity is connected",
                },
              ]
            : [
                {
                  label: "Plan attached",
                  status: "at_risk",
                  evidence: "No current plan document",
                  notes: "PRD-aware tracking is weak without a plan",
                },
              ],
          drift: [],
          evidence: [
            {
              type: "project",
              title: currentProject.name,
              ref: currentProject.id,
              url: null,
            },
            ...(plan
              ? [
                  {
                    type: "prd_snippet",
                    title: plan.title,
                    ref: plan.id,
                    url: null,
                  },
                ]
              : []),
          ],
        };

    const snapshot = await createStateSnapshot({
      projectId: params.projectId,
      analysisRunId: run.id,
      summary: analysis.summary,
      progressPercent: analysis.progressPercent,
      currentPhase: analysis.currentPhase,
      blockerCount: analysis.blockerCount,
      riskCount: analysis.riskCount,
      driftCount: analysis.driftCount,
      watchNext: analysis.watchNext,
      planProgressJson: analysis.planProgress,
      driftJson: analysis.drift,
      evidenceJson: analysis.evidence,
      rawOutputJson: {
        mode: hasRepoConnection ? "project_state_analysis" : "baseline_bootstrap",
        generatedFromPlan: hasPlan,
        generatedFromGithub: hasRepoConnection,
        repoConfigured: hasRepoConfigured,
        tokenAvailable: Boolean(accessToken),
        commitCount: commitDiffs.length,
        pullRequestCount: pullRequests.length,
        pullRequests: pullRequests.map((pull) => ({
          number: pull.number,
          title: pull.title,
          state: pull.state,
          merged: pull.merged,
          author: pull.author,
          url: pull.url,
        })),
        issueCount: issues.length,
        issues: issues.map((issue) => ({
          number: issue.number,
          title: issue.title,
          state: issue.state,
          author: issue.author,
          url: issue.url,
        })),
        commitCoverage,
        issueCoverage,
        planSummary,
        planTitle: plan?.title ?? null,
        sourceWindowDays,
        fallbackReason: hasRepoConnection
          ? null
          : !hasPlan
            ? "missing_plan_and_github_activity"
            : !hasRepoConfigured
              ? "missing_repo_connection"
              : !accessToken
                ? "missing_github_token"
                : "no_recent_github_activity",
        generatedAt: now,
      },
    });

    await updateAnalysisRunStatus(run.id, "completed", {
      latestSnapshotId: snapshot.id,
      startedAt: now,
      completedAt: new Date().toISOString(),
    });

    return { snapshot, runId: run.id };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Project state refresh failed.";

    await updateAnalysisRunStatus(run.id, "failed", {
      errorMessage: message,
      startedAt: now,
      completedAt: new Date().toISOString(),
    });

    throw error;
  }
}

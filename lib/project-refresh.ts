import { getCommitDiff, getRecentCommits } from "./github";
import { analyzeProjectState } from "./project-memory-ai";
import {
  createAnalysisRun,
  createStateSnapshot,
  getCurrentProjectPlan,
  getProjectById,
  updateAnalysisRunStatus,
} from "./projects";
import type { CommitDiff, StateSnapshot } from "./types";

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

  const run = await createAnalysisRun({
    projectId: params.projectId,
    triggeredBy: params.triggeredBy,
    inputSummary: `Refresh state on ${now} | plan:${hasPlan ? "yes" : "no"} repo:${hasRepoConfigured ? "yes" : "no"} token:${accessToken ? "yes" : "no"}`,
    sourceWindowDays,
  });

  await updateAnalysisRunStatus(run.id, "processing", { startedAt: now });

  try {
    let commitDiffs: CommitDiff[] = [];
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
    }

    const analysis = hasRepoConnection
      ? await analyzeProjectState(currentProject, plan, commitDiffs)
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

import { getCommitDiff, getIssuesByNumbers, getPullRequestsForCommit, getRecentCommits } from "./github";
import { analyzeProjectState } from "./project-memory-ai";
import {
  getAppliedProjectDocuments,
  summarizeStoredProjectDocuments,
  updateDocumentsLastUsed,
} from "./project-documents";
import { PROJECT_DOCUMENT_TYPES } from "./project-document-templates";
import {
  createAnalysisRun,
  createStateSnapshot,
  getCurrentProjectPlan,
  getProjectById,
  updateAnalysisRunStatus,
} from "./projects";
import type { CommitDiff, IssueContext, ProjectDocumentSummary, PullRequestContext, StateSnapshot } from "./types";

type ProjectRefreshLocale = "ko" | "en";

function normalizeLocale(locale: string | undefined): ProjectRefreshLocale {
  return locale === "ko" ? "ko" : "en";
}

function buildBaselineAnalysis(
  projectId: string,
  projectName: string,
  plan: Awaited<ReturnType<typeof getCurrentProjectPlan>>,
  documents: ProjectDocumentSummary[],
  locale: ProjectRefreshLocale
) {
  if (locale === "ko") {
    return {
      summary:
        "초기 상태 보드가 생성되었습니다. 아직 GitHub 활동이 연결되지 않아 이 스냅샷은 현재 가설과 연결된 계획을 기준으로 구성되었습니다.",
      progressPercent: plan ? 12 : 4,
      currentPhase: plan ? "기준선 설정" : "프로젝트 설정",
      blockerCount: plan ? 0 : 1,
      riskCount: 2,
      driftCount: 0,
      watchNext: plan
        ? [
            "다음 새로고침에서 GitHub 활동을 연결하기",
            "현재 계획을 진행 상태 항목으로 변환하기",
            "실제 프로젝트 변경으로 드리프트 감지를 검증하기",
          ]
        : [
            "현재 PRD 또는 계획을 추가하기",
            "다음 새로고침에서 GitHub 활동을 연결하기",
            "하나의 실제 프로젝트로 상태 보드의 유용성을 검증하기",
          ],
      planProgress: plan
        ? [
            {
              label: "계획 연결",
              status: "done",
              evidence: "현재 계획 문서가 존재합니다.",
              notes: "이 문서를 진행 상태 추적의 기준선으로 사용합니다.",
            },
            {
              label: "GitHub 활동 소스",
              status: "at_risk",
              evidence: "레포지토리 연결이 없거나 토큰을 사용할 수 없습니다.",
              notes: "활동 데이터가 연결되기 전까지 상태 품질은 제한적입니다.",
            },
          ]
        : [
            {
              label: "계획 연결",
              status: "at_risk",
              evidence: "현재 계획 문서가 없습니다.",
              notes: "계획이 없으면 PRD 기준 추적이 약해집니다.",
            },
          ],
      drift: [],
      evidence: [
        {
          type: "project",
          title: projectName,
          ref: projectId,
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
        ...documents.map((document) => ({
          type: "document",
          title: document.title,
          ref: document.id,
          url: null,
        })),
      ],
    };
  }

  return {
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
        title: projectName,
        ref: projectId,
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
      ...documents.map((document) => ({
        type: "document",
        title: document.title,
        ref: document.id,
        url: null,
      })),
    ],
  };
}

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
  locale?: string;
  sourceWindowDays?: number;
}): Promise<{ snapshot: StateSnapshot; runId: string }> {
  const project = await getProjectById(params.projectId);
  if (!project) {
    throw new Error("프로젝트를 찾을 수 없습니다.");
  }

  const currentProject = project;
  const plan = await getCurrentProjectPlan(params.projectId);
  const appliedDocuments = await getAppliedProjectDocuments(params.projectId);
  const documentSummaries = summarizeStoredProjectDocuments(appliedDocuments);
  const now = new Date().toISOString();
  const sourceWindowDays = params.sourceWindowDays ?? 7;
  const locale = normalizeLocale(params.locale);
  const accessToken = params.accessToken;
  const hasPlan = Boolean(plan?.content_markdown?.trim());
  const appliedDocumentTypes = documentSummaries.map((document) => document.documentType);
  const missingDocumentTypes = PROJECT_DOCUMENT_TYPES.filter((type) => {
    if (type === "prd") {
      return !hasPlan;
    }
    return !appliedDocumentTypes.includes(type);
  });
  const staleDocumentTypes = documentSummaries
    .filter((document) => document.readiness === "stale")
    .map((document) => document.documentType);
  const hasRepoConfigured =
    Boolean(currentProject.github_repo_owner) && Boolean(currentProject.github_repo_name);
  const planSummary = buildPlanSummary(plan?.content_markdown);

  const run = await createAnalysisRun({
    projectId: params.projectId,
    triggeredBy: params.triggeredBy,
    inputSummary: `Refresh state on ${now} | plan:${hasPlan ? "yes" : "no"} documents:${documentSummaries.length} repo:${hasRepoConfigured ? "yes" : "no"} token:${accessToken ? "yes" : "no"}`,
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
      ? await analyzeProjectState(currentProject, plan, documentSummaries, commitDiffs, pullRequests, issues, locale)
      : buildBaselineAnalysis(currentProject.id, currentProject.name, plan, documentSummaries, locale);

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
        documentCoverage: {
          appliedDocumentTypes,
          appliedDocumentIds: documentSummaries.map((document) => document.id),
          missingDocumentTypes,
          staleDocumentTypes,
        },
        sourceWindowDays,
        locale,
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
    await updateDocumentsLastUsed(
      params.projectId,
      documentSummaries.map((document) => document.id),
      snapshot.id
    );

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

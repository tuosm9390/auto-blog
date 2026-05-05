import { auth } from "@/auth";
import { redirect, Link } from "@/i18n/routing";
import { refreshProjectStateAction } from "@/app/actions/projectActions";
import { getTranslations } from "next-intl/server";
import {
  getAnalysisRunsByProject,
  getCurrentProjectPlan,
  getLatestStateSnapshot,
  getProjectById,
  getStateSnapshotsByProject,
} from "@/lib/projects";

export default async function ProjectStatePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams?: Promise<{ refresh?: string; message?: string }>;
}) {
  const { locale, id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect({ href: "/login", locale });
  }
  const safeUserId = userId as string;
  const hasAccessToken = Boolean((session?.user as { accessToken?: string } | undefined)?.accessToken);
  const t = await getTranslations("Projects");

  const [project, plan, snapshot, runs, snapshots] = await Promise.all([
    getProjectById(id),
    getCurrentProjectPlan(id),
    getLatestStateSnapshot(id),
    getAnalysisRunsByProject(id),
    getStateSnapshotsByProject(id, 6),
  ]);

  if (!project || project.owner_id !== safeUserId) {
    redirect({ href: "/projects", locale });
  }

  const currentProject = project as NonNullable<typeof project>;

  const refreshAction = refreshProjectStateAction.bind(null, locale, id);
  const planItems = snapshot?.plan_progress_json ?? [];
  const driftItems = snapshot?.drift_json ?? [];
  const latestRun = runs[0] ?? null;
  const snapshotHistory = snapshots;
  const previousSnapshot = snapshotHistory[1] ?? null;
  const refreshFailed = resolvedSearchParams?.refresh === "failed";
  const actionErrorMessage = resolvedSearchParams?.message ?? null;
  const rawMeta = (snapshot?.raw_output_json ?? {}) as {
    mode?: string;
    generatedFromPlan?: boolean;
    generatedFromGithub?: boolean;
    repoConfigured?: boolean;
    tokenAvailable?: boolean;
    commitCount?: number;
    fallbackReason?: string | null;
    planTitle?: string | null;
    planSummary?: {
      previewLines?: string[];
      objective?: string | null;
    };
    commitCoverage?: {
      analyzedCommitRefs?: string[];
      analyzedCommitMessages?: string[];
      touchedFileCount?: number;
      touchedFilesSample?: string[];
    };
    pullRequestCount?: number;
    pullRequests?: Array<{
      number?: number;
      title?: string;
      state?: string;
      merged?: boolean;
      author?: string;
      url?: string;
    }>;
    issueCount?: number;
    issues?: Array<{
      number?: number;
      title?: string;
      state?: string;
      author?: string;
      url?: string;
    }>;
    issueCoverage?: {
      linkedIssueNumbers?: number[];
      linkedIssueTitles?: string[];
      openIssueCount?: number;
    };
  };
  const planPreviewLines = rawMeta.planSummary?.previewLines ?? [];
  const planObjective = rawMeta.planSummary?.objective ?? null;
  const commitRefs = rawMeta.commitCoverage?.analyzedCommitRefs ?? [];
  const touchedFilesSample = rawMeta.commitCoverage?.touchedFilesSample ?? [];
  const touchedFileCount = rawMeta.commitCoverage?.touchedFileCount ?? 0;
  const pullRequests = rawMeta.pullRequests ?? [];
  const issues = rawMeta.issues ?? [];
  const summaryText = snapshot?.summary?.trim() ?? "";
  const watchNextItems = snapshot?.watch_next ?? [];
  const hasConcreteSummary =
    summaryText.length >= 80 &&
    !summaryText.toLowerCase().includes("initial state board created") &&
    !summaryText.toLowerCase().includes("based on the current thesis");
  const hasConcreteWatchNext =
    watchNextItems.length >= 2 &&
    watchNextItems.some((item) => item.length >= 28);
  const hasEvidenceCoverage =
    commitRefs.length > 0 || pullRequests.length > 0 || issues.length > 0;
  const hasPlanCoverage = planItems.length >= 2;
  const reviewChecks = [
    {
      label: t("state.review.summary"),
      ready: hasConcreteSummary,
      detail: hasConcreteSummary
        ? t("state.review.summaryReady")
        : t("state.review.summaryMissing"),
    },
    {
      label: t("state.review.watchNext"),
      ready: hasConcreteWatchNext,
      detail: hasConcreteWatchNext
        ? t("state.review.watchNextReady")
        : t("state.review.watchNextMissing"),
    },
    {
      label: t("state.review.evidence"),
      ready: hasEvidenceCoverage,
      detail: hasEvidenceCoverage
        ? t("state.review.evidenceReady")
        : t("state.review.evidenceMissing"),
    },
    {
      label: t("state.review.planCoverage"),
      ready: hasPlanCoverage,
      detail: hasPlanCoverage
        ? t("state.review.planCoverageReady")
        : t("state.review.planCoverageMissing"),
    },
  ];
  const reviewReadyCount = reviewChecks.filter((item) => item.ready).length;
  const readinessChecks = [
    {
      label: t("state.checks.planAttached"),
      ready: Boolean(plan?.content_markdown?.trim()),
      detail: plan ? plan.title : t("state.noCurrentPlan"),
    },
    {
      label: t("state.checks.repoConnected"),
      ready: Boolean(currentProject.github_repo_owner && currentProject.github_repo_name),
      detail:
        currentProject.github_repo_owner && currentProject.github_repo_name
          ? `${currentProject.github_repo_owner}/${currentProject.github_repo_name}`
          : t("state.checks.connectRepo"),
    },
    {
      label: t("state.checks.githubActivityInSnapshot"),
      ready: Boolean(rawMeta.generatedFromGithub),
      detail: rawMeta.generatedFromGithub
        ? t("runs.commitCount", {count: rawMeta.commitCount ?? 0})
        : t("state.githubActivityMissing"),
    },
  ];
  const hasSnapshot = Boolean(snapshot);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 md:py-16 animate-fade-in-up">
      {refreshFailed ? (
        <section className="mb-6 border border-error/30 bg-error/10 rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-error mb-2">
            {t("state.refreshFailedTag")}
          </p>
          <p className="text-sm text-text-secondary leading-7">
            {latestRun?.error_message || actionErrorMessage || t("state.refreshFailedBody")}
          </p>
          <p className="text-xs text-text-tertiary mt-3">
            {t("state.refreshFailedHint")}
          </p>
        </section>
      ) : null}

      <section className="mb-8 flex flex-col xl:flex-row xl:items-end justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent mb-2">{t("state.tag")}</p>
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-2">
            {currentProject.name}
          </h1>
          <p className="text-text-secondary max-w-3xl">
            {currentProject.current_thesis || currentProject.description || t("shared.noCurrentThesis")}
          </p>
          <div className="mt-3 text-xs text-text-tertiary flex flex-wrap gap-x-4 gap-y-2">
            <span>{t("shared.originalThesis")}: {currentProject.original_thesis || t("shared.notSet")}</span>
            <span>{t("shared.repo")}: {currentProject.github_repo_owner && currentProject.github_repo_name ? `${currentProject.github_repo_owner}/${currentProject.github_repo_name}` : t("shared.notConnected")}</span>
            <span>{t("shared.statusLabel")}: {t(`shared.status.${currentProject.status}`)}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href={`/projects/${currentProject.id}/edit`}
            className="px-5 py-3 border border-border-subtle rounded-lg text-sm text-text-secondary hover:border-border-strong hover:text-text-primary transition-colors text-center"
          >
            {t("shared.editProject")}
          </Link>
          <Link
            href={`/projects/${currentProject.id}/runs`}
            className="px-5 py-3 border border-border-subtle rounded-lg text-sm text-text-secondary hover:border-border-strong hover:text-text-primary transition-colors text-center"
          >
            {t("shared.viewRuns")}
          </Link>
          <Link
            href={`/projects/${currentProject.id}/drift`}
            className="px-5 py-3 border border-border-subtle rounded-lg text-sm text-text-secondary hover:border-border-strong hover:text-text-primary transition-colors text-center"
          >
            {t("shared.reviewDrift")}
          </Link>
          <form action={refreshAction}>
            <button
              type="submit"
              className="w-full px-5 py-3 bg-accent text-black font-semibold rounded-lg hover:bg-accent-hover transition-colors"
            >
              {t("shared.refreshState")}
            </button>
          </form>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
        <MetricCard label={t("shared.progress")} value={snapshot ? `${snapshot.progress_percent}%` : "—"} meta={snapshot ? t("state.metrics.latestSnapshot") : t("state.metrics.noSnapshotYet")} />
        <MetricCard label={t("shared.currentPhase")} value={snapshot?.current_phase || t("state.metrics.notAnalyzed")} meta={t("state.metrics.stateBoardStatus")} />
        <MetricCard label={t("state.metrics.planDrift")} value={snapshot ? String(snapshot.drift_count) : "—"} meta={t("state.metrics.planDriftMeta")} />
        <MetricCard label={t("state.metrics.blockedRisks")} value={snapshot ? `${snapshot.blocker_count} / ${snapshot.risk_count}` : "—"} meta={t("state.metrics.blockedRisksMeta")} />
      </section>

      {snapshot ? (
        <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr] mb-8">
          <Panel
            title={t("state.review.title")}
            headerAction={t("state.review.score", { count: reviewReadyCount })}
          >
            <div className="space-y-3">
              {reviewChecks.map((item) => (
                <ChecklistRow
                  key={item.label}
                  label={item.label}
                  detail={item.detail}
                  ready={item.ready}
                  readyLabel={t("shared.ready")}
                  pendingLabel={t("shared.check")}
                />
              ))}
            </div>
          </Panel>

          <Panel title={t("state.review.howToUse")}>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li className="flex gap-2"><span className="text-accent">•</span><span>{t("state.review.hints.summary")}</span></li>
              <li className="flex gap-2"><span className="text-accent">•</span><span>{t("state.review.hints.watchNext")}</span></li>
              <li className="flex gap-2"><span className="text-accent">•</span><span>{t("state.review.hints.evidence")}</span></li>
              <li className="flex gap-2"><span className="text-accent">•</span><span>{t("state.review.hints.secondRefresh")}</span></li>
            </ul>
          </Panel>
        </section>
      ) : null}

      {!hasSnapshot ? (
        <section className="grid gap-4 xl:grid-cols-[1.05fr_1fr] mb-8">
        <Panel title={t("state.beforeFirstRefresh")}>
            <div className="space-y-3">
              <ChecklistRow
                label={t("state.checks.planAttached")}
                detail={plan ? t("state.checks.currentPlan", {title: plan.title}) : t("state.checks.addPlan")}
                ready={Boolean(plan?.content_markdown?.trim())}
                readyLabel={t("shared.ready")}
                pendingLabel={t("shared.check")}
              />
              <ChecklistRow
                label={t("state.checks.repoConnected")}
                detail={
                  currentProject.github_repo_owner && currentProject.github_repo_name
                    ? `${currentProject.github_repo_owner}/${currentProject.github_repo_name}`
                    : t("state.checks.connectRepo")
                }
                ready={Boolean(currentProject.github_repo_owner && currentProject.github_repo_name)}
                readyLabel={t("shared.ready")}
                pendingLabel={t("shared.check")}
              />
              <ChecklistRow
                label={t("state.checks.authToken")}
                detail={t("state.checks.authTokenDetail")}
                ready={hasAccessToken}
                readyLabel={t("shared.ready")}
                pendingLabel={t("shared.check")}
              />
            </div>
          </Panel>

          <Panel title={t("state.goodFirstResult")}>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li className="flex gap-2"><span className="text-accent">•</span><span>{t("state.goodFirstResultItems.snapshot")}</span></li>
              <li className="flex gap-2"><span className="text-accent">•</span><span>{t("state.goodFirstResultItems.commitCoverage")}</span></li>
              <li className="flex gap-2"><span className="text-accent">•</span><span>{t("state.goodFirstResultItems.evidence")}</span></li>
              <li className="flex gap-2"><span className="text-accent">•</span><span>{t("state.goodFirstResultItems.watchNext")}</span></li>
            </ul>
          </Panel>
        </section>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr] mb-8">
        <Panel title={t("state.currentSnapshot")}>
          {snapshot ? (
            <p className="text-sm text-text-secondary leading-7">{snapshot.summary}</p>
          ) : (
            <EmptyText>
              {t("state.noSnapshotPrefix")} <span className="text-text-primary font-medium">{t("shared.refreshState")}</span> {t("state.noSnapshotSuffix")}
            </EmptyText>
          )}
        </Panel>

        <Panel title={t("shared.watchNext")}>
          {snapshot?.watch_next?.length ? (
            <ul className="space-y-2 text-sm text-text-secondary">
              {snapshot.watch_next.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-accent">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyText>
              {t("state.attachPlanHint")}
            </EmptyText>
          )}
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_1fr] mb-8">
        <Panel title={t("state.dataQualityChecks")}>
          <div className="space-y-3">
            {readinessChecks.map((item) => (
              <div
                key={item.label}
                className="border border-border-subtle rounded-xl p-4 bg-canvas/30 flex items-start justify-between gap-4"
              >
                <div>
                  <p className="font-medium mb-1">{item.label}</p>
                  <p className="text-sm text-text-secondary">{item.detail}</p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    item.ready
                      ? "bg-success/10 text-success border border-success/30"
                      : "bg-error/10 text-error border border-error/30"
                  }`}
                >
                  {item.ready ? t("shared.ready") : t("shared.missing")}
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title={t("state.lastRefresh")}>
          {latestRun ? (
            <div className="space-y-4 text-sm text-text-secondary">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-text-primary">{t("shared.run")} {latestRun.id.slice(0, 8)}</p>
                <RunStatusPill status={latestRun.status} />
              </div>
              <div className="space-y-2">
                <p>{t("shared.created")}: {new Date(latestRun.created_at).toLocaleString()}</p>
                <p>{t("shared.window")}: {t("shared.days", {count: latestRun.source_window_days})}</p>
                <p>
                  {t("state.snapshotMode")}:{" "}
                  <span className="text-text-primary">
                    {rawMeta.mode === "project_state_analysis" ? t("state.snapshotModeGithubPlan") : t("state.snapshotModeBaseline")}
                  </span>
                </p>
                {rawMeta.fallbackReason ? (
                  <p>
                    {t("state.fallbackReason")}: <span className="text-text-primary">{rawMeta.fallbackReason}</span>
                  </p>
                ) : null}
              </div>
              {latestRun.error_message ? (
                <div className="border border-error/30 bg-error/10 rounded-lg p-3">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-error mb-1">{t("shared.error")}</p>
                  <p>{latestRun.error_message}</p>
                </div>
              ) : null}
            </div>
          ) : (
            <EmptyText>
              {t("state.noRefreshRun")}
            </EmptyText>
          )}
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_1fr] mb-8">
        <Panel title={t("state.prdPreview")} headerAction={rawMeta.planTitle || plan?.title || t("state.noPlanTitle")}>
          {planPreviewLines.length > 0 || planObjective ? (
            <div className="space-y-4 text-sm text-text-secondary">
              {planObjective ? (
                <div className="border border-border-subtle rounded-xl p-4 bg-canvas/30">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-tertiary mb-2">
                    {t("state.objective")}
                  </p>
                  <p>{planObjective}</p>
                </div>
              ) : null}
              {planPreviewLines.length > 0 ? (
                <div className="space-y-2">
                  {planPreviewLines.map((line) => (
                    <div key={line} className="border border-border-subtle rounded-xl p-4 bg-canvas/30">
                      <p>{line}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <EmptyText>
              {t("state.attachPrdHint")}
            </EmptyText>
          )}
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr] mb-8">
        <Panel title={t("state.commitCoverage")}>
          {rawMeta.generatedFromGithub ? (
            <div className="space-y-4 text-sm text-text-secondary">
              <div className="grid grid-cols-2 gap-3">
                <MiniInfoCard label={t("state.commitsAnalyzed")} value={String(rawMeta.commitCount ?? 0)} />
                <MiniInfoCard label={t("state.touchedFiles")} value={String(touchedFileCount)} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-tertiary mb-2">
                  {t("state.commitRefs")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {commitRefs.map((ref) => (
                    <span key={ref} className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-elevated text-text-secondary border border-border-subtle">
                      {ref}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-tertiary mb-2">
                  {t("state.fileSample")}
                </p>
                <div className="space-y-2">
                  {touchedFilesSample.map((file) => (
                    <div key={file} className="border border-border-subtle rounded-xl p-3 bg-canvas/30 text-xs break-all">
                      {file}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <EmptyText>
              {t("state.commitCoverageHint")}
            </EmptyText>
          )}
        </Panel>

        <Panel title={t("state.prEvidence")}>
          {pullRequests.length > 0 ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <MiniInfoCard label={t("state.prsLinked")} value={String(rawMeta.pullRequestCount ?? pullRequests.length)} />
                <MiniInfoCard label={t("state.merged")} value={String(pullRequests.filter((pull) => pull.merged).length)} />
              </div>
              {pullRequests.slice(0, 3).map((pull) => (
                <div key={`${pull.number}-${pull.title}`} className="border border-border-subtle rounded-xl p-4 bg-canvas/30">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <p className="font-medium">{pull.title || "Untitled PR"}</p>
                    <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-elevated text-text-secondary border border-border-subtle">
                      #{pull.number}
                    </span>
                  </div>
                    <p className="text-sm text-text-secondary">
                    {pull.author || t("shared.unknown")} · {pull.merged ? t("state.mergedLower") : pull.state || t("state.open")}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyText>
              {t("state.prEvidenceHint")}
            </EmptyText>
          )}
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr] mb-8">
        <Panel title={t("state.issueEvidence")}>
          {issues.length > 0 ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <MiniInfoCard label={t("state.issuesLinked")} value={String(rawMeta.issueCount ?? issues.length)} />
                <MiniInfoCard label={t("state.openIssues")} value={String(rawMeta.issueCoverage?.openIssueCount ?? 0)} />
              </div>
              {issues.slice(0, 3).map((issue) => (
                <div key={`${issue.number}-${issue.title}`} className="border border-border-subtle rounded-xl p-4 bg-canvas/30">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <p className="font-medium">{issue.title || "Untitled issue"}</p>
                    <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-elevated text-text-secondary border border-border-subtle">
                      #{issue.number}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary">
                    {issue.author || t("shared.unknown")} · {issue.state || t("shared.unknown")}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyText>
              {t("state.issueEvidenceHint")}
            </EmptyText>
          )}
        </Panel>

        <Panel title={t("state.evidenceSummary")}>
          {snapshot?.evidence_json?.length ? (
            <div className="space-y-3">
              {snapshot.evidence_json.slice(0, 6).map((item, index) => {
                const evidence = item as { type?: string; title?: string; ref?: string | null };
                return (
                  <div key={`${evidence.type || "evidence"}-${index}`} className="border border-border-subtle rounded-xl p-4 bg-canvas/30">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-tertiary mb-2">{evidence.type || "evidence"}</p>
                    <p className="font-medium mb-1">{evidence.title || "Untitled evidence"}</p>
                    <p className="text-xs text-text-tertiary">{evidence.ref || t("shared.noRef")}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyText>
              {t("state.evidenceSummaryHint")}
            </EmptyText>
          )}
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr] mb-8">
        <Panel title={t("state.snapshotHistory")} headerAction={t("state.savedCount", {count: snapshotHistory.length})}>
          {snapshotHistory.length > 0 ? (
            <div className="space-y-3">
              {snapshotHistory.map((historyItem, index) => {
                const previous = snapshotHistory[index + 1] ?? null;
                const progressDelta = previous
                  ? historyItem.progress_percent - previous.progress_percent
                  : null;
                const driftDelta = previous
                  ? historyItem.drift_count - previous.drift_count
                  : null;
                const historyMeta = (historyItem.raw_output_json ?? {}) as {
                  mode?: string;
                };

                return (
                  <div
                    key={historyItem.id}
                    className="border border-border-subtle rounded-xl p-4 bg-canvas/30"
                  >
                    <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                      <p className="font-medium">
                        {new Date(historyItem.generated_at).toLocaleString()}
                      </p>
                      <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-elevated text-text-secondary border border-border-subtle">
                        {historyMeta.mode === "project_state_analysis" ? t("state.githubPlan") : t("state.baseline")}
                      </span>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-3 text-sm text-text-secondary">
                      <p>
                        {t("shared.progress")}:{" "}
                        <span className="text-text-primary font-medium">
                          {historyItem.progress_percent}%
                        </span>
                        {progressDelta !== null ? (
                          <span className={progressDelta >= 0 ? "text-success ml-2" : "text-error ml-2"}>
                            {progressDelta >= 0 ? "+" : ""}
                            {progressDelta}pt
                          </span>
                        ) : null}
                      </p>
                      <p>
                        {t("shared.drift")}:{" "}
                        <span className="text-text-primary font-medium">
                          {historyItem.drift_count}
                        </span>
                        {driftDelta !== null ? (
                          <span className={driftDelta <= 0 ? "text-success ml-2" : "text-error ml-2"}>
                            {driftDelta >= 0 ? "+" : ""}
                            {driftDelta}
                          </span>
                        ) : null}
                      </p>
                      <p>
                        {t("shared.phase")}:{" "}
                        <span className="text-text-primary font-medium">
                          {historyItem.current_phase}
                        </span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyText>
              {t("state.snapshotHistoryHint")}
            </EmptyText>
          )}
        </Panel>

        <Panel title={t("state.changeSinceLastSnapshot")}>
          {snapshot && previousSnapshot ? (
            <div className="space-y-4 text-sm text-text-secondary">
              <ChangeLine
                label={t("state.progressDelta")}
                value={`${snapshot.progress_percent - previousSnapshot.progress_percent >= 0 ? "+" : ""}${snapshot.progress_percent - previousSnapshot.progress_percent}pt`}
                positive={snapshot.progress_percent >= previousSnapshot.progress_percent}
              />
              <ChangeLine
                label={t("state.driftDelta")}
                value={`${snapshot.drift_count - previousSnapshot.drift_count >= 0 ? "+" : ""}${snapshot.drift_count - previousSnapshot.drift_count}`}
                positive={snapshot.drift_count <= previousSnapshot.drift_count}
              />
              <ChangeLine
                label={t("state.riskDelta")}
                value={`${snapshot.risk_count - previousSnapshot.risk_count >= 0 ? "+" : ""}${snapshot.risk_count - previousSnapshot.risk_count}`}
                positive={snapshot.risk_count <= previousSnapshot.risk_count}
              />
              <ChangeLine
                label={t("state.blockerDelta")}
                value={`${snapshot.blocker_count - previousSnapshot.blocker_count >= 0 ? "+" : ""}${snapshot.blocker_count - previousSnapshot.blocker_count}`}
                positive={snapshot.blocker_count <= previousSnapshot.blocker_count}
              />
            </div>
          ) : (
            <EmptyText>
              {t("state.changeSinceLastSnapshotHint")}
            </EmptyText>
          )}
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_1fr] mb-8">
        <Panel
          title={t("state.progressAgainstPlan")}
          headerAction={plan ? t("state.planTitle", {title: plan.title}) : t("state.noCurrentPlan")}
        >
          {planItems.length > 0 ? (
            <div className="space-y-3">
              {planItems.slice(0, 5).map((item, index) => {
                const progressItem = item as {
                  label?: string;
                  status?: string;
                  evidence?: string;
                  notes?: string;
                };
                return (
                  <div
                    key={`${progressItem.label || "item"}-${index}`}
                    className="border border-border-subtle rounded-xl p-4 bg-canvas/30"
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <p className="font-medium">{progressItem.label || "Untitled item"}</p>
                      <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-elevated text-text-secondary border border-border-subtle">
                        {progressItem.status || t("shared.unknown")}
                      </span>
                    </div>
                    {progressItem.evidence ? (
                      <p className="text-sm text-text-secondary mb-1">{t("shared.evidence")}: {progressItem.evidence}</p>
                    ) : null}
                    {progressItem.notes ? (
                      <p className="text-sm text-text-tertiary">{progressItem.notes}</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyText>
              {t("state.progressAgainstPlanHint")}
            </EmptyText>
          )}
        </Panel>

        <Panel title={t("state.openBlockersAndRisks")}>
          {snapshot ? (
            <div className="space-y-4 text-sm text-text-secondary">
              <div className="border border-border-subtle rounded-xl p-4 bg-canvas/30">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-tertiary mb-2">{t("shared.blocked")}</p>
                <p>{snapshot.blocker_count > 0 ? t("state.activeBlockers", {count: snapshot.blocker_count}) : t("state.noBlockers")}</p>
              </div>
              <div className="border border-border-subtle rounded-xl p-4 bg-canvas/30">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-tertiary mb-2">{t("shared.risks")}</p>
                <p>{snapshot.risk_count > 0 ? t("state.riskItems", {count: snapshot.risk_count}) : t("state.noRisks")}</p>
              </div>
            </div>
          ) : (
            <EmptyText>
              {t("state.risksEmptyHint")}
            </EmptyText>
          )}
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Panel title={t("state.recentDrift")} headerAction={<Link href={`/projects/${currentProject.id}/drift`} className="text-accent hover:text-accent-hover transition-colors">{t("shared.viewAll")}</Link>}>
          {driftItems.length > 0 ? (
            <div className="space-y-3">
              {driftItems.slice(0, 3).map((item, index) => {
                const driftItem = item as {
                  title?: string;
                  original?: string;
                  current?: string;
                  why?: string;
                };
                return (
                  <div key={`${driftItem.title || "drift"}-${index}`} className="border border-border-subtle rounded-xl p-4 bg-canvas/30">
                    <p className="font-medium mb-3">{driftItem.title || "Untitled drift"}</p>
                    <div className="space-y-2 text-sm text-text-secondary">
                      <p><span className="text-text-primary font-medium">Original:</span> {driftItem.original || "—"}</p>
                      <p><span className="text-text-primary font-medium">{t("shared.original")}:</span> {driftItem.original || "—"}</p>
                      <p><span className="text-text-primary font-medium">{t("shared.now")}:</span> {driftItem.current || "—"}</p>
                      <p><span className="text-text-primary font-medium">{t("shared.why")}:</span> {driftItem.why || "—"}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyText>
              {t("state.noDriftItems")}
            </EmptyText>
          )}
        </Panel>

        <Panel title={t("state.evidenceEntry")}>
          <EmptyText>
            {t("state.evidenceEntryHint")}
          </EmptyText>
        </Panel>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  meta,
}: {
  label: string;
  value: string;
  meta: string;
}) {
  return (
    <div className="border border-border-subtle rounded-2xl p-5 bg-surface/30">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-tertiary mb-2">{label}</p>
      <p className="text-3xl font-display font-bold mb-1">{value}</p>
      <p className="text-sm text-text-secondary">{meta}</p>
    </div>
  );
}

function Panel({
  title,
  children,
  headerAction,
}: {
  title: string;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
}) {
  return (
    <section className="border border-border-subtle rounded-2xl p-6 bg-surface/30">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        {headerAction ? <div className="text-xs text-text-tertiary">{headerAction}</div> : null}
      </div>
      {children}
    </section>
  );
}

function EmptyText({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-text-secondary leading-7">{children}</p>;
}

function RunStatusPill({ status }: { status: string }) {
  const toneClass =
    status === "completed"
      ? "bg-success/10 text-success border border-success/30"
      : status === "failed"
        ? "bg-error/10 text-error border border-error/30"
        : status === "processing"
          ? "bg-accent/10 text-accent border border-accent/30"
          : "bg-elevated text-text-secondary border border-border-subtle";

  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${toneClass}`}>
      {status}
    </span>
  );
}

function ChangeLine({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive: boolean;
}) {
  return (
    <div className="border border-border-subtle rounded-xl p-4 bg-canvas/30 flex items-center justify-between gap-3">
      <p>{label}</p>
      <p className={positive ? "text-success font-medium" : "text-error font-medium"}>{value}</p>
    </div>
  );
}

function MiniInfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border border-border-subtle rounded-xl px-3 py-3 bg-canvas/30">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1">{label}</p>
      <p className="text-sm font-semibold break-words">{value}</p>
    </div>
  );
}

function ChecklistRow({
  label,
  detail,
  ready,
  readyLabel,
  pendingLabel,
}: {
  label: string;
  detail: string;
  ready: boolean;
  readyLabel: string;
  pendingLabel: string;
}) {
  return (
    <div className="border border-border-subtle rounded-xl p-4 bg-canvas/30 flex items-start justify-between gap-4">
      <div>
        <p className="font-medium mb-1">{label}</p>
        <p className="text-sm text-text-secondary">{detail}</p>
      </div>
      <span
        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          ready
            ? "bg-success/10 text-success border border-success/30"
            : "bg-elevated text-text-secondary border border-border-subtle"
        }`}
      >
        {ready ? readyLabel : pendingLabel}
      </span>
    </div>
  );
}

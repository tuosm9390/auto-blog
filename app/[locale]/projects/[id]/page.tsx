import { auth } from "@/auth";
import { redirect, Link } from "@/i18n/routing";
import { refreshProjectStateAction } from "@/app/actions/projectActions";
import {
  getAnalysisRunsByProject,
  getCurrentProjectPlan,
  getLatestStateSnapshot,
  getProjectById,
  getStateSnapshotsByProject,
} from "@/lib/projects";

export default async function ProjectStatePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect({ href: "/login", locale });
  }
  const safeUserId = userId as string;
  const hasAccessToken = Boolean((session?.user as { accessToken?: string } | undefined)?.accessToken);

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
  const readinessChecks = [
    {
      label: "Plan attached",
      ready: Boolean(plan?.content_markdown?.trim()),
      detail: plan ? plan.title : "No current plan yet",
    },
    {
      label: "Repo connected",
      ready: Boolean(currentProject.github_repo_owner && currentProject.github_repo_name),
      detail:
        currentProject.github_repo_owner && currentProject.github_repo_name
          ? `${currentProject.github_repo_owner}/${currentProject.github_repo_name}`
          : "GitHub repository is not connected",
    },
    {
      label: "GitHub activity in snapshot",
      ready: Boolean(rawMeta.generatedFromGithub),
      detail: rawMeta.generatedFromGithub
        ? `${rawMeta.commitCount ?? 0} commit(s) analyzed`
        : "Latest snapshot was created without GitHub activity",
    },
  ];
  const hasSnapshot = Boolean(snapshot);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 md:py-16 animate-fade-in-up">
      <section className="mb-8 flex flex-col xl:flex-row xl:items-end justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent mb-2">Project state</p>
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-2">
            {currentProject.name}
          </h1>
          <p className="text-text-secondary max-w-3xl">
            {currentProject.current_thesis || currentProject.description || "No current thesis yet"}
          </p>
          <div className="mt-3 text-xs text-text-tertiary flex flex-wrap gap-x-4 gap-y-2">
            <span>Original thesis: {currentProject.original_thesis || "Not set"}</span>
            <span>Repo: {currentProject.github_repo_owner && currentProject.github_repo_name ? `${currentProject.github_repo_owner}/${currentProject.github_repo_name}` : "not connected"}</span>
            <span>Status: {currentProject.status}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href={`/projects/${currentProject.id}/edit`}
            className="px-5 py-3 border border-border-subtle rounded-lg text-sm text-text-secondary hover:border-border-strong hover:text-text-primary transition-colors text-center"
          >
            Edit project
          </Link>
          <Link
            href={`/projects/${currentProject.id}/runs`}
            className="px-5 py-3 border border-border-subtle rounded-lg text-sm text-text-secondary hover:border-border-strong hover:text-text-primary transition-colors text-center"
          >
            View runs
          </Link>
          <Link
            href={`/projects/${currentProject.id}/drift`}
            className="px-5 py-3 border border-border-subtle rounded-lg text-sm text-text-secondary hover:border-border-strong hover:text-text-primary transition-colors text-center"
          >
            Review drift
          </Link>
          <form action={refreshAction}>
            <button
              type="submit"
              className="w-full px-5 py-3 bg-accent text-black font-semibold rounded-lg hover:bg-accent-hover transition-colors"
            >
              Refresh state
            </button>
          </form>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
        <MetricCard label="Progress" value={snapshot ? `${snapshot.progress_percent}%` : "—"} meta={snapshot ? "Latest snapshot" : "No snapshot yet"} />
        <MetricCard label="Current phase" value={snapshot?.current_phase || "Not analyzed"} meta="State board status" />
        <MetricCard label="Plan drift" value={snapshot ? String(snapshot.drift_count) : "—"} meta="Changed decisions detected" />
        <MetricCard label="Blocked / Risks" value={snapshot ? `${snapshot.blocker_count} / ${snapshot.risk_count}` : "—"} meta="Open blockers and risks" />
      </section>

      {!hasSnapshot ? (
        <section className="grid gap-4 xl:grid-cols-[1.05fr_1fr] mb-8">
          <Panel title="Before first refresh">
            <div className="space-y-3">
              <ChecklistRow
                label="Plan attached"
                detail={plan ? `Current plan: ${plan.title}` : "Add a PRD or rough markdown plan from Edit project"}
                ready={Boolean(plan?.content_markdown?.trim())}
              />
              <ChecklistRow
                label="Repo connected"
                detail={
                  currentProject.github_repo_owner && currentProject.github_repo_name
                    ? `${currentProject.github_repo_owner}/${currentProject.github_repo_name}`
                    : "Connect the GitHub repository from Edit project"
                }
                ready={Boolean(currentProject.github_repo_owner && currentProject.github_repo_name)}
              />
              <ChecklistRow
                label="Auth token available"
                detail="If the refresh falls back to baseline, check the latest run and GitHub auth state."
                ready={hasAccessToken}
              />
            </div>
          </Panel>

          <Panel title="What a good first result looks like">
            <ul className="space-y-2 text-sm text-text-secondary">
              <li className="flex gap-2"><span className="text-accent">•</span><span>`Current snapshot` mentions actual work instead of generic setup text.</span></li>
              <li className="flex gap-2"><span className="text-accent">•</span><span>`Commit coverage` shows multiple refs and touched files.</span></li>
              <li className="flex gap-2"><span className="text-accent">•</span><span>`PR evidence` or `Issue evidence` shows linked context when available.</span></li>
              <li className="flex gap-2"><span className="text-accent">•</span><span>`Watch next` gives concrete next actions you would actually take.</span></li>
            </ul>
          </Panel>
        </section>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr] mb-8">
        <Panel title="Current snapshot">
          {snapshot ? (
            <p className="text-sm text-text-secondary leading-7">{snapshot.summary}</p>
          ) : (
            <EmptyText>
              No state snapshot yet. Run <span className="text-text-primary font-medium">Refresh state</span> to create a baseline board.
            </EmptyText>
          )}
        </Panel>

        <Panel title="Watch next">
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
              Attach a plan, connect the repo, and create the first snapshot.
            </EmptyText>
          )}
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_1fr] mb-8">
        <Panel title="Data quality checks">
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
                  {item.ready ? "ready" : "missing"}
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Last refresh">
          {latestRun ? (
            <div className="space-y-4 text-sm text-text-secondary">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-text-primary">Run {latestRun.id.slice(0, 8)}</p>
                <RunStatusPill status={latestRun.status} />
              </div>
              <div className="space-y-2">
                <p>Created: {new Date(latestRun.created_at).toLocaleString()}</p>
                <p>Window: {latestRun.source_window_days} day(s)</p>
                <p>
                  Snapshot mode:{" "}
                  <span className="text-text-primary">
                    {rawMeta.mode === "project_state_analysis" ? "GitHub + plan analysis" : "Plan-only baseline"}
                  </span>
                </p>
                {rawMeta.fallbackReason ? (
                  <p>
                    Fallback reason: <span className="text-text-primary">{rawMeta.fallbackReason}</span>
                  </p>
                ) : null}
              </div>
              {latestRun.error_message ? (
                <div className="border border-error/30 bg-error/10 rounded-lg p-3">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-error mb-1">Error</p>
                  <p>{latestRun.error_message}</p>
                </div>
              ) : null}
            </div>
          ) : (
            <EmptyText>
              No refresh run yet. The first run will show whether this board is using GitHub activity or only a baseline plan.
            </EmptyText>
          )}
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_1fr] mb-8">
        <Panel title="PRD preview" headerAction={rawMeta.planTitle || plan?.title || "No plan title"}>
          {planPreviewLines.length > 0 || planObjective ? (
            <div className="space-y-4 text-sm text-text-secondary">
              {planObjective ? (
                <div className="border border-border-subtle rounded-xl p-4 bg-canvas/30">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-tertiary mb-2">
                    Objective
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
              Attach a PRD or working plan to give the state board stronger product context.
            </EmptyText>
          )}
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr] mb-8">
        <Panel title="Commit coverage">
          {rawMeta.generatedFromGithub ? (
            <div className="space-y-4 text-sm text-text-secondary">
              <div className="grid grid-cols-2 gap-3">
                <MiniInfoCard label="Commits analyzed" value={String(rawMeta.commitCount ?? 0)} />
                <MiniInfoCard label="Touched files" value={String(touchedFileCount)} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-tertiary mb-2">
                  Commit refs
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
                  File sample
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
              GitHub-backed commit coverage appears after a refresh run with repo connection and token access.
            </EmptyText>
          )}
        </Panel>

        <Panel title="PR evidence">
          {pullRequests.length > 0 ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <MiniInfoCard label="PRs linked" value={String(rawMeta.pullRequestCount ?? pullRequests.length)} />
                <MiniInfoCard label="Merged" value={String(pullRequests.filter((pull) => pull.merged).length)} />
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
                    {pull.author || "unknown"} · {pull.merged ? "merged" : pull.state || "open"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyText>
              PR-backed reasoning appears when recent commits can be associated with pull requests.
            </EmptyText>
          )}
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr] mb-8">
        <Panel title="Issue evidence">
          {issues.length > 0 ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <MiniInfoCard label="Issues linked" value={String(rawMeta.issueCount ?? issues.length)} />
                <MiniInfoCard label="Open issues" value={String(rawMeta.issueCoverage?.openIssueCount ?? 0)} />
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
                    {issue.author || "unknown"} · {issue.state || "unknown"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyText>
              Issue-backed reasoning appears when commit or PR text references GitHub issues.
            </EmptyText>
          )}
        </Panel>

        <Panel title="Evidence summary">
          {snapshot?.evidence_json?.length ? (
            <div className="space-y-3">
              {snapshot.evidence_json.slice(0, 6).map((item, index) => {
                const evidence = item as { type?: string; title?: string; ref?: string | null };
                return (
                  <div key={`${evidence.type || "evidence"}-${index}`} className="border border-border-subtle rounded-xl p-4 bg-canvas/30">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-tertiary mb-2">{evidence.type || "evidence"}</p>
                    <p className="font-medium mb-1">{evidence.title || "Untitled evidence"}</p>
                    <p className="text-xs text-text-tertiary">{evidence.ref || "No ref"}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyText>
              Evidence links will appear here as plans, issues, pull requests, and commits get attached to snapshots.
            </EmptyText>
          )}
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr] mb-8">
        <Panel title="Snapshot history" headerAction={`${snapshotHistory.length} saved`}>
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
                        {historyMeta.mode === "project_state_analysis" ? "github+plan" : "baseline"}
                      </span>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-3 text-sm text-text-secondary">
                      <p>
                        Progress:{" "}
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
                        Drift:{" "}
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
                        Phase:{" "}
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
              Snapshot history appears after refresh runs start accumulating.
            </EmptyText>
          )}
        </Panel>

        <Panel title="Change since last snapshot">
          {snapshot && previousSnapshot ? (
            <div className="space-y-4 text-sm text-text-secondary">
              <ChangeLine
                label="Progress delta"
                value={`${snapshot.progress_percent - previousSnapshot.progress_percent >= 0 ? "+" : ""}${snapshot.progress_percent - previousSnapshot.progress_percent}pt`}
                positive={snapshot.progress_percent >= previousSnapshot.progress_percent}
              />
              <ChangeLine
                label="Drift delta"
                value={`${snapshot.drift_count - previousSnapshot.drift_count >= 0 ? "+" : ""}${snapshot.drift_count - previousSnapshot.drift_count}`}
                positive={snapshot.drift_count <= previousSnapshot.drift_count}
              />
              <ChangeLine
                label="Risk delta"
                value={`${snapshot.risk_count - previousSnapshot.risk_count >= 0 ? "+" : ""}${snapshot.risk_count - previousSnapshot.risk_count}`}
                positive={snapshot.risk_count <= previousSnapshot.risk_count}
              />
              <ChangeLine
                label="Blocker delta"
                value={`${snapshot.blocker_count - previousSnapshot.blocker_count >= 0 ? "+" : ""}${snapshot.blocker_count - previousSnapshot.blocker_count}`}
                positive={snapshot.blocker_count <= previousSnapshot.blocker_count}
              />
            </div>
          ) : (
            <EmptyText>
              You need at least two saved snapshots before this board can show meaningful change over time.
            </EmptyText>
          )}
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_1fr] mb-8">
        <Panel
          title="Progress against plan"
          headerAction={plan ? `Plan: ${plan.title}` : "No current plan"}
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
                        {progressItem.status || "unknown"}
                      </span>
                    </div>
                    {progressItem.evidence ? (
                      <p className="text-sm text-text-secondary mb-1">Evidence: {progressItem.evidence}</p>
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
              Progress items will appear here after the refresh pipeline starts translating the plan into state.
            </EmptyText>
          )}
        </Panel>

        <Panel title="Open blockers and risks">
          {snapshot ? (
            <div className="space-y-4 text-sm text-text-secondary">
              <div className="border border-border-subtle rounded-xl p-4 bg-canvas/30">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-tertiary mb-2">Blocked</p>
                <p>{snapshot.blocker_count > 0 ? `${snapshot.blocker_count} active blocker(s)` : "No blockers in the latest snapshot"}</p>
              </div>
              <div className="border border-border-subtle rounded-xl p-4 bg-canvas/30">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-tertiary mb-2">Risks</p>
                <p>{snapshot.risk_count > 0 ? `${snapshot.risk_count} risk item(s) require review` : "No risks surfaced in the latest snapshot"}</p>
              </div>
            </div>
          ) : (
            <EmptyText>
              Risks and blockers are empty until the first state snapshot exists.
            </EmptyText>
          )}
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Panel title="Recent drift" headerAction={<Link href={`/projects/${currentProject.id}/drift`} className="text-accent hover:text-accent-hover transition-colors">View all</Link>}>
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
                      <p><span className="text-text-primary font-medium">Now:</span> {driftItem.current || "—"}</p>
                      <p><span className="text-text-primary font-medium">Why:</span> {driftItem.why || "—"}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyText>
              No drift items yet. Once the product thesis starts moving, this is where changed decisions will show up.
            </EmptyText>
          )}
        </Panel>

        <Panel title="Evidence entry">
          <EmptyText>
            Use the panels above to inspect exactly which plans, issues, pull requests, and commits informed the latest snapshot.
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
}: {
  label: string;
  detail: string;
  ready: boolean;
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
        {ready ? "ready" : "check"}
      </span>
    </div>
  );
}

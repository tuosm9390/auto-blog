import { auth } from "@/auth";
import { redirect, Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import {
  getAnalysisRunsByProject,
  getLatestStateSnapshot,
  getProjectById,
} from "@/lib/projects";

export default async function ProjectRunsPage({
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
  const t = await getTranslations("Projects");

  const [project, runs, latestSnapshot] = await Promise.all([
    getProjectById(id),
    getAnalysisRunsByProject(id),
    getLatestStateSnapshot(id),
  ]);

  if (!project || project.owner_id !== safeUserId) {
    redirect({ href: "/projects", locale });
  }

  const currentProject = project as NonNullable<typeof project>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 md:py-16 animate-fade-in-up">
      <section className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent mb-2">{t("runs.tag")}</p>
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-2">
            {currentProject.name}
          </h1>
          <p className="text-text-secondary max-w-3xl">
            {t("runs.description")}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href={`/projects/${currentProject.id}`}
            className="px-5 py-3 border border-border-subtle rounded-lg text-sm text-text-secondary hover:border-border-strong hover:text-text-primary transition-colors text-center"
        >
            {t("shared.backToState")}
          </Link>
          <Link
            href={`/projects/${currentProject.id}/drift`}
            className="px-5 py-3 border border-border-subtle rounded-lg text-sm text-text-secondary hover:border-border-strong hover:text-text-primary transition-colors text-center"
        >
            {t("shared.reviewDrift")}
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
        <MetricCard label={t("runs.metrics.totalRuns")} value={String(runs.length)} meta={t("runs.metrics.totalRunsMeta")} />
        <MetricCard label={t("runs.metrics.completed")} value={String(runs.filter((run) => run.status === "completed").length)} meta={t("runs.metrics.completedMeta")} />
        <MetricCard label={t("runs.metrics.failed")} value={String(runs.filter((run) => run.status === "failed").length)} meta={t("runs.metrics.failedMeta")} />
        <MetricCard label={t("runs.metrics.latestSnapshot")} value={latestSnapshot ? new Date(latestSnapshot.generated_at).toLocaleDateString() : t("shared.none")} meta={t("runs.metrics.latestSnapshotMeta")} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_1fr]">
        <section className="border border-border-subtle rounded-2xl p-6 bg-surface/30">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold">{t("runs.runHistory")}</h2>
            <span className="text-xs text-text-tertiary">{t("runs.newestFirst")}</span>
          </div>

          {runs.length === 0 ? (
            <p className="text-sm text-text-secondary leading-7">
              {t("runs.noRunsPrefix")} <span className="text-text-primary font-medium">{t("shared.refreshState")}</span>.
            </p>
          ) : (
            <div className="space-y-3">
              {runs.map((run) => (
                <div
                  key={run.id}
                  className="border border-border-subtle rounded-xl p-4 bg-canvas/30"
                >
                  <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                    <div>
                      <p className="font-medium">{run.id.slice(0, 8)}</p>
                      <p className="text-xs text-text-tertiary mt-1">
                        {t("shared.created")} {new Date(run.created_at).toLocaleString()}
                      </p>
                    </div>
                    <StatusPill status={run.status} />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 text-sm text-text-secondary">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1">
                        {t("runs.inputSummary")}
                      </p>
                      <p>{run.input_summary || t("runs.noSummaryRecorded")}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1">
                        {t("runs.sourceWindow")}
                      </p>
                      <p>{t("shared.days", {count: run.source_window_days})}</p>
                    </div>
                  </div>

                  {run.error_message ? (
                    <div className="mt-3 border border-error/30 bg-error/10 rounded-lg p-3">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-error mb-1">
                        {t("shared.error")}
                      </p>
                      <p className="text-sm text-text-secondary">{run.error_message}</p>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <section className="border border-border-subtle rounded-2xl p-6 bg-surface/30">
            <h2 className="text-lg font-semibold mb-4">{t("runs.latestSnapshotSummary")}</h2>
            {latestSnapshot ? (
              <div className="space-y-4 text-sm text-text-secondary">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1">
                    {t("shared.summary")}
                  </p>
                  <p className="leading-7">{latestSnapshot.summary}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <MiniMetric label={t("shared.progress")} value={`${latestSnapshot.progress_percent}%`} />
                  <MiniMetric label={t("shared.phase")} value={latestSnapshot.current_phase} />
                  <MiniMetric label={t("shared.drift")} value={String(latestSnapshot.drift_count)} />
                  <MiniMetric label={t("shared.risks")} value={String(latestSnapshot.risk_count)} />
                </div>
                <div className="border border-border-subtle rounded-xl p-4 bg-canvas/30">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-tertiary mb-2">
                    {t("runs.snapshotSource")}
                  </p>
                  <SnapshotSourceSummary rawOutput={latestSnapshot.raw_output_json} t={t} />
                </div>
              </div>
            ) : (
              <p className="text-sm text-text-secondary leading-7">
                {t("runs.noSnapshotSaved")}
              </p>
            )}
          </section>

          <section className="border border-border-subtle rounded-2xl p-6 bg-surface/30">
            <h2 className="text-lg font-semibold mb-4">{t("runs.latestRawOutput")}</h2>
            {latestSnapshot ? (
              <pre className="overflow-x-auto rounded-xl border border-border-subtle bg-canvas/40 p-4 text-xs text-text-secondary whitespace-pre-wrap break-words">
                {JSON.stringify(latestSnapshot.raw_output_json, null, 2)}
              </pre>
            ) : (
              <p className="text-sm text-text-secondary leading-7">
                {t("runs.rawOutputHint")}
              </p>
            )}
          </section>
        </section>
      </section>
    </div>
  );
}

function SnapshotSourceSummary({
  rawOutput,
  t,
}: {
  rawOutput: Record<string, unknown>;
  t: Awaited<ReturnType<typeof getTranslations>>;
}) {
  const mode = typeof rawOutput.mode === "string" ? rawOutput.mode : "unknown";
  const repoConfigured = Boolean(rawOutput.repoConfigured);
  const tokenAvailable = Boolean(rawOutput.tokenAvailable);
  const generatedFromPlan = Boolean(rawOutput.generatedFromPlan);
  const generatedFromGithub = Boolean(rawOutput.generatedFromGithub);
  const commitCount =
    typeof rawOutput.commitCount === "number" ? rawOutput.commitCount : 0;
  const fallbackReason =
    typeof rawOutput.fallbackReason === "string" ? rawOutput.fallbackReason : null;
  const planSummary =
    typeof rawOutput.planSummary === "object" && rawOutput.planSummary
      ? (rawOutput.planSummary as { previewLines?: string[]; objective?: string | null })
      : null;
  const commitCoverage =
    typeof rawOutput.commitCoverage === "object" && rawOutput.commitCoverage
      ? (rawOutput.commitCoverage as {
          analyzedCommitRefs?: string[];
          touchedFileCount?: number;
          touchedFilesSample?: string[];
        })
      : null;
  const pullRequests = Array.isArray(rawOutput.pullRequests)
    ? (rawOutput.pullRequests as Array<{
        number?: number;
        title?: string;
        state?: string;
        merged?: boolean;
      }>)
    : [];
  const pullRequestCount =
    typeof rawOutput.pullRequestCount === "number" ? rawOutput.pullRequestCount : pullRequests.length;
  const issues = Array.isArray(rawOutput.issues)
    ? (rawOutput.issues as Array<{
        number?: number;
        title?: string;
        state?: string;
      }>)
    : [];
  const issueCount =
    typeof rawOutput.issueCount === "number" ? rawOutput.issueCount : issues.length;

  return (
    <div className="space-y-2 text-sm text-text-secondary">
      <p>
        {t("runs.mode")}: <span className="text-text-primary">{mode}</span>
      </p>
      <p>
        {t("runs.planAttached")}: <span className="text-text-primary">{generatedFromPlan ? t("shared.yes") : t("shared.no")}</span>
      </p>
      <p>
        {t("runs.repoConfigured")}: <span className="text-text-primary">{repoConfigured ? t("shared.yes") : t("shared.no")}</span>
      </p>
      <p>
        {t("runs.tokenAvailable")}: <span className="text-text-primary">{tokenAvailable ? t("shared.yes") : t("shared.no")}</span>
      </p>
      <p>
        {t("runs.githubEvidence")}:{" "}
        <span className="text-text-primary">
          {generatedFromGithub ? t("runs.commitCount", {count: commitCount}) : t("runs.notIncluded")}
        </span>
      </p>
      {fallbackReason ? (
        <p>
          {t("runs.fallbackReason")}: <span className="text-text-primary">{fallbackReason}</span>
        </p>
      ) : null}
      {planSummary?.objective ? (
        <p>
          {t("runs.prdObjective")}: <span className="text-text-primary">{planSummary.objective}</span>
        </p>
      ) : null}
      {commitCoverage?.analyzedCommitRefs?.length ? (
        <p>
          {t("runs.commitRefs")}:{" "}
          <span className="text-text-primary">{commitCoverage.analyzedCommitRefs.join(", ")}</span>
        </p>
      ) : null}
      {typeof commitCoverage?.touchedFileCount === "number" ? (
        <p>
          {t("runs.touchedFiles")}: <span className="text-text-primary">{commitCoverage.touchedFileCount}</span>
        </p>
      ) : null}
      {pullRequestCount > 0 ? (
        <p>
          {t("runs.linkedPrs")}: <span className="text-text-primary">{pullRequestCount}</span>
        </p>
      ) : null}
      {pullRequests.length > 0 ? (
        <p>
          {t("runs.prRefs")}:{" "}
          <span className="text-text-primary">
            {pullRequests.slice(0, 3).map((pull) => `#${pull.number} ${pull.title || ""}`.trim()).join(", ")}
          </span>
        </p>
      ) : null}
      {issueCount > 0 ? (
        <p>
          {t("runs.linkedIssues")}: <span className="text-text-primary">{issueCount}</span>
        </p>
      ) : null}
      {issues.length > 0 ? (
        <p>
          {t("runs.issueRefs")}:{" "}
          <span className="text-text-primary">
            {issues.slice(0, 3).map((issue) => `#${issue.number} ${issue.title || ""}`.trim()).join(", ")}
          </span>
        </p>
      ) : null}
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
      <p className="text-2xl font-display font-bold mb-1 break-words">{value}</p>
      <p className="text-sm text-text-secondary">{meta}</p>
    </div>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border border-border-subtle rounded-xl px-3 py-3 bg-canvas/30">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
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

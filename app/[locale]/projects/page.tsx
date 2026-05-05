import { auth } from "@/auth";
import { redirect, Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import {
  getLatestStateSnapshot,
  getProjectMemorySetupState,
  getProjectsByOwner,
} from "@/lib/projects";

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect({ href: "/login", locale });
  }
  const safeUserId = userId as string;
  const t = await getTranslations("Projects");

  const [setupState, projects] = await Promise.all([
    getProjectMemorySetupState(),
    getProjectsByOwner(safeUserId),
  ]);
  const projectsWithState = await Promise.all(
    projects.map(async (project) => ({
      project,
      snapshot: await getLatestStateSnapshot(project.id),
    }))
  );

  const activeProjects = projectsWithState.filter((item) => item.project.status === "active").length;
  const blockedProjects = projectsWithState.filter((item) => (item.snapshot?.blocker_count ?? 0) > 0).length;
  const highDriftProjects = projectsWithState.filter((item) => (item.snapshot?.drift_count ?? 0) >= 3).length;
  const needsReviewProjects = projectsWithState.filter((item) => !item.snapshot).length;
  const hasProjects = projectsWithState.length > 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 md:py-16 animate-fade-in-up">
      <section className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent mb-2">
            {t("index.tag")}
          </p>
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-2">
            {t("index.title")}
          </h1>
          <p className="text-text-secondary max-w-2xl">
            {t("index.description")}
          </p>
        </div>
        <Link
          href="/projects/new"
          className="px-5 py-3 bg-accent text-black font-semibold rounded-lg hover:bg-accent-hover transition-colors"
        >
          {t("shared.newProject")}
        </Link>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
        <SummaryCard label={t("index.metrics.activeProjects")} value={String(activeProjects)} meta={t("index.metrics.activeProjectsMeta")} />
        <SummaryCard label={t("index.metrics.blocked")} value={String(blockedProjects)} meta={t("index.metrics.blockedMeta")} />
        <SummaryCard label={t("index.metrics.highDrift")} value={String(highDriftProjects)} meta={t("index.metrics.highDriftMeta")} />
        <SummaryCard label={t("index.metrics.needsReview")} value={String(needsReviewProjects)} meta={t("index.metrics.needsReviewMeta")} />
      </section>

      {setupState.ready ? (
        <section className="grid gap-4 xl:grid-cols-[1.1fr_1fr] mb-8">
          <section className="border border-border-subtle rounded-2xl p-6 bg-surface/30">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-lg font-semibold">{t("index.firstRunChecklist")}</h2>
              <span className="text-xs text-text-tertiary">{t("index.firstRunChecklistMeta")}</span>
            </div>
            <div className="space-y-3">
              <ChecklistRow
                label={t("index.checklist.createProject")}
                detail={hasProjects ? t("index.checklist.createProjectDone") : t("index.checklist.createProjectTodo")}
                ready={hasProjects}
                readyLabel={t("shared.done")}
                pendingLabel={t("shared.next")}
              />
              <ChecklistRow
                label={t("index.checklist.attachPlan")}
                detail={hasProjects ? t("index.checklist.attachPlanTodo") : t("index.checklist.attachPlanCreate")}
                ready={projectsWithState.some((item) => Boolean(item.project.current_thesis || item.project.description))}
                readyLabel={t("shared.done")}
                pendingLabel={t("shared.next")}
              />
              <ChecklistRow
                label={t("index.checklist.connectRepo")}
                detail={hasProjects ? t("index.checklist.connectRepoTodo") : t("index.checklist.connectRepoCreate")}
                ready={projectsWithState.some((item) => Boolean(item.project.github_repo_owner && item.project.github_repo_name))}
                readyLabel={t("shared.done")}
                pendingLabel={t("shared.next")}
              />
              <ChecklistRow
                label={t("index.checklist.runRefresh")}
                detail={needsReviewProjects > 0 ? t("index.checklist.runRefreshTodo") : t("index.checklist.runRefreshDone")}
                ready={projectsWithState.some((item) => Boolean(item.snapshot))}
                readyLabel={t("shared.done")}
                pendingLabel={t("shared.next")}
              />
            </div>
          </section>

          <section className="border border-border-subtle rounded-2xl p-6 bg-surface/30">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-lg font-semibold">{t("index.verifyNext")}</h2>
              <span className="text-xs text-text-tertiary">{t("index.verifyNextMeta")}</span>
            </div>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li className="flex gap-2"><span className="text-accent">•</span><span>{t("index.verifyItems.fallbackReason")}</span></li>
              <li className="flex gap-2"><span className="text-accent">•</span><span>{t("index.verifyItems.prdPreview")}</span></li>
              <li className="flex gap-2"><span className="text-accent">•</span><span>{t("index.verifyItems.evidence")}</span></li>
              <li className="flex gap-2"><span className="text-accent">•</span><span>{t("index.verifyItems.watchNext")}</span></li>
            </ul>
          </section>
        </section>
      ) : null}

      {!setupState.ready ? (
        <section className="mb-8 border border-yellow-500/30 rounded-2xl p-5 bg-yellow-500/10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-500 mb-2">
            {t("shared.setupRequired")}
          </p>
          <p className="text-sm text-text-secondary leading-7">
            {setupState.message} {t("index.setupReload")}
          </p>
          <p className="mt-3 text-xs text-text-tertiary">
            {t("index.sqlFile")}: <span className="text-text-primary">scripts/add-project-memory-core.sql</span>
          </p>
        </section>
      ) : null}

      {projectsWithState.length === 0 ? (
        <section className="border border-border-subtle rounded-2xl p-10 md:p-16 text-center bg-surface/30">
          <div className="text-5xl mb-4 opacity-50">🗂️</div>
          <h2 className="text-2xl font-semibold mb-2">{t("index.emptyTitle")}</h2>
          <p className="text-text-secondary max-w-xl mx-auto mb-6">
            {t("index.emptyDescription")}
          </p>
          <Link
            href="/projects/new"
            className="inline-flex px-6 py-3 bg-accent text-black font-semibold rounded-lg hover:bg-accent-hover transition-colors"
          >
            {t("index.createFirstProject")}
          </Link>
        </section>
      ) : (
        <section className="space-y-4">
          {projectsWithState.map(({ project, snapshot }) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="block border border-border-subtle rounded-2xl p-6 bg-surface/30 hover:border-border-strong hover:bg-elevated/40 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h2 className="text-xl font-semibold">{project.name}</h2>
                    <StatusPill label={t(`shared.status.${project.status}`)} tone="neutral" />
                    {snapshot?.drift_count ? <StatusPill label={t("index.labels.driftCount", {count: snapshot.drift_count})} tone="accent" /> : null}
                    {snapshot?.blocker_count ? <StatusPill label={t("index.labels.blockedCount", {count: snapshot.blocker_count})} tone="danger" /> : null}
                  </div>
                  <p className="text-sm text-text-secondary mb-3">
                    {project.current_thesis || project.description || t("shared.noCurrentThesis")}
                  </p>
                  <div className="text-xs text-text-tertiary flex flex-wrap gap-x-4 gap-y-2">
                    <span>{t("shared.repo")}: {project.github_repo_owner && project.github_repo_name ? `${project.github_repo_owner}/${project.github_repo_name}` : t("shared.notConnected")}</span>
                    <span>{t("shared.updated")}: {new Date(project.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-3 lg:w-[420px]">
                  <MetricTile label={t("shared.progress")} value={snapshot ? `${snapshot.progress_percent}%` : "—"} />
                  <MetricTile label={t("shared.phase")} value={snapshot?.current_phase || t("shared.noSnapshot")} />
                  <MetricTile label={t("shared.risks")} value={snapshot ? String(snapshot.risk_count) : "—"} />
                  <MetricTile label={t("shared.watchNext")} value={snapshot?.watch_next?.[0] || t("shared.refreshState")} />
                </div>
              </div>
            </Link>
          ))}
        </section>
      )}
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

function SummaryCard({ label, value, meta }: { label: string; value: string; meta: string }) {
  return (
    <div className="border border-border-subtle rounded-2xl p-5 bg-surface/30">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-tertiary mb-2">{label}</p>
      <p className="text-3xl font-display font-bold mb-1">{value}</p>
      <p className="text-sm text-text-secondary">{meta}</p>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border-subtle rounded-xl px-3 py-3 bg-canvas/30">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "neutral" | "accent" | "danger";
}) {
  const toneClass =
    tone === "accent"
      ? "bg-accent/10 text-accent border border-accent/30"
      : tone === "danger"
        ? "bg-error/10 text-error border border-error/30"
        : "bg-elevated text-text-secondary border border-border-subtle";

  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${toneClass}`}>
      {label}
    </span>
  );
}

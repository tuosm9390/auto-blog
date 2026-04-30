import { auth } from "@/auth";
import { redirect, Link } from "@/i18n/routing";
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 md:py-16 animate-fade-in-up">
      <section className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent mb-2">
            Projects
          </p>
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-2">
            Track state across active projects
          </h1>
          <p className="text-text-secondary max-w-2xl">
            Portfolio-level view for project progress, drift, blockers, and what needs attention next.
          </p>
        </div>
        <Link
          href="/projects/new"
          className="px-5 py-3 bg-accent text-black font-semibold rounded-lg hover:bg-accent-hover transition-colors"
        >
          New project
        </Link>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
        <SummaryCard label="Active projects" value={String(activeProjects)} meta="Current active portfolio" />
        <SummaryCard label="Blocked" value={String(blockedProjects)} meta="Projects with blockers" />
        <SummaryCard label="High drift" value={String(highDriftProjects)} meta="Projects with 3+ drift items" />
        <SummaryCard label="Needs review" value={String(needsReviewProjects)} meta="Projects without a snapshot" />
      </section>

      {!setupState.ready ? (
        <section className="mb-8 border border-yellow-500/30 rounded-2xl p-5 bg-yellow-500/10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-500 mb-2">
            Setup required
          </p>
          <p className="text-sm text-text-secondary leading-7">
            {setupState.message} After running the SQL, reload this page and create your first project.
          </p>
          <p className="mt-3 text-xs text-text-tertiary">
            SQL file: <span className="text-text-primary">scripts/add-project-memory-core.sql</span>
          </p>
        </section>
      ) : null}

      {projectsWithState.length === 0 ? (
        <section className="border border-border-subtle rounded-2xl p-10 md:p-16 text-center bg-surface/30">
          <div className="text-5xl mb-4 opacity-50">🗂️</div>
          <h2 className="text-2xl font-semibold mb-2">No projects yet</h2>
          <p className="text-text-secondary max-w-xl mx-auto mb-6">
            Create your first project, attach a plan, and start turning GitHub activity into a state board instead of another pile of notes.
          </p>
          <Link
            href="/projects/new"
            className="inline-flex px-6 py-3 bg-accent text-black font-semibold rounded-lg hover:bg-accent-hover transition-colors"
          >
            Create first project
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
                    <StatusPill label={project.status} tone="neutral" />
                    {snapshot?.drift_count ? <StatusPill label={`${snapshot.drift_count} drift`} tone="accent" /> : null}
                    {snapshot?.blocker_count ? <StatusPill label={`${snapshot.blocker_count} blocked`} tone="danger" /> : null}
                  </div>
                  <p className="text-sm text-text-secondary mb-3">
                    {project.current_thesis || project.description || "No current thesis yet"}
                  </p>
                  <div className="text-xs text-text-tertiary flex flex-wrap gap-x-4 gap-y-2">
                    <span>Repo: {project.github_repo_owner && project.github_repo_name ? `${project.github_repo_owner}/${project.github_repo_name}` : "not connected"}</span>
                    <span>Updated: {new Date(project.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-3 lg:w-[420px]">
                  <MetricTile label="Progress" value={snapshot ? `${snapshot.progress_percent}%` : "—"} />
                  <MetricTile label="Phase" value={snapshot?.current_phase || "No snapshot"} />
                  <MetricTile label="Risks" value={snapshot ? String(snapshot.risk_count) : "—"} />
                  <MetricTile label="Watch next" value={snapshot?.watch_next?.[0] || "Refresh state"} />
                </div>
              </div>
            </Link>
          ))}
        </section>
      )}
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

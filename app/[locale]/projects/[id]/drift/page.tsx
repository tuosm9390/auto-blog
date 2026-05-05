import { auth } from "@/auth";
import { redirect, Link } from "@/i18n/routing";
import { getProjectById, getStateSnapshotsByProject } from "@/lib/projects";

export default async function ProjectDriftPage({
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

  const [project, snapshots] = await Promise.all([
    getProjectById(id),
    getStateSnapshotsByProject(id, 2),
  ]);

  if (!project || project.owner_id !== safeUserId) {
    redirect({ href: "/projects", locale });
  }

  const currentProject = project as NonNullable<typeof project>;
  const latestSnapshot = snapshots[0] ?? null;
  const previousSnapshot = snapshots[1] ?? null;
  const driftItems = latestSnapshot?.drift_json ?? [];
  const latestTitles = new Set(
    driftItems.map((item) => ((item as { title?: string }).title || "").trim()).filter(Boolean)
  );
  const previousDriftItems = previousSnapshot?.drift_json ?? [];
  const previousTitles = new Set(
    previousDriftItems
      .map((item) => ((item as { title?: string }).title || "").trim())
      .filter(Boolean)
  );
  const newDriftCount = Array.from(latestTitles).filter((title) => !previousTitles.has(title)).length;
  const resolvedDriftCount = Array.from(previousTitles).filter((title) => !latestTitles.has(title)).length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 md:py-16 animate-fade-in-up">
      <section className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent mb-2">Drift</p>
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-2">
            {currentProject.name}
          </h1>
          <p className="text-text-secondary max-w-3xl">
            Track what changed from the original thesis, why it changed, and what still needs a decision.
          </p>
        </div>
        <Link
          href={`/projects/${currentProject.id}`}
          className="px-5 py-3 border border-border-subtle rounded-lg text-sm text-text-secondary hover:border-border-strong hover:text-text-primary transition-colors text-center"
        >
          Back to state
        </Link>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
        <MetricCard label="Major shifts" value={latestSnapshot ? String(latestSnapshot.drift_count) : "0"} meta="Latest detected drift items" />
        <MetricCard label="New since last" value={String(newDriftCount)} meta="Freshly surfaced changes" />
        <MetricCard label="Resolved" value={String(resolvedDriftCount)} meta="Items that disappeared from drift" />
        <MetricCard label="Current thesis" value={currentProject.current_thesis || "Unset"} meta="Where the project is now" />
        <MetricCard label="Current phase" value={latestSnapshot?.current_phase || "No snapshot"} meta="Latest state context" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr] mb-8">
        <div className="space-y-4">
          <div className="border border-border-subtle rounded-2xl p-6 bg-surface/30">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-lg font-semibold">Changed decisions</h2>
              <span className="text-xs text-text-tertiary">Strategic focus for v1</span>
            </div>

            {driftItems.length > 0 ? (
              <div className="grid gap-4 xl:grid-cols-2">
                {driftItems.map((item, index) => {
                  const driftItem = item as {
                    title?: string;
                    drift_type?: string;
                    original?: string;
                    current?: string;
                    why?: string;
                    evidence_refs?: string[];
                  };
                  return (
                    <article
                      key={`${driftItem.title || "drift"}-${index}`}
                      className="border border-border-subtle rounded-xl p-5 bg-canvas/30"
                    >
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <h3 className="font-semibold">{driftItem.title || "Untitled drift"}</h3>
                        <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent/10 text-accent border border-accent/30">
                          {driftItem.drift_type || "drift"}
                        </span>
                      </div>
                      <div className="space-y-3 text-sm text-text-secondary">
                        <p><span className="text-text-primary font-medium">Original:</span> {driftItem.original || "—"}</p>
                        <p><span className="text-text-primary font-medium">Now:</span> {driftItem.current || "—"}</p>
                        <p><span className="text-text-primary font-medium">Why:</span> {driftItem.why || "—"}</p>
                        <p><span className="text-text-primary font-medium">Evidence:</span> {driftItem.evidence_refs?.join(", ") || "No evidence refs yet"}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-text-secondary leading-7">
                No explicit drift items yet. Run <span className="text-text-primary font-medium">Refresh state</span> from the state page to generate a baseline and future decision changes.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="border border-border-subtle rounded-2xl p-6 bg-surface/30">
            <h2 className="text-lg font-semibold mb-4">Thesis timeline</h2>
            <div className="space-y-4 text-sm">
              <TimelineStep phase="Phase 1" thesis={currentProject.original_thesis || "Original thesis not recorded"} focus="Initial product direction" />
              <TimelineStep phase="Phase 2" thesis={currentProject.current_thesis || "Current thesis not recorded"} focus="Current working direction" />
              <TimelineStep phase="Phase 3" thesis="Next validated thesis" focus="To be confirmed by real usage and drift review" />
            </div>
          </div>

          <div className="border border-border-strong rounded-2xl p-6 bg-accent/5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent mb-3">Current question</p>
            <h2 className="text-xl font-semibold mb-2">
              Can project-state visibility become more valuable than another AI writing tool?
            </h2>
            <p className="text-sm text-text-secondary leading-7">
              This page should answer that question over time by making product-level changes visible, not just generating more text.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="border border-border-subtle rounded-2xl p-6 bg-surface/30">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold">New drift since last refresh</h2>
            <span className="text-xs text-text-tertiary">Snapshot compare</span>
          </div>
          {newDriftCount > 0 ? (
            <div className="space-y-3">
              {driftItems
                .filter((item) => {
                  const title = ((item as { title?: string }).title || "").trim();
                  return title && !previousTitles.has(title);
                })
                .map((item, index) => {
                  const driftItem = item as {
                    title?: string;
                    why?: string;
                  };
                  return (
                    <div key={`${driftItem.title || "new-drift"}-${index}`} className="border border-border-subtle rounded-xl p-4 bg-canvas/30">
                      <p className="font-medium mb-1">{driftItem.title || "Untitled drift"}</p>
                      <p className="text-sm text-text-secondary">{driftItem.why || "No reason recorded"}</p>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-sm text-text-secondary leading-7">
              No newly surfaced drift compared with the previous snapshot.
            </p>
          )}
        </div>

        <div className="border border-border-subtle rounded-2xl p-6 bg-surface/30">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold">Resolved drift since last refresh</h2>
            <span className="text-xs text-text-tertiary">Snapshot compare</span>
          </div>
          {resolvedDriftCount > 0 ? (
            <div className="space-y-3">
              {previousDriftItems
                .filter((item) => {
                  const title = ((item as { title?: string }).title || "").trim();
                  return title && !latestTitles.has(title);
                })
                .map((item, index) => {
                  const driftItem = item as {
                    title?: string;
                    why?: string;
                  };
                  return (
                    <div key={`${driftItem.title || "resolved-drift"}-${index}`} className="border border-border-subtle rounded-xl p-4 bg-canvas/30">
                      <p className="font-medium mb-1">{driftItem.title || "Untitled drift"}</p>
                      <p className="text-sm text-text-secondary">{driftItem.why || "No reason recorded"}</p>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-sm text-text-secondary leading-7">
              No drift items disappeared compared with the previous snapshot.
            </p>
          )}
        </div>
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
      <p className="text-xl font-semibold mb-1 break-words">{value}</p>
      <p className="text-sm text-text-secondary">{meta}</p>
    </div>
  );
}

function TimelineStep({
  phase,
  thesis,
  focus,
}: {
  phase: string;
  thesis: string;
  focus: string;
}) {
  return (
    <div className="border border-border-subtle rounded-xl p-4 bg-canvas/30">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent mb-2">{phase}</p>
      <p className="font-medium mb-1">{thesis}</p>
      <p className="text-text-secondary">{focus}</p>
    </div>
  );
}

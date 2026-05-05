import { auth } from "@/auth";
import { redirect, Link } from "@/i18n/routing";
import { getProjectById, getStateSnapshotsByProject } from "@/lib/projects";
import { getTranslations } from "next-intl/server";

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
  const t = await getTranslations("Projects");

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
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent mb-2">{t("drift.tag")}</p>
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-2">
            {currentProject.name}
          </h1>
          <p className="text-text-secondary max-w-3xl">
            {t("drift.description")}
          </p>
        </div>
        <Link
          href={`/projects/${currentProject.id}`}
          className="px-5 py-3 border border-border-subtle rounded-lg text-sm text-text-secondary hover:border-border-strong hover:text-text-primary transition-colors text-center"
        >
          {t("shared.backToState")}
        </Link>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
        <MetricCard label={t("drift.metrics.majorShifts")} value={latestSnapshot ? String(latestSnapshot.drift_count) : "0"} meta={t("drift.metrics.majorShiftsMeta")} />
        <MetricCard label={t("drift.metrics.newSinceLast")} value={String(newDriftCount)} meta={t("drift.metrics.newSinceLastMeta")} />
        <MetricCard label={t("drift.metrics.resolved")} value={String(resolvedDriftCount)} meta={t("drift.metrics.resolvedMeta")} />
        <MetricCard label={t("drift.metrics.currentThesis")} value={currentProject.current_thesis || t("shared.unset")} meta={t("drift.metrics.currentThesisMeta")} />
        <MetricCard label={t("shared.currentPhase")} value={latestSnapshot?.current_phase || t("shared.noSnapshot")} meta={t("drift.metrics.currentPhaseMeta")} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr] mb-8">
        <div className="space-y-4">
          <div className="border border-border-subtle rounded-2xl p-6 bg-surface/30">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-lg font-semibold">{t("drift.changedDecisions")}</h2>
              <span className="text-xs text-text-tertiary">{t("drift.strategicFocus")}</span>
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
                        <h3 className="font-semibold">{driftItem.title || t("shared.untitledDrift")}</h3>
                        <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent/10 text-accent border border-accent/30">
                          {driftItem.drift_type || t("shared.drift")}
                        </span>
                      </div>
                      <div className="space-y-3 text-sm text-text-secondary">
                        <p><span className="text-text-primary font-medium">{t("shared.original")}:</span> {driftItem.original || "—"}</p>
                        <p><span className="text-text-primary font-medium">{t("shared.now")}:</span> {driftItem.current || "—"}</p>
                        <p><span className="text-text-primary font-medium">{t("shared.why")}:</span> {driftItem.why || "—"}</p>
                        <p><span className="text-text-primary font-medium">{t("shared.evidence")}:</span> {driftItem.evidence_refs?.join(", ") || t("drift.noEvidenceRefs")}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-text-secondary leading-7">
                {t("drift.noExplicitDriftPrefix")} <span className="text-text-primary font-medium">{t("shared.refreshState")}</span> {t("drift.noExplicitDriftSuffix")}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="border border-border-subtle rounded-2xl p-6 bg-surface/30">
            <h2 className="text-lg font-semibold mb-4">{t("drift.thesisTimeline")}</h2>
            <div className="space-y-4 text-sm">
              <TimelineStep phase={t("drift.phase1")} thesis={currentProject.original_thesis || t("drift.originalThesisNotRecorded")} focus={t("drift.initialProductDirection")} />
              <TimelineStep phase={t("drift.phase2")} thesis={currentProject.current_thesis || t("drift.currentThesisNotRecorded")} focus={t("drift.currentWorkingDirection")} />
              <TimelineStep phase={t("drift.phase3")} thesis={t("drift.nextValidatedThesis")} focus={t("drift.nextValidatedThesisMeta")} />
            </div>
          </div>

          <div className="border border-border-strong rounded-2xl p-6 bg-accent/5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent mb-3">{t("drift.currentQuestion")}</p>
            <h2 className="text-xl font-semibold mb-2">
              {t("drift.currentQuestionTitle")}
            </h2>
            <p className="text-sm text-text-secondary leading-7">
              {t("drift.currentQuestionDescription")}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="border border-border-subtle rounded-2xl p-6 bg-surface/30">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold">{t("drift.newSinceLastRefresh")}</h2>
            <span className="text-xs text-text-tertiary">{t("drift.snapshotCompare")}</span>
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
                      <p className="font-medium mb-1">{driftItem.title || t("shared.untitledDrift")}</p>
                      <p className="text-sm text-text-secondary">{driftItem.why || t("drift.noReasonRecorded")}</p>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-sm text-text-secondary leading-7">
              {t("drift.noNewDrift")}
            </p>
          )}
        </div>

        <div className="border border-border-subtle rounded-2xl p-6 bg-surface/30">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold">{t("drift.resolvedSinceLastRefresh")}</h2>
            <span className="text-xs text-text-tertiary">{t("drift.snapshotCompare")}</span>
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
                      <p className="font-medium mb-1">{driftItem.title || t("shared.untitledDrift")}</p>
                      <p className="text-sm text-text-secondary">{driftItem.why || t("drift.noReasonRecorded")}</p>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-sm text-text-secondary leading-7">
              {t("drift.noResolvedDrift")}
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

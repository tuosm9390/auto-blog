// 프로젝트 Evidence 문서 관리 화면을 렌더링한다.
import { auth } from "@/auth";
import {
  applyProjectDocumentAction,
  createProjectDocumentFromTemplateAction,
  generateProjectDocumentDraftAction,
  markProjectDocumentSupersededAction,
  refreshProjectStateAction,
  saveProjectDocumentAction,
} from "@/app/actions/projectActions";
import DocumentCoverageGrid from "@/components/projects/DocumentCoverageGrid";
import ProjectDocumentEditor from "@/components/projects/ProjectDocumentEditor";
import { RefreshStateButton } from "@/components/projects/RefreshStateButton";
import { Link, redirect } from "@/i18n/routing";
import {
  normalizeProjectDocumentType,
} from "@/lib/project-document-templates";
import { buildProjectDocumentViewModels } from "@/lib/project-document-view-models";
import {
  getProjectDocuments,
  getProjectDocumentsSetupState,
} from "@/lib/project-documents";
import {
  getCurrentProjectPlan,
  getLatestStateSnapshot,
  getProjectById,
} from "@/lib/projects";
import type { ProjectDocumentReadiness } from "@/lib/types";
import { getTranslations } from "next-intl/server";

export default async function ProjectDocumentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams?: Promise<{ type?: string }>;
}) {
  const { locale, id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect({ href: "/login", locale });
  }
  const safeUserId = userId as string;

  const [t, project, plan, documentsSetup, documents, latestSnapshot] = await Promise.all([
    getTranslations("Projects"),
    getProjectById(id),
    getCurrentProjectPlan(id),
    getProjectDocumentsSetupState(),
    getProjectDocuments(id),
    getLatestStateSnapshot(id),
  ]);

  if (!project || project.owner_id !== safeUserId) {
    redirect({ href: "/projects", locale });
  }
  const currentProject = project!;

  const selectedType = normalizeProjectDocumentType(resolvedSearchParams?.type) ?? "prd";
  const viewModels = buildProjectDocumentViewModels({
    locale,
    plan,
    documents,
  });
  const selectedDocument = viewModels.find((item) => item.type === selectedType) ?? viewModels[0];
  const appliedCount = viewModels.filter((item) => item.isApplied).length;
  const usableCount = viewModels.filter((item) => item.readiness === "usable").length;
  const staleCount = viewModels.filter((item) => item.readiness === "stale").length;
  const refreshAction = refreshProjectStateAction.bind(null, locale, id);
  const createAction = createProjectDocumentFromTemplateAction.bind(null, locale, id);
  const generateDraftAction = generateProjectDocumentDraftAction.bind(null, locale, id);
  const saveAction = saveProjectDocumentAction.bind(null, locale, id);
  const applyAction = selectedDocument.id
    ? applyProjectDocumentAction.bind(null, locale, id, selectedDocument.id, selectedDocument.type, true)
    : undefined;
  const excludeAction = selectedDocument.id
    ? applyProjectDocumentAction.bind(null, locale, id, selectedDocument.id, selectedDocument.type, false)
    : undefined;
  const supersedeAction = selectedDocument.id
    ? markProjectDocumentSupersededAction.bind(null, locale, id, selectedDocument.id, selectedDocument.type)
    : undefined;

  const readinessLabels: Record<ProjectDocumentReadiness, string> = {
    missing: t("documents.readiness.missing"),
    draft: t("documents.readiness.draft"),
    usable: t("documents.readiness.usable"),
    stale: t("documents.readiness.stale"),
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 md:py-16 animate-fade-in-up">
      {!documentsSetup.ready ? (
        <section className="mb-6 border border-yellow-500/30 rounded-2xl p-5 bg-yellow-500/10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-500 mb-2">
            {t("shared.setupRequired")}
          </p>
          <p className="text-sm text-text-secondary leading-7">{documentsSetup.message}</p>
          <p className="mt-3 text-xs text-text-tertiary">
            {t("shared.runSqlPrefix")} <span className="text-text-primary">scripts/add-project-documents.sql</span> {t("shared.runSqlSuffix")}
          </p>
        </section>
      ) : null}

      <section className="mb-8 flex flex-col xl:flex-row xl:items-end justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent mb-2">
            {t("documents.tag")}
          </p>
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-2">
            {currentProject.name}
          </h1>
          <p className="text-text-secondary max-w-3xl">{t("documents.description")}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3 max-w-3xl">
            <Metric label={t("documents.metrics.usable")} value={`${usableCount}/8`} />
            <Metric label={t("documents.metrics.applied")} value={`${appliedCount}/8`} />
            <Metric label={t("documents.metrics.stale")} value={`${staleCount}`} />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href={`/projects/${id}`}
            className="px-5 py-3 border border-border-subtle rounded-lg text-sm text-text-secondary hover:border-border-strong hover:text-text-primary transition-colors text-center"
          >
            {t("shared.backToState")}
          </Link>
          <form action={refreshAction}>
            <RefreshStateButton
              idleLabel={t("shared.refreshState")}
              pendingLabel={t("shared.refreshingState")}
            />
          </form>
        </div>
      </section>

      <section className="mb-6">
        <DocumentCoverageGrid
          projectId={id}
          selectedType={selectedDocument.type}
          items={viewModels}
          labels={{
            applied: t("documents.applied"),
            notApplied: t("documents.notApplied"),
            updated: t("shared.updated"),
            noContent: t("documents.noContent"),
            readiness: readinessLabels,
          }}
        />
      </section>

      <ProjectDocumentEditor
        key={selectedDocument.type}
        documentType={selectedDocument.type}
        documentId={selectedDocument.id}
        title={selectedDocument.title}
        contentMarkdown={selectedDocument.contentMarkdown}
        label={selectedDocument.label}
        description={selectedDocument.description}
        readiness={selectedDocument.readiness}
        isApplied={selectedDocument.isApplied}
        isPrd={selectedDocument.isPrd}
        signals={selectedDocument.signals}
        saveAction={saveAction}
        createFromTemplateAction={createAction}
        generateDraftAction={generateDraftAction}
        applyAction={applyAction}
        excludeAction={excludeAction}
        supersedeAction={supersedeAction}
        labels={{
          title: t("documents.editor.title"),
          body: t("documents.editor.body"),
          save: t("documents.editor.save"),
          createFromTemplate: t("documents.editor.createFromTemplate"),
          generateDraft: t("documents.editor.generateDraft"),
          generatingDraft: t("documents.editor.generatingDraft"),
          apply: t("documents.editor.apply"),
          exclude: t("documents.editor.exclude"),
          supersede: t("documents.editor.supersede"),
          applied: t("documents.editor.appliedState"),
          prdAlwaysApplied: t("documents.editor.prdAlwaysApplied"),
          analysisSignals: t("documents.editor.analysisSignals"),
          readiness: readinessLabels,
          emptyHint: selectedDocument.id ? t("documents.editor.emptyHint") : t("documents.editor.unsavedDraftHint"),
        }}
      />

      <section className="mt-6 border border-border-subtle rounded-2xl p-5 bg-surface/30">
        <p className="text-sm font-semibold mb-2">{t("documents.latestCoverage")}</p>
        <p className="text-sm leading-6 text-text-secondary">
          {latestSnapshot
            ? t("documents.latestCoverageHint")
            : t("documents.noSnapshotHint")}
        </p>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border-subtle rounded-xl px-4 py-3 bg-surface/40">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1">{label}</p>
      <p className="text-xl font-display font-bold">{value}</p>
    </div>
  );
}

import { Link } from "@/i18n/routing";
import { Project, ProjectPlan } from "@/lib/types";
import { getTranslations } from "next-intl/server";
import { GitHubRepoPicker } from "./GitHubRepoPicker";

interface ProjectEditorFormProps {
  mode: "create" | "edit";
  locale: string;
  action: (formData: FormData) => void | Promise<void>;
  setupMessage?: string;
  project?: Project;
  plan?: ProjectPlan | null;
}

const STATUS_OPTIONS: Array<Project["status"]> = ["active", "paused", "archived"];

export default async function ProjectEditorForm({
  mode,
  locale,
  action,
  setupMessage,
  project,
  plan,
}: ProjectEditorFormProps) {
  const t = await getTranslations("Projects");
  const isEdit = mode === "edit";

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-16 animate-fade-in-up">
      <section className="mb-8 border-b border-border-subtle pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent mb-2">
          {isEdit ? t("editor.editTag") : t("editor.newTag")}
        </p>
        <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-2">
          {isEdit ? t("editor.editTitle") : t("editor.newTitle")}
        </h1>
        <p className="text-text-secondary max-w-2xl">
          {isEdit
            ? t("editor.editDescription")
            : t("editor.newDescription")}
        </p>
      </section>

      {setupMessage ? (
        <section className="mb-6 border border-yellow-500/30 rounded-2xl p-5 bg-yellow-500/10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-500 mb-2">
            {t("shared.setupRequired")}
          </p>
          <p className="text-sm text-text-secondary leading-7">{setupMessage}</p>
          <p className="mt-3 text-xs text-text-tertiary">
            {t("shared.runSqlPrefix")} <span className="text-text-primary">scripts/add-project-memory-core.sql</span> {t("shared.runSqlSuffix")}
          </p>
        </section>
      ) : null}

      <form action={action} className="space-y-6">
        <section className="border border-border-subtle rounded-2xl p-6 space-y-4 bg-surface/30">
          <h2 className="text-lg font-semibold">{t("editor.sections.basics")}</h2>
          <Field
            label={t("editor.fields.projectName")}
            name="name"
            placeholder="synapso.dev"
            defaultValue={project?.name}
            required
          />
          <TextArea
            label={t("editor.fields.description")}
            name="description"
            placeholder={t("editor.placeholders.description")}
            rows={3}
            defaultValue={project?.description ?? ""}
          />
          {isEdit ? (
            <label className="block space-y-2">
              <span className="text-sm font-medium text-text-primary">{t("editor.fields.status")}</span>
              <select
                name="status"
                defaultValue={project?.status ?? "active"}
                className="w-full bg-surface border border-border-subtle rounded-lg px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-border-strong"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {t(`shared.status.${status}`)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </section>

        <section className="border border-border-subtle rounded-2xl p-6 space-y-4 bg-surface/30">
          <h2 className="text-lg font-semibold">{t("editor.sections.thesis")}</h2>
          <Field
            label={t("editor.fields.originalThesis")}
            name="originalThesis"
            placeholder={t("editor.placeholders.originalThesis")}
            defaultValue={project?.original_thesis ?? ""}
          />
          <Field
            label={t("editor.fields.currentThesis")}
            name="currentThesis"
            placeholder={t("editor.placeholders.currentThesis")}
            defaultValue={project?.current_thesis ?? ""}
          />
        </section>

        <section className="border border-border-subtle rounded-2xl p-6 space-y-4 bg-surface/30">
          <h2 className="text-lg font-semibold">{t("editor.sections.repo")}</h2>
          <GitHubRepoPicker
            ownerLabel={t("editor.fields.githubOwner")}
            repoLabel={t("editor.fields.githubRepo")}
            selectLabel={t("editor.repoPicker.select")}
            loadingLabel={t("editor.repoPicker.loading")}
            emptyLabel={t("editor.repoPicker.empty")}
            errorLabel={t("editor.repoPicker.error")}
            manualLabel={t("editor.repoPicker.manual")}
            selectedLabel={t("editor.repoPicker.selected")}
            initialOwner={project?.github_repo_owner}
            initialRepo={project?.github_repo_name}
          />
        </section>

        <section className="border border-border-subtle rounded-2xl p-6 space-y-4 bg-surface/30">
          <h2 className="text-lg font-semibold">{t("editor.sections.plan")}</h2>
          <Field
            label={t("editor.fields.planTitle")}
            name="planTitle"
            placeholder={t("editor.placeholders.planTitle")}
            defaultValue={plan?.title ?? "Current Plan"}
          />
          <TextArea
            label={t("editor.fields.planBody")}
            name="planContentMarkdown"
            placeholder={t("editor.placeholders.planBody")}
            rows={12}
            defaultValue={plan?.content_markdown ?? ""}
          />
          <p className="text-xs text-text-tertiary">
            {t("editor.planHelp")}
          </p>
          <PrdTemplateGuide
            title={t("editor.prdTemplate.title")}
            description={t("editor.prdTemplate.description")}
            checklistTitle={t("editor.prdTemplate.checklistTitle")}
            templateTitle={t("editor.prdTemplate.templateTitle")}
            copyHint={t("editor.prdTemplate.copyHint")}
            checklist={[
              t("editor.prdTemplate.checklist.objective"),
              t("editor.prdTemplate.checklist.users"),
              t("editor.prdTemplate.checklist.scope"),
              t("editor.prdTemplate.checklist.acceptance"),
              t("editor.prdTemplate.checklist.risks"),
            ]}
            template={t("editor.prdTemplate.markdown")}
          />
        </section>

        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <Link
            href={isEdit && project ? `/projects/${project.id}` : "/projects"}
            locale={locale}
            className="px-5 py-3 border border-border-subtle rounded-lg text-sm text-text-secondary hover:border-border-strong hover:text-text-primary transition-colors text-center"
          >
            {t("shared.cancel")}
          </Link>
          <button
            type="submit"
            className="px-6 py-3 bg-accent text-black font-semibold rounded-lg hover:bg-accent-hover transition-colors"
          >
            {isEdit ? t("shared.saveChanges") : t("shared.createProject")}
          </button>
        </div>
      </form>
    </div>
  );
}

function PrdTemplateGuide({
  title,
  description,
  checklistTitle,
  templateTitle,
  copyHint,
  checklist,
  template,
}: {
  title: string;
  description: string;
  checklistTitle: string;
  templateTitle: string;
  copyHint: string;
  checklist: string[];
  template: string;
}) {
  return (
    <div className="rounded-2xl border border-accent/25 bg-accent/5 p-5 space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent mb-2">
          PRD Template
        </p>
        <h3 className="text-base font-semibold text-text-primary">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-text-secondary">{description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-xl border border-border-subtle bg-surface/60 p-4">
          <p className="text-sm font-semibold text-text-primary mb-3">{checklistTitle}</p>
          <ul className="space-y-2 text-sm text-text-secondary">
            {checklist.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-border-subtle bg-background/80 p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="text-sm font-semibold text-text-primary">{templateTitle}</p>
            <p className="text-xs text-text-tertiary">{copyHint}</p>
          </div>
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg bg-black/30 p-4 text-xs leading-5 text-text-secondary">
            {template}
          </pre>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  placeholder,
  defaultValue,
  required = false,
}: {
  label: string;
  name: string;
  placeholder: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-text-primary">{label}</span>
      <input
        required={required}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full bg-surface border border-border-subtle rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border-strong"
      />
    </label>
  );
}

function TextArea({
  label,
  name,
  placeholder,
  rows,
  defaultValue,
}: {
  label: string;
  name: string;
  placeholder: string;
  rows: number;
  defaultValue?: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-text-primary">{label}</span>
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full bg-surface border border-border-subtle rounded-lg px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border-strong resize-none"
      />
    </label>
  );
}

import { Link } from "@/i18n/routing";
import { Project, ProjectPlan } from "@/lib/types";

interface ProjectEditorFormProps {
  mode: "create" | "edit";
  locale: string;
  action: (formData: FormData) => void | Promise<void>;
  setupMessage?: string;
  project?: Project;
  plan?: ProjectPlan | null;
}

const STATUS_OPTIONS: Array<Project["status"]> = ["active", "paused", "archived"];

export default function ProjectEditorForm({
  mode,
  locale,
  action,
  setupMessage,
  project,
  plan,
}: ProjectEditorFormProps) {
  const isEdit = mode === "edit";

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-16 animate-fade-in-up">
      <section className="mb-8 border-b border-border-subtle pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent mb-2">
          {isEdit ? "Edit project" : "New project"}
        </p>
        <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-2">
          {isEdit ? "Update this project state board" : "Create a project state board"}
        </h1>
        <p className="text-text-secondary max-w-2xl">
          {isEdit
            ? "Adjust the current thesis, repo connection, and working plan as the project changes."
            : "Start with one project, one current thesis, and one plan. The goal is not perfect structure. The goal is a project you can actually track."}
        </p>
      </section>

      {setupMessage ? (
        <section className="mb-6 border border-yellow-500/30 rounded-2xl p-5 bg-yellow-500/10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-500 mb-2">
            Setup required
          </p>
          <p className="text-sm text-text-secondary leading-7">{setupMessage}</p>
          <p className="mt-3 text-xs text-text-tertiary">
            Run <span className="text-text-primary">scripts/add-project-memory-core.sql</span> first, then come back here.
          </p>
        </section>
      ) : null}

      <form action={action} className="space-y-6">
        <section className="border border-border-subtle rounded-2xl p-6 space-y-4 bg-surface/30">
          <h2 className="text-lg font-semibold">Project basics</h2>
          <Field
            label="Project name"
            name="name"
            placeholder="synapso.dev"
            defaultValue={project?.name}
            required
          />
          <TextArea
            label="Description"
            name="description"
            placeholder="One-line context for what this project is trying to become."
            rows={3}
            defaultValue={project?.description ?? ""}
          />
          {isEdit ? (
            <label className="block space-y-2">
              <span className="text-sm font-medium text-text-primary">Status</span>
              <select
                name="status"
                defaultValue={project?.status ?? "active"}
                className="w-full bg-surface border border-border-subtle rounded-lg px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-border-strong"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </section>

        <section className="border border-border-subtle rounded-2xl p-6 space-y-4 bg-surface/30">
          <h2 className="text-lg font-semibold">Product thesis</h2>
          <Field
            label="Original thesis"
            name="originalThesis"
            placeholder="AI-powered tech blog generator"
            defaultValue={project?.original_thesis ?? ""}
          />
          <Field
            label="Current thesis"
            name="currentThesis"
            placeholder="PRD-aware project memory for AI-native builders"
            defaultValue={project?.current_thesis ?? ""}
          />
        </section>

        <section className="border border-border-subtle rounded-2xl p-6 space-y-4 bg-surface/30">
          <h2 className="text-lg font-semibold">Repository connection</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field
              label="GitHub owner"
              name="githubRepoOwner"
              placeholder="tuosm9390"
              defaultValue={project?.github_repo_owner ?? ""}
            />
            <Field
              label="GitHub repo"
              name="githubRepoName"
              placeholder="auto-blog"
              defaultValue={project?.github_repo_name ?? ""}
            />
          </div>
        </section>

        <section className="border border-border-subtle rounded-2xl p-6 space-y-4 bg-surface/30">
          <h2 className="text-lg font-semibold">Current plan</h2>
          <Field
            label="Plan title"
            name="planTitle"
            placeholder="Current Plan"
            defaultValue={plan?.title ?? "Current Plan"}
          />
          <TextArea
            label="Plan / PRD"
            name="planContentMarkdown"
            placeholder="Paste the current PRD or working plan here. Even a rough markdown draft is enough for Sprint 1."
            rows={12}
            defaultValue={plan?.content_markdown ?? ""}
          />
          <p className="text-xs text-text-tertiary">
            Empty is allowed. You can keep the project first and refine the plan later.
          </p>
        </section>

        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <Link
            href={isEdit && project ? `/projects/${project.id}` : "/projects"}
            locale={locale}
            className="px-5 py-3 border border-border-subtle rounded-lg text-sm text-text-secondary hover:border-border-strong hover:text-text-primary transition-colors text-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="px-6 py-3 bg-accent text-black font-semibold rounded-lg hover:bg-accent-hover transition-colors"
          >
            {isEdit ? "Save changes" : "Create project"}
          </button>
        </div>
      </form>
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

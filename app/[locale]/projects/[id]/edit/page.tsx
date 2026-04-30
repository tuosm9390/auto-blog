import { auth } from "@/auth";
import ProjectEditorForm from "@/components/projects/ProjectEditorForm";
import { updateProjectAction } from "@/app/actions/projectActions";
import {
  getCurrentProjectPlan,
  getProjectById,
  getProjectMemorySetupState,
} from "@/lib/projects";
import { redirect } from "@/i18n/routing";

export default async function EditProjectPage({
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

  const [project, plan, setupState] = await Promise.all([
    getProjectById(id),
    getCurrentProjectPlan(id),
    getProjectMemorySetupState(),
  ]);

  if (!project || project.owner_id !== safeUserId) {
    redirect({ href: "/projects", locale });
  }
  const currentProject = project as NonNullable<typeof project>;

  const updateAction = updateProjectAction.bind(null, locale, id);

  return (
    <ProjectEditorForm
      mode="edit"
      locale={locale}
      action={updateAction}
      setupMessage={setupState.ready ? undefined : setupState.message}
      project={currentProject}
      plan={plan}
    />
  );
}

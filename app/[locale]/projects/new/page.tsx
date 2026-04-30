import { auth } from "@/auth";
import { redirect } from "@/i18n/routing";
import { createProjectAction } from "@/app/actions/projectActions";
import { getProjectMemorySetupState } from "@/lib/projects";
import ProjectEditorForm from "@/components/projects/ProjectEditorForm";

export default async function NewProjectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect({ href: "/login", locale });
  }

  const setupState = await getProjectMemorySetupState();
  const createAction = createProjectAction.bind(null, locale);

  return (
    <ProjectEditorForm
      mode="create"
      locale={locale}
      action={createAction}
      setupMessage={setupState.ready ? undefined : setupState.message}
    />
  );
}

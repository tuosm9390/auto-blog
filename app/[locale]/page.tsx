import { auth } from "@/auth";
import { redirect } from "@/i18n/routing";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const s = await auth();
  if (!s) redirect({ href: "/about", locale });
  redirect({ href: "/projects", locale });
}

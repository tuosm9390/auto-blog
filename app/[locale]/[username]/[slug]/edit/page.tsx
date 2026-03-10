import { notFound, redirect } from "next/navigation";
import { getPostByUsernameAndSlug } from "@/lib/posts";
import { auth } from "@/auth";
import EditForm from "@/components/EditForm";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string; username: string; slug: string }>;
}

export default async function EditPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.username) {
    redirect("/");
  }

  const { username, slug: encodedSlug } = await params;
  const slug = decodeURIComponent(encodedSlug);
  const plainUsername = decodeURIComponent(username).replace(/^@/, "");
  const t = await getTranslations("Edit");

  // 권한 체크
  if (session.user.username !== plainUsername) {
    redirect("/");
  }

  const post = await getPostByUsernameAndSlug(plainUsername, slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 md:py-16 animate-fade-in-up">
      <h1 className="text-3xl font-display font-bold mb-2">{t("title")}</h1>
      <p className="text-text-secondary mb-8">
        {t("desc", { title: post.title })}
      </p>

      <EditForm post={post} />
    </div>
  );
}

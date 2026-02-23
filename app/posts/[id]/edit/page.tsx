import { notFound, redirect } from "next/navigation";
import { getPostById } from "@/lib/posts";
import { auth } from "@/auth";
import EditForm from "@/components/EditForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPage({ params }: PageProps) {
  const session = await auth();
  if (!session) {
    redirect("/");
  }

  const { id } = await params;
  const post = await getPostById(id);

  if (!post) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 md:py-16 animate-fade-in-up">
      <h1 className="text-3xl font-display font-bold mb-2">포스트 수정</h1>
      <p className="text-text-secondary mb-8">
        {post.title} 글을 수정합니다.
      </p>

      <EditForm post={post} />
    </div>
  );
}

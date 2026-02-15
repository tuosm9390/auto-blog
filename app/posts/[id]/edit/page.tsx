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
    <div className="generate-page animate-in">
      <h1 className="generate-page__title">포스트 수정</h1>
      <p className="generate-page__subtitle">
        {post.title} 글을 수정합니다.
      </p>

      <EditForm post={post} />
    </div>
  );
}

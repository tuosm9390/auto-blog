import { notFound, redirect } from "next/navigation";
import { getPostByUsernameAndSlug } from "@/lib/posts";
import { auth } from "@/auth";
import EditForm from "@/components/EditForm";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ username: string; slug: string }>;
}

export default async function EditPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.username) {
    redirect("/");
  }

  const { username, slug } = await params;
  const plainUsername = decodeURIComponent(username).replace(/^@/, "");

  // 권한 체크: 다른 사람의 포스트 수정 페이지 접근 차단
  if (session.user.username !== plainUsername) {
    redirect("/");
  }

  const post = await getPostByUsernameAndSlug(plainUsername, slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 md:py-16 animate-fade-in-up">
      <h1 className="text-3xl font-display font-bold mb-2">포스트 수정</h1>
      <p className="text-text-secondary mb-8">
        {post.title} 글을 수정합니다.
      </p>

      {/* EditForm 내부 구조는 postId에 의존하므로 그대로 전달 */}
      <EditForm post={post} />
    </div>
  );
}

import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostById } from "@/lib/posts";
import PostContent from "@/components/PostContent";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Metadata } from "next";
import { auth } from "@/auth";
import PostControls from "@/components/PostControls";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) return { title: "포스트를 찾을 수 없습니다" };
  return {
    title: `${post.title} — AutoBlog`,
    description: post.summary,
  };
}

export default async function PostPage({ params }: PageProps) {
  const session = await auth();
  const { id } = await params;
  const post = await getPostById(id);

  if (!post) {
    notFound();
  }

  const formattedDate = post.date
    ? format(new Date(post.date), "yyyy년 M월 d일 HH:mm", { locale: ko })
    : "";

  return (
    <article className="max-w-3xl mx-auto px-4 py-12 md:py-16 animate-fade-in-up">
      <Link href="/posts" className="inline-flex items-center gap-1 text-sm text-text-tertiary hover:text-text-secondary transition-colors mb-8">
        ← 모든 포스트
      </Link>

      <div className="flex items-center gap-3 text-xs text-text-tertiary mb-4">
        <span>{formattedDate}</span>
        {post.repo && (
          <span className="px-2 py-0.5 border border-border-subtle rounded-full">{post.repo}</span>
        )}
      </div>

      <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-4">{post.title}</h1>

      <p className="text-lg text-text-secondary mb-6 leading-relaxed">{post.summary}</p>

      {post.tags.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-8">
          {post.tags.map((tag) => (
            <span key={tag} className="px-2 py-1 border border-border-subtle rounded-full text-xs text-text-tertiary">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {post.commits.length > 0 && post.repo && (
        <div className="border border-border-subtle rounded-xl p-4 mb-8 bg-surface/50">
          <div className="text-xs text-text-tertiary uppercase tracking-wider mb-3">관련 커밋</div>
          <div className="flex gap-2 flex-wrap">
            {post.commits.map((sha) => (
              <a
                key={sha}
                href={`https://github.com/${post.repo}/commit/${sha}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-1 bg-elevated rounded font-mono text-xs text-text-secondary hover:text-accent transition-colors"
              >
                {sha.substring(0, 7)}
              </a>
            ))}
          </div>
        </div>
      )}

      <PostContent content={post.content} />

      {session && <PostControls postId={id} />}
    </article>
  );
}

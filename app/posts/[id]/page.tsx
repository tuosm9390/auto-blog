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
    <article className="post-detail animate-in">
      <Link href="/" className="post-detail__back">
        ← 모든 포스트
      </Link>

      <div className="post-detail__meta">
        <span className="post-card__date">{formattedDate}</span>
        {post.repo && <span className="post-card__repo">{post.repo}</span>}
      </div>

      <h1 className="post-detail__title">{post.title}</h1>

      <p className="post-detail__summary">{post.summary}</p>

      {post.tags.length > 0 && (
        <div className="post-card__tags" style={{ marginBottom: 32 }}>
          {post.tags.map((tag) => (
            <span key={tag} className="tag">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {post.commits.length > 0 && post.repo && (
        <div className="post-detail__commits">
          <div className="post-detail__commits-title">관련 커밋</div>
          {post.commits.map((sha) => (
            <a
              key={sha}
              href={`https://github.com/${post.repo}/commit/${sha}`}
              target="_blank"
              rel="noopener noreferrer"
              className="post-detail__commit-link"
            >
              {sha.substring(0, 7)}
            </a>
          ))}
        </div>
      )}

      <PostContent content={post.content} />

      {session && <PostControls postId={id} />}
    </article>
  );
}

import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostByUsernameAndSlug } from "@/lib/posts";
import { getProfileByUsername } from "@/lib/profiles";
import PostContent from "@/components/PostContent";
import UserProfileBox from "@/components/UserProfileBox";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Metadata } from "next";
import { auth } from "@/auth";
import PostControls from "@/components/PostControls";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import { TIER_LIMITS } from "@/lib/subscription";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ username: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username, slug } = await params;
  // URL 인코딩 처리된 username(예: @hong) 복원 로직 추가 (필요 없을 시 그대로 진행)
  const plainUsername = decodeURIComponent(username).replace(/^@/, "");

  const post = await getPostByUsernameAndSlug(plainUsername, slug);
  if (!post) return { title: "포스트를 찾을 수 없습니다" };
  return {
    title: `${post.title} — ${plainUsername}`,
    description: post.summary,
    keywords: post.tags,
    openGraph: {
      title: post.title,
      description: post.summary,
      type: "article",
      publishedTime: post.date,
      authors: [plainUsername],
      tags: post.tags,
    },
  };
}

export default async function PostPage({ params }: PageProps) {
  const session = await auth();
  const { username, slug } = await params;
  const plainUsername = decodeURIComponent(username).replace(/^@/, "");

  const post = await getPostByUsernameAndSlug(plainUsername, slug);
  // 프로필 데이터도 함께 패치
  let profile = await getProfileByUsername(plainUsername);
  if (!profile) {
    profile = {
      id: "unknown",
      username: plainUsername,
      name: plainUsername,
      avatar_url: null,
      bio: null,
      updated_at: new Date().toISOString()
    };
  }

  // Free 티어 사용자 포스트에는 워터마크 표시
  const authorTier = profile.subscription_tier || "free";
  const showWatermark = TIER_LIMITS[authorTier as keyof typeof TIER_LIMITS]?.watermark ?? true;

  if (!post) {
    notFound();
  }

  const formattedDate = post.date
    ? format(new Date(post.date), "yyyy년 M월 d일 HH:mm", { locale: ko })
    : "";

  const isOwner = session?.user?.username === plainUsername;

  return (
    <article className="max-w-3xl mx-auto px-4 py-12 md:py-16 animate-fade-in-up">
      {/* 상단 네비게이션 행: 뒤로 가기 + 작성자 전용 수정/삭제 버튼 */}
      <div className="flex items-center justify-between mb-8">
        <Link href={`/@${plainUsername}`} className="inline-flex items-center gap-1 text-sm text-text-tertiary hover:text-text-secondary transition-colors">
          ← @{plainUsername}의 블로그
        </Link>
        {isOwner && (
          <PostControls postId={post.id} username={plainUsername} slug={slug} variant="top" />
        )}
      </div>

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

      {/* Free 티어 워터마크 */}
      {showWatermark && (
        <div className="mt-10 pt-6 border-t border-border-subtle flex items-center justify-between">
          <p className="text-xs text-text-tertiary">
            이 글은{" "}
            <a href="/" className="text-accent hover:text-accent-hover transition-colors font-medium">
              AutoBlog
            </a>
            로 자동 생성되었습니다.
          </p>
          <a
            href="/pricing"
            className="text-xs text-text-tertiary hover:text-text-secondary transition-colors"
          >
            워터마크 없애기 →
          </a>
        </div>
      )}

      {/* 작성자 프로필 정보 (Compact) */}
      <UserProfileBox profile={profile} variant="compact" />

      {/* 권한 판별: 로그인된 계정과 작성자가 같을 때만 하단 컨트롤 노출 */}
      {isOwner && <PostControls postId={post.id} username={plainUsername} slug={slug} />}

      {/* 맨 위로 이동 버튼 (모바일/전체 화면) */}
      <ScrollToTopButton />
    </article>
  );
}

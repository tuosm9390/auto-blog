import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing";
import { getPostByUsernameAndSlug } from "@/lib/posts";
import { getProfileByUsername } from "@/lib/profiles";
import PostContent from "@/components/PostContent";
import UserProfileBox from "@/components/UserProfileBox";
import { format } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import { Metadata } from "next";
import { auth } from "@/auth";
import PostControls from "@/components/PostControls";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import { TIER_LIMITS } from "@/lib/subscription";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string; username: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username, slug } = await params;
  const plainUsername = decodeURIComponent(username).replace(/^@/, "");

  const post = await getPostByUsernameAndSlug(plainUsername, slug);
  if (!post) return { title: "Post not found" };
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
  const { locale, username, slug } = await params;
  const plainUsername = decodeURIComponent(username).replace(/^@/, "");
  const t = await getTranslations("PostDetail");

  const post = await getPostByUsernameAndSlug(plainUsername, slug);
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

  const authorTier = profile.subscription_tier || "free";
  const showWatermark = TIER_LIMITS[authorTier as keyof typeof TIER_LIMITS]?.watermark ?? true;

  if (!post) {
    notFound();
  }

  const dateLocale = locale === 'ko' ? ko : enUS;
  const dateFormat = locale === 'ko' ? "yyyy년 M월 d일 HH:mm" : "MMM d, yyyy HH:mm";

  const formattedDate = post.date
    ? format(new Date(post.date), dateFormat, { locale: dateLocale })
    : "";

  const isOwner = session?.user?.username === plainUsername;

  return (
    <article className="max-w-3xl mx-auto px-4 py-12 md:py-16 animate-fade-in-up">
      {/* 상단 네비게이션 */}
      <div className="flex items-center justify-between mb-8">
        <Link href={`/@${plainUsername}`} className="inline-flex items-center gap-1 text-sm text-text-tertiary hover:text-text-secondary transition-colors">
          ← @{plainUsername}{t("backToBlog")}
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
          <div className="text-xs text-text-tertiary uppercase tracking-wider mb-3">{t("relatedCommits")}</div>
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
            {t.rich("watermark", {
              link: (chunks) => <a href="/" className="text-accent hover:text-accent-hover transition-colors font-medium">Synapso.dev</a>
            })}
          </p>
          <Link
            href="/pricing"
            className="text-xs text-text-tertiary hover:text-text-secondary transition-colors"
          >
            {t("removeWatermark")}
          </Link>
        </div>
      )}

      <UserProfileBox profile={profile} variant="compact" />

      {isOwner && <PostControls postId={post.id} username={plainUsername} slug={slug} />}

      <ScrollToTopButton />
    </article>
  );
}

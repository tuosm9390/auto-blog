import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing";
import { getDemoPostBySlug } from "@/lib/demo";
import DemoPostContent from "@/components/demo/DemoPostContent";
import { format } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import { Metadata } from "next";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import { getTranslations } from "next-intl/server";
import { PageContainer } from "@/components/ui/PageContainer";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug: encodedSlug } = await params;
  const slug = decodeURIComponent(encodedSlug);

  const post = await getDemoPostBySlug(slug);
  if (!post) return { title: "Post not found" };
  
  return {
    title: `${post.title} — AI Tech Blog Demo`,
    description: post.summary,
    keywords: post.tags,
  };
}

export default async function DemoPostPage({ params }: PageProps) {
  const { locale, slug: encodedSlug } = await params;
  const slug = decodeURIComponent(encodedSlug);

  const [t, post, commonT] = await Promise.all([
    getTranslations("PostDetail"),
    getDemoPostBySlug(slug),
    getTranslations("Common")
  ]);

  if (!post) {
    notFound();
  }

  const dateLocale = locale === "ko" ? ko : enUS;
  const dateFormat = locale === "ko" ? "yyyy.MM.dd" : "MMM d, yyyy";

  const formattedDate = post.date
    ? format(new Date(post.date), dateFormat, { locale: dateLocale })
    : "";

  return (
    <PageContainer>
      <article className="max-w-3xl mx-auto px-4 py-12 md:py-16 animate-fade-in-up">
        {/* 상단 네비게이션: 뒤로 가기만 노출 */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/demo"
            className="inline-flex items-center gap-1 text-sm text-text-tertiary hover:text-text-secondary transition-colors"
          >
            ← {commonT("back")}
          </Link>
        </div>

        <div className="flex items-center gap-3 text-xs text-text-tertiary mb-4">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span className="font-bold uppercase tracking-wider text-accent/80">Demo</span>
          </div>
          <span>{formattedDate}</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-4">
          {post.title}
        </h1>

        <p className="text-lg text-text-secondary mb-6 leading-relaxed">
          {post.summary}
        </p>

        {post.tags.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-8">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 border border-border-subtle rounded-full text-xs text-text-tertiary"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* 관련 커밋: 텍스트로만 표시 (보안 및 마케팅 용도) */}
        {post.commits.length > 0 && (
          <div className="border border-border-subtle rounded-xl p-4 mb-8 bg-surface/50">
            <div className="text-xs text-text-tertiary uppercase tracking-wider mb-3">
              {t("relatedCommits")} (Sample)
            </div>
            <div className="flex gap-2 flex-wrap">
              {post.commits.map((sha) => (
                <span
                  key={sha}
                  className="px-2 py-1 bg-elevated rounded font-mono text-xs text-text-secondary"
                >
                  {sha.substring(0, 7)}
                </span>
              ))}
            </div>
          </div>
        )}

        <DemoPostContent content={post.content} />

        {/* 전환 유도 하단 바 */}
        <div className="mt-16 p-8 border border-accent/20 rounded-3xl bg-accent/5 text-center">
          <h3 className="text-xl font-bold mb-3">나의 코드로 이런 포스트를 만들고 싶나요?</h3>
          <p className="text-text-secondary mb-6">지금 바로 시작해서 AI의 마법을 경험해보세요.</p>
          <Link
            href="/generate"
            className="inline-flex items-center justify-center px-8 py-3 bg-accent text-white font-bold rounded-full hover:bg-accent-hover transition-all"
          >
            ✦ 지금 시작하기
          </Link>
        </div>

        <ScrollToTopButton />
      </article>
    </PageContainer>
  );
}

import { Link } from "@/i18n/routing";
import { auth } from "@/auth";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";

  return {
    title: isEn
      ? "AI-native project memory | Synapso.dev"
      : "AI-native 프로젝트 메모리 | Synapso.dev",
    description: isEn
      ? "Track project progress, blockers, risks, and drift from your PRD and GitHub activity."
      : "PRD와 GitHub 활동을 연결해 프로젝트 진행률, 막힘, 리스크, 드리프트를 추적합니다.",
  };
}

export default async function LandingPage({
  params,
}: {
  params: { locale: string };
}) {
  const session = await auth();
  const t = await getTranslations("About");
  await params;

  // CTA 텍스트 및 링크 결정
  const ctaText = !session ? t("ctaFree") : t("ctaManage");
  const ctaHref = !session ? "/login" : "/projects/new";

  return (
    <div className="max-w-6xl mx-auto px-4 animate-fade-in-up">
      {/* Hero */}
      <section className="flex flex-col items-center text-center py-24 md:py-32">
        <span className="inline-block px-3 py-1 border border-border-subtle rounded-full text-xs tracking-widest text-text-tertiary uppercase mb-6">
          {t("heroTag")}
        </span>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight leading-tight mb-6 whitespace-pre-line">
          {t("heroTitle1")}
          <br />
          <span className="text-text-secondary">{t("heroTitle2")}</span>
        </h1>
        <p className="max-w-2xl text-text-secondary text-lg md:text-xl mb-10 leading-relaxed font-body whitespace-pre-line">
          {t("heroDesc")}
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Link
            href={ctaHref}
            className="px-8 py-3 bg-accent text-black font-semibold rounded-lg hover:bg-accent-hover transition-colors"
          >
            {ctaText}
          </Link>
          <Link
            href="/how-it-works"
            className="px-8 py-3 border border-border-strong rounded-lg text-text-secondary hover:text-text-primary hover:border-text-primary transition-all"
          >
            {t("ctaHow")}
          </Link>
        </div>
      </section>

      {/* [NEW] Project Introduction Section (비로그인 전용) */}
      {!session && (
        <section className="py-24 border-t border-border-subtle">
          <div className="max-w-3xl mx-auto space-y-16">
            {/* 인사의 글 */}
            <div>
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-6 flex items-center gap-3">
                {t("introTitle")}
              </h2>
              <p className="text-text-secondary leading-relaxed text-lg italic border-l-2 border-accent/30 pl-6">
                &quot;{t("introContent")}&quot;
              </p>
            </div>

            {/* 설계 배경 */}
            <div>
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-6 flex items-center gap-3">
                {t("backgroundTitle")}
              </h2>
              <p className="text-text-primary leading-relaxed text-lg mb-4">
                &quot;{t("backgroundQuote")}&quot;
              </p>
              <p className="text-text-secondary leading-relaxed">
                {t.rich("backgroundContent", {
                  important: (chunks) => (
                    <strong className="text-text-primary">{chunks}</strong>
                  ),
                })}
              </p>
            </div>

            {/* 특징 및 차별점 */}
            <div className="bg-surface border border-border-subtle rounded-3xl p-8 md:p-12 shadow-sm">
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-8">
                {t("diffTitle")}
              </h2>
              <div className="grid gap-8">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-accent/20 flex-shrink-0 flex items-center justify-center text-accent text-xs font-bold">
                      {i}
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary mb-1">
                        {t(`diff${i}Title` as any)}
                      </h3>
                      <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                        {t(`diff${i}Desc` as any)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 비전 */}
            <div className="text-center py-12">
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-6">
                {t("visionTitle")}
              </h2>
              <p className="text-xl text-text-primary font-medium tracking-tight">
                &quot;{t("visionQuote")}&quot;
              </p>
              <p className="max-w-xl mx-auto mt-4 text-text-secondary">
                {t("visionContent")}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Features (기존 요약 카드) */}
      <section className="py-16 border-t border-border-subtle">
        <h2 className="text-2xl md:text-3xl font-display font-semibold text-center mb-12">
          {t("whyTitle")}
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: "⚡", title: t("feature1Title"), desc: t("feature1Desc") },
            { icon: "🧠", title: t("feature2Title"), desc: t("feature2Desc") },
            { icon: "✍️", title: t("feature3Title"), desc: t("feature3Desc") },
          ].map((f) => (
            <div
              key={f.title}
              className="border border-border-subtle rounded-xl p-6 hover:bg-surface hover:border-border-strong transition-all duration-300"
            >
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Proof */}
      <section className="py-24 border-t border-border-subtle overflow-hidden">
        <div className="text-center mb-16 px-4">
          <span className="inline-block px-3 py-1 border border-border-subtle rounded-full text-xs tracking-widest text-text-tertiary uppercase mb-4">
            {t("proofTag")}
          </span>
          <h2 className="text-2xl md:text-3xl font-display font-semibold mb-4">
            {t("proofTitle")}
          </h2>
          <p className="text-text-secondary max-w-xl mx-auto">
            {t("proofDesc")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="border border-border-subtle rounded-2xl p-6 bg-surface/50 hover:bg-surface hover:border-border-strong transition-all duration-300"
            >
              <p className="text-xs text-accent font-mono mb-3">
                0{i}
              </p>
              <h3 className="text-lg font-semibold mb-3">
                {t(`proof${i}Title` as any)}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                {t(`proof${i}Desc` as any)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 border-t border-border-subtle text-center">
        <h2 className="text-2xl md:text-3xl font-display font-semibold mb-4">
          {t("ctaTitle")}
        </h2>
        <p className="text-text-secondary mb-8 max-w-xl mx-auto whitespace-pre-line">
          {session ? t("ctaDescAuth") : t("ctaDescGuest")}
        </p>
        <Link
          href={ctaHref}
          className="inline-block px-10 py-4 bg-accent text-black font-semibold rounded-lg hover:bg-accent-hover transition-colors text-lg"
        >
          {ctaText}
        </Link>
      </section>
    </div>
  );
}

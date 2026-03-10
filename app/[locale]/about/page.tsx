import { Link } from "@/i18n/routing";
import { auth } from "@/auth";
import { getTranslations } from "next-intl/server";
import { reviewsKo, reviewsEn } from "../data/reviews";

export default async function LandingPage({ params }: { params: { locale: string } }) {
  const session = await auth();
  const t = await getTranslations("About");
  const { locale } = await params;

  

  const reviews = locale === 'ko' ? reviewsKo : reviewsEn;

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
          {t("heroTitle2Prefix")} <span className="text-text-secondary">AI</span>{t("heroTitle2Suffix")}
        </h1>
        <p className="max-w-2xl text-text-secondary text-lg md:text-xl mb-10 leading-relaxed font-body whitespace-pre-line">
          {t("heroDesc")}
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Link
            href={session ? "/" : "/login"}
            className="px-8 py-3 bg-accent text-black font-semibold rounded-lg hover:bg-accent-hover transition-colors"
          >
            {session ? t("ctaPosts") : t("ctaStart")}
          </Link>
          <Link
            href="/how-it-works"
            className="px-8 py-3 border border-border-strong rounded-lg text-text-secondary hover:text-text-primary hover:border-text-primary transition-all"
          >
            {t("ctaHow")}
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 border-t border-border-subtle">
        <h2 className="text-2xl md:text-3xl font-display font-semibold text-center mb-12">
          {t("whyTitle")}
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: "⚡",
              title: t("feature1Title"),
              desc: t("feature1Desc"),
            },
            {
              icon: "🧠",
              title: t("feature2Title"),
              desc: t("feature2Desc"),
            },
            {
              icon: "✍️",
              title: t("feature3Title"),
              desc: t("feature3Desc"),
            },
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

      {/* Reviews (Marquee) */}
      <section className="py-24 border-t border-border-subtle overflow-hidden">
        <div className="text-center mb-16 px-4">
          <span className="inline-block px-3 py-1 border border-border-subtle rounded-full text-xs tracking-widest text-text-tertiary uppercase mb-4">
            {t("testimonialsTag")}
          </span>
          <h2 className="text-2xl md:text-3xl font-display font-semibold mb-4">
            {t("testimonialsTitle")}
          </h2>
          <p className="text-text-secondary max-w-xl mx-auto">
            {t("testimonialsDesc")}
          </p>
        </div>

        <div className="relative space-y-6 pause-on-hover">
          <div className="flex select-none gap-6 animate-marquee whitespace-nowrap">
            {[...reviews, ...reviews].map(
              (review, idx) => (
                <div
                  key={idx}
                  className="w-[400px] flex-shrink-0 border border-border-subtle rounded-2xl p-6 bg-surface/50 hover:bg-surface hover:border-border-strong transition-all duration-300"
                >
                  <p className="text-text-primary text-sm leading-relaxed mb-4 whitespace-normal line-clamp-3">
                    &quot;{review.quote}&quot;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-elevated border border-border-subtle flex items-center justify-center">
                      <span className="text-text-tertiary text-xs">✦</span>
                    </div>
                    <span className="text-xs font-semibold text-text-tertiary">
                      {review.role}
                    </span>
                  </div>
                </div>
              ),
            )}
          </div>
          
          <div className="flex select-none gap-6 animate-marquee-reverse whitespace-nowrap">
            {[...reviews, ...reviews].map(
              (review, idx) => (
                <div
                  key={idx + 100}
                  className="w-[400px] flex-shrink-0 border border-border-subtle rounded-2xl p-6 bg-surface/50 hover:bg-surface hover:border-border-strong transition-all duration-300"
                >
                  <p className="text-text-primary text-sm leading-relaxed mb-4 whitespace-normal line-clamp-3">
                    &quot;{review.quote}&quot;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-elevated border border-border-subtle flex items-center justify-center">
                      <span className="text-text-tertiary text-xs">✦</span>
                    </div>
                    <span className="text-xs font-semibold text-text-tertiary">
                      {review.role}
                    </span>
                  </div>
                </div>
              ),
            )}
          </div>

          <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-canvas to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-canvas to-transparent z-10" />
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
          href={session ? "/" : "/login"}
          className="inline-block px-10 py-4 bg-accent text-black font-semibold rounded-lg hover:bg-accent-hover transition-colors text-lg"
        >
          {session ? t("ctaManage") : t("ctaFree")}
        </Link>
      </section>
    </div>
  );
}

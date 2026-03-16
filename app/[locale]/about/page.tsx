import { Link } from "@/i18n/routing";
import { auth } from "@/auth";
import { getTranslations } from "next-intl/server";
import { reviewsKo, reviewsEn } from "../data/reviews";

export default async function LandingPage({ params }: { params: { locale: string } }) {
  const session = await auth();
  const t = await getTranslations("About");
  const { locale } = await params;

  const role = (session?.user as any)?.role || 'user';
  const isPrivileged = role === 'admin' || role === 'tester';
  
  // CTA 텍스트 및 링크 결정
  const ctaText = !session ? t("ctaFree") : isPrivileged ? t("ctaManage") : t("ctaTesterApply");
  const ctaHref = !session ? "/login" : isPrivileged ? "/jobs" : "/tester-apply";

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

      {/* [NEW] Project Introduction Section (일반 유저/비로그인 전용) */}
      {!isPrivileged && (
        <section className="py-24 border-t border-border-subtle">
          <div className="max-w-3xl mx-auto space-y-16">
            {/* 인사의 글 */}
            <div>
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-6 flex items-center gap-3">
                <span className="text-accent">01.</span> 인사의 글
              </h2>
              <p className="text-text-secondary leading-relaxed text-lg italic border-l-2 border-accent/30 pl-6">
                "안녕하세요. 개발자의 생산성을 극대화하기 위한 도구를 만드는 Synapso(시냅소) 팀입니다. 코드를 짜는 시간만큼이나 그 과정을 기록하고 공유하는 것이 중요한 시대입니다. 하지만 우리는 늘 시간에 쫓기고, '기록'은 '개발'의 우선순위에 밀려 뒷전이 되곤 합니다. 우리는 이 문제를 해결하고자 합니다."
              </p>
            </div>

            {/* 설계 배경 */}
            <div>
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-6 flex items-center gap-3">
                <span className="text-accent">02.</span> 설계 및 시작 배경
              </h2>
              <p className="text-text-primary leading-relaxed text-lg mb-4">
                \"왜 훌륭한 엔지니어들의 코드는 깃허브(GitHub)에만 잠들어 있는가?\"
              </p>
              <p className="text-text-secondary leading-relaxed">
                Synapso.dev는 이 질문에서 시작되었습니다. 수많은 개발자가 매일 혁신적인 코드를 작성하고 커밋(Commit)하지만, 그 이면에 담긴 고민과 해결 과정은 문서화되지 않은 채 잊혀집니다. 기존의 블로그 작성 방식은 개발 흐름을 끊고 별도의 에너지를 소모하게 만듭니다. 우리는 개발자가 평소처럼 **'커밋'하는 행위 자체가 곧 '기록'으로 이어지는 심리스(Seamless)한 워크플로우**를 꿈꿨습니다.
              </p>
            </div>

            {/* 특징 및 차별점 */}
            <div className="bg-surface border border-border-subtle rounded-3xl p-8 md:p-12 shadow-sm">
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-8">
                Synapso.dev만의 차별점
              </h2>
              <div className="grid gap-8">
                {[
                  { title: "GitHub Native 분석", desc: "단순한 텍스트 변환이 아닙니다. Git Diff를 실시간으로 분석하여 코드 변경의 의도, 맥락, 그리고 영향을 깊이 있게 파악합니다." },
                  { title: "시니어 엔지니어의 관점", desc: "Google Gemini 2.5의 강력한 추론 능력을 활용하여, 마치 시니어 개발자가 코드 리뷰를 하듯 기술적인 통찰이 담긴 포스트를 구성합니다." },
                  { title: "자동화의 극의(Auto-Posting)", desc: "크론(Cron) 기반의 자동 모드를 설정하면, 당신이 푸시(Push)하는 순간 AI가 백그라운드에서 분석을 시작하고 발행 대기 상태로 만들어줍니다." },
                  { title: "Zero Data Retention", desc: "AI 학습에 코드를 활용하지 않으며, 분석 후 즉시 휘발되는 보안 원칙을 준수하여 개발자의 자산인 코드를 소중히 다룹니다." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-accent/20 flex-shrink-0 flex items-center justify-center text-accent text-xs font-bold">
                      {i + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary mb-1">{item.title}</h3>
                      <p className="text-sm text-text-secondary leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 비전 */}
            <div className="text-center py-12">
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-6">우리의 비전</h2>
              <p className="text-xl text-text-primary font-medium tracking-tight">
                "모든 엔지니어가 자신의 영향력을 손쉽게 기록하고 공유하는 세상"
              </p>
              <p className="max-w-xl mx-auto mt-4 text-text-secondary">
                Synapso.dev는 기술 블로그 작성이 더 이상 '숙제'가 아닌 '보상'이 되는 경험을 제공할 것입니다.
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
            <div key={f.title} className="border border-border-subtle rounded-xl p-6 hover:bg-surface hover:border-border-strong transition-all duration-300">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Reviews */}
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
            {[...reviews, ...reviews].map((review, idx) => (
              <div key={idx} className="w-[400px] flex-shrink-0 border border-border-subtle rounded-2xl p-6 bg-surface/50 hover:bg-surface hover:border-border-strong transition-all duration-300">
                <p className="text-text-primary text-sm leading-relaxed mb-4 whitespace-normal line-clamp-3">
                  &quot;{review.quote}&quot;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-elevated border border-border-subtle flex items-center justify-center">
                    <span className="text-text-tertiary text-xs">✦</span>
                  </div>
                  <span className="text-xs font-semibold text-text-tertiary">{review.role}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex select-none gap-6 animate-marquee-reverse whitespace-nowrap">
            {[...reviews, ...reviews].map((review, idx) => (
              <div key={idx + 100} className="w-[400px] flex-shrink-0 border border-border-subtle rounded-2xl p-6 bg-surface/50 hover:bg-surface hover:border-border-strong transition-all duration-300">
                <p className="text-text-primary text-sm leading-relaxed mb-4 whitespace-normal line-clamp-3">
                  &quot;{review.quote}&quot;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-elevated border border-border-subtle flex items-center justify-center">
                    <span className="text-text-tertiary text-xs">✦</span>
                  </div>
                  <span className="text-xs font-semibold text-text-tertiary">{review.role}</span>
                </div>
              </div>
            ))}
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
          href={ctaHref}
          className="inline-block px-10 py-4 bg-accent text-black font-semibold rounded-lg hover:bg-accent-hover transition-colors text-lg"
        >
          {ctaText}
        </Link>
      </section>
    </div>
  );
}

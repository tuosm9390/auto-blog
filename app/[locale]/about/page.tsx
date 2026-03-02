import { Link } from "@/i18n/routing";
import { auth } from "@/auth";
import { getTranslations } from "next-intl/server";

export default async function LandingPage({ params }: { params: { locale: string } }) {
  const session = await auth();
  const t = await getTranslations("About");
  const { locale } = await params;

  const reviewsKo = [
    { quote: "더 이상 일요일 밤을 블로그 작성에 갈아 넣지 않아도 됩니다. 깃허브 커밋만 해두면 AI가 왜 이렇게 짰는지까지 분석해서 포스팅해주니 편리합니다.", role: "백엔드 엔지니어, 4년차" },
    { quote: "디자인이 미쳤습니다. 제가 짠 코드보다 사이트가 더 멋져요. 기본 제공되는 다크모드와 UI 덕분에 제 기술적 권위가 수직 상승한 기분입니다.", role: "풀스택 개발자, 2년차" },
    { quote: "리팩토링 이력을 이렇게 우아하게 정리해주는 툴은 처음입니다. 성능 최적화를 위한 고민을 AI가 정확히 짚어내서 풀어줍니다.", role: "프론트엔드 리드" },
    { quote: "포트폴리오 겸용으로 쓰기 완벽하네요. 글쓰기에 재주가 없어서 블로그가 빈약했는데, '문서화 잘하는 개발자' 타이틀을 얻었습니다.", role: "안드로이드 개발자" },
    { quote: "알아서 SEO 최적화까지? 이건 사기템이네요. 사이트맵 신경 쓸 겨를이 없었는데 며칠 만에 구글 상단에 잡히는 걸 보고 놀랐습니다.", role: "데이터 엔지니어" },
    { quote: "번아웃 직전이었는데 블로그 자동화 덕분에 살았습니다. 커밋 로그를 기반으로 릴리즈 노트를 마법처럼 뽑아주니 생산성이 200% 올랐습니다.", role: "인디 해커" },
    { quote: "코드 사이사이의 맥락을 AI가 캐치하는 능력이 압도적입니다. 단순히 인프라 배포 스크립트를 올렸을 뿐인데 가치를 비즈니스 관점에서 풀어줍니다.", role: "데브옵스 엔지니어" },
    { quote: "다른 블로그 플랫폼으로 이사 갈 생각이 싹 사라졌습니다. 복잡한 수식이나 실험 파라미터를 던져주면 그럴듯한 연구 일지로 둔갑시켜 줍니다.", role: "AI/ML 연구원" },
    { quote: "개발자들의 숨겨진 허영심을 정확히 자극하는 UI입니다. 공유할 때 나오는 OG 카드 이미지가 정말 간지나서 다들 어떻게 만들었냐고 물어봐요.", role: "주니어 개발자" },
    { quote: "에러 해결 과정을 드라마틱하게 써줍니다. 하루 종일 삽질했던 트러블슈팅 과정을 '문제 인식 -> 해결'의 완벽한 기승전결로 뽑아줬습니다.", role: "웹 앱 개발자" },
  ];

  const reviewsEn = [
    { quote: "No more spending Sunday nights writing blog posts. Just push to GitHub and AI analyzes why I coded it that way. Super convenient.", role: "Backend Engineer, 4yr" },
    { quote: "The design is insane. The site looks better than my code. The dark mode and UI instantly boost my technical authority.", role: "Fullstack Dev, 2yr" },
    { quote: "First tool that elegantly organizes refactoring history. AI pinpoints and explains performance optimization decisions perfectly.", role: "Frontend Lead" },
    { quote: "Perfect for portfolio use. I lacked writing skills, but now I have the title of 'Dev who documents well'.", role: "Android Developer" },
    { quote: "Automatic SEO optimization? This is a cheat code. I didn't have time for sitemaps, but it hit Google top rankings in days.", role: "Data Engineer" },
    { quote: "Saved me from burnout. Automatically generating release notes from commit logs boosted my productivity by 200%.", role: "Indie Hacker" },
    { quote: "AI's ability to catch context between lines is overwhelming. It turns simple infra scripts into business value stories.", role: "DevOps Engineer" },
    { quote: "No need for other platforms. Throw in complex formulas or experiment params, and it turns them into great research logs.", role: "AI/ML Researcher" },
    { quote: "The UI targets developer vanity accurately. People keep asking how I made those cool OG card images when I share posts.", role: "Junior Developer" },
    { quote: "Explains error resolution dramatically. It turned a whole day of troubleshooting into a perfect 'Problem -> Solution' narrative.", role: "Web App Developer" },
  ];

  const reviews = locale === 'ko' ? reviewsKo : reviewsEn;

  return (
    <div className="max-w-6xl mx-auto px-4 animate-fade-in-up">
      {/* Hero */}
      <section className="flex flex-col items-center text-center py-24 md:py-32">
        <span className="inline-block px-3 py-1 border border-border-subtle rounded-full text-xs tracking-widest text-text-tertiary uppercase mb-6">
          {t("heroTag")}
        </span>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight leading-tight mb-6 whitespace-pre-line">
          {t.rich("heroTitle", {
            ai: (chunks) => <span className="text-text-secondary">{chunks}</span>
          })}
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
          {/* Marquee rows use localized reviews */}
          <div className="flex select-none gap-6 animate-marquee whitespace-nowrap">
            {[...reviews, ...reviews].map(
              (review, idx) => (
                <div
                  key={idx}
                  className="w-[400px] flex-shrink-0 border border-border-subtle rounded-2xl p-6 bg-surface/50 hover:bg-surface hover:border-border-strong transition-all duration-300"
                >
                  <p className="text-text-primary text-sm leading-relaxed mb-4 whitespace-normal line-clamp-3">
                    "{review.quote}"
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
          
          {/* Row 2: Reverse */}
          <div className="flex select-none gap-6 animate-marquee-reverse whitespace-nowrap">
            {[...reviews, ...reviews].map(
              (review, idx) => (
                <div
                  key={idx + 100}
                  className="w-[400px] flex-shrink-0 border border-border-subtle rounded-2xl p-6 bg-surface/50 hover:bg-surface hover:border-border-strong transition-all duration-300"
                >
                  <p className="text-text-primary text-sm leading-relaxed mb-4 whitespace-normal line-clamp-3">
                    "{review.quote}"
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

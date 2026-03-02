import Link from "next/link";
import { auth } from "@/auth";

export default async function LandingPage() {
  const session = await auth();

  const reviews = [
    {
      quote:
        "더 이상 일요일 밤을 블로그 작성에 갈아 넣지 않아도 됩니다. 깃허브 커밋만 해두면 AI가 왜 이렇게 짰는지까지 분석해서 포스팅해주니 편리합니다.",
      role: "백엔드 엔지니어, 4년차",
    },
    {
      quote:
        "디자인이 미쳤습니다. 제가 짠 코드보다 사이트가 더 멋져요. 기본 제공되는 다크모드와 UI 덕분에 제 기술적 권위가 수직 상승한 기분입니다.",
      role: "풀스택 개발자, 2년차",
    },
    {
      quote:
        "리팩토링 이력을 이렇게 우아하게 정리해주는 툴은 처음입니다. 성능 최적화를 위한 고민을 AI가 정확히 짚어내서 풀어줍니다.",
      role: "프론트엔드 리드",
    },
    {
      quote:
        "포트폴리오 겸용으로 쓰기 완벽하네요. 글쓰기에 재주가 없어서 블로그가 빈약했는데, '문서화 잘하는 개발자' 타이틀을 얻었습니다.",
      role: "안드로이드 개발자",
    },
    {
      quote:
        "알아서 SEO 최적화까지? 이건 사기템이네요. 사이트맵 신경 쓸 겨를이 없었는데 며칠 만에 구글 상단에 잡히는 걸 보고 놀랐습니다.",
      role: "데이터 엔지니어",
    },
    {
      quote:
        "번아웃 직전이었는데 블로그 자동화 덕분에 살았습니다. 커밋 로그를 기반으로 릴리즈 노트를 마법처럼 뽑아주니 생산성이 200% 올랐습니다.",
      role: "인디 해커",
    },
    {
      quote:
        "코드 사이사이의 맥락을 AI가 캐치하는 능력이 압도적입니다. 단순히 인프라 배포 스크립트를 올렸을 뿐인데 가치를 비즈니스 관점에서 풀어줍니다.",
      role: "데브옵스 엔지니어",
    },
    {
      quote:
        "다른 블로그 플랫폼으로 이사 갈 생각이 싹 사라졌습니다. 복잡한 수식이나 실험 파라미터를 던져주면 그럴듯한 연구 일지로 둔갑시켜 줍니다.",
      role: "AI/ML 연구원",
    },
    {
      quote:
        "개발자들의 숨겨진 허영심을 정확히 자극하는 UI입니다. 공유할 때 나오는 OG 카드 이미지가 정말 간지나서 다들 어떻게 만들었냐고 물어봐요.",
      role: "주니어 개발자",
    },
    {
      quote:
        "에러 해결 과정을 드라마틱하게 써줍니다. 하루 종일 삽질했던 트러블슈팅 과정을 '문제 인식 -> 해결'의 완벽한 기승전결로 뽑아줬습니다.",
      role: "웹 앱 개발자",
    },
    {
      quote:
        "커스타마이징의 유연성이 돋보입니다. AI가 써준 글이 100% 맘에 들지는 않을 때 마크다운으로 수정하고 배포할 수 있어서 좋습니다.",
      role: "시니어 아키텍트",
    },
    {
      quote:
        "검색엔진 트래픽이 눈에 띄게 늘었습니다. 시맨틱 마크업 처리가 잘 되어 있어서 그런지 오가닉 유입이 이전 세팅보다 확연히 증가했습니다.",
      role: "프리랜서 개발자",
    },
    {
      quote:
        "이제 '블로그 써야지' 하는 부채감에서 해방되었습니다. 코딩만 하면 블로그는 알아서 업데이트된다는 경험 자체가 혁명입니다.",
      role: "iOS 개발자",
    },
    {
      quote:
        "다크모드 타이포그래피가 정말 예술입니다. 첫화면 진입하자마자 느껴지는 시각적 완성도가 압도적입니다.",
      role: "UX/UI 엔지니어",
    },
    {
      quote:
        "지원자 평가 시간이 절반으로 줄었습니다. 비개발자도 역량을 파악하기 너무 쉽게 비즈니스 임팩트가 요약되어 있습니다.",
      role: "IT 기업 테크 리쿠르터",
    },
    {
      quote:
        "프리랜서 계약 전 신뢰도를 100% 채워줍니다. 디자인에서 오는 프리미엄 느낌 때문에 기술력에 대한 의심 없이 바로 미팅을 제안했습니다.",
      role: "스타트업 대표",
    },
    {
      quote:
        "투자 관점에서 창업자의 실행력을 엿보기 좋습니다. 매일 얼마나 많은 문제를 밀도 있게 해결하고 있는지 하이레벨 요약본으로 볼 수 있습니다.",
      role: "벤처 캐피탈리스트",
    },
    {
      quote:
        "가독성이 뛰어나 모바일로 슥슥 읽기 좋습니다. 긴 문장이 알아서 끊어져 있고 핵심만 렌더링되어 있어서 눈이 피로하지 않네요.",
      role: "시니어 테크니컬 디렉터",
    },
    {
      quote:
        "팀 내 개발 문화 가이드로 써도 될 만큼 요약이 훌륭합니다. 신입 개발자들의 컨텍스트 파악이 훨씬 수월할 것 같습니다.",
      role: "개발 팀장",
    },
    {
      quote:
        "연락하고 싶게 만드는 CTA 폼이 인상적입니다. 제안하는 과정이 매우 매끄럽게 설계되어 있습니다.",
      role: "헤드헌터",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 animate-fade-in-up">
      {/* Hero */}
      <section className="flex flex-col items-center text-center py-24 md:py-32">
        <span className="inline-block px-3 py-1 border border-border-subtle rounded-full text-xs tracking-widest text-text-tertiary uppercase mb-6">
          Automated Tech Blogging
        </span>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight leading-tight mb-6">
          코딩만 하세요.
          <br />
          기술 블로그는 <span className="text-text-secondary">AI</span>가
          완성합니다.
        </h1>
        <p className="max-w-2xl text-text-secondary text-lg md:text-xl mb-10 leading-relaxed font-body">
          GitHub 커밋을 분석하여 자동으로 기술 블로그 포스트를 생성합니다.
          <br />
          개발에만 집중하세요 — 나머지는 AI가 처리합니다.
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Link
            href={session ? "/" : "/login"}
            className="px-8 py-3 bg-accent text-black font-semibold rounded-lg hover:bg-accent-hover transition-colors"
          >
            {session ? "포스트 보기" : "시작하기"}
          </Link>
          <Link
            href="/how-it-works"
            className="px-8 py-3 border border-border-strong rounded-lg text-text-secondary hover:text-text-primary hover:border-text-primary transition-all"
          >
            작동 방식
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 border-t border-border-subtle">
        <h2 className="text-2xl md:text-3xl font-display font-semibold text-center mb-12">
          왜 Synapso.dev인가?
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: "⚡",
              title: "완전 자동화",
              desc: "커밋이 감지되면 AI가 알아서 분석하고 글을 작성합니다.",
            },
            {
              icon: "🧠",
              title: "딥 코드 분석",
              desc: "단순 커밋 로그가 아닌, 코드 변경의 의도와 맥락을 파악합니다.",
            },
            {
              icon: "✍️",
              title: "전문가 톤",
              desc: "시니어 개발자가 회고하듯 깊이 있는 기술 글을 생성합니다.",
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
            Testimonials
          </span>
          <h2 className="text-2xl md:text-3xl font-display font-semibold mb-4">
            생산성 200% 향상의 통찰
          </h2>
          <p className="text-text-secondary max-w-xl mx-auto">
            매주 주말을 희생하지 마세요. 현업 개발자와 채용 담당자가 경험한
            Synapso.dev의 마법.
          </p>
        </div>

        <div className="relative space-y-6 pause-on-hover">
          {/* Row 1: Left */}
          <div className="flex select-none gap-6 animate-marquee whitespace-nowrap">
            {[...reviews.slice(0, 10), ...reviews.slice(0, 10)].map(
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

          {/* Row 2: Right */}
          <div className="flex select-none gap-6 animate-marquee-reverse whitespace-nowrap">
            {[...reviews.slice(10, 20), ...reviews.slice(10, 20)].map(
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

          {/* Gradient Overlays */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-canvas to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-canvas to-transparent z-10" />
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 border-t border-border-subtle text-center">
        <h2 className="text-2xl md:text-3xl font-display font-semibold mb-4">
          지금 바로 시작하세요
        </h2>
        <p className="text-text-secondary mb-8 max-w-xl mx-auto whitespace-pre-line">
          {session
            ? "버튼을 클릭하여 포스트를 확인하고 관리해보세요.\n당신의 코드가 가치 있는 아티클로 변하는 순간을 경험하세요."
            : "GitHub 계정으로 로그인하면 즉시 사용할 수 있습니다.\n지금 바로 첫 포스팅을 만들어보세요."}
        </p>
        <Link
          href={session ? "/" : "/login"}
          className="inline-block px-10 py-4 bg-accent text-black font-semibold rounded-lg hover:bg-accent-hover transition-colors text-lg"
        >
          {session ? "포스트 관리로 이동 →" : "무료로 시작하기 →"}
        </Link>
      </section>
    </div>
  );
}

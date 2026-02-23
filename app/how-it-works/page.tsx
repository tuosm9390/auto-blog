import Link from "next/link";
import { auth } from "@/auth";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "사용 방법 | AI Tech Blog",
  description: "GitHub 커밋을 AI가 분석하여 기술 블로그 포스트를 자동 생성하는 과정을 단계별로 안내합니다.",
  openGraph: {
    title: "사용 방법 | AI Tech Blog",
    description: "GitHub 커밋 기반 AI 자동 블로그 생성 과정 안내",
  },
};

export default async function HowItWorksPage() {
  const session = await auth();
  const steps = [
    {
      num: "01",
      icon: "🔗",
      title: "GitHub 연결",
      desc: "안전한 OAuth 보안 인증을 통해 GitHub 계정과 실시간으로 연동합니다.\n게시하고자 하는 특정 레포지토리에 대한 접근 권한을 유연하게 설정하여 자동화된 데이터 수집 기반을 마련합니다."
    },
    {
      num: "02",
      icon: "📊",
      title: "커밋 분석",
      desc: "Gemini AI 모델이 선택된 커밋의 코드 변화를 단순히 추적하는 것을 넘어,\n함수 변경의 의도, 성능 최적화 내역, 그리고 해당 수정이 프로젝트 전체에 미치는 기술적 임팩트와 맥락을 깊이 있게 파악합니다."
    },
    {
      num: "03",
      icon: "✍️",
      title: "글 생성",
      desc: "분석된 기술적 통찰을 바탕으로 시니어 엔지니어가 작성한 듯한 전문적인 톤의 게시글을 생성합니다.\n문제 정의부터 해결 방법, 배운 점까지 포함된 완벽한 기승전결 구조의 마크다운 포스트가 자동으로 구성됩니다."
    },
    {
      num: "04",
      icon: "🚀",
      title: "발행 및 관리",
      desc: "생성된 글의 미리보기를 최종 검토하고 필요한 경우 마크다운 에디터로 직접 세밀하게 조정할 수 있습니다.\n단 한 번의 클릭으로 블로그에 즉시 게시되며, SEO 최적화와 소셜 공유용 메타 데이터가 자동으로 적용됩니다."
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 md:py-24 animate-fade-in-up">
      <section className="text-center mb-16">
        <span className="inline-block px-3 py-1 border border-border-subtle rounded-full text-xs tracking-widest text-text-tertiary uppercase mb-6">
          How It Works
        </span>
        <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tight mb-4">
          개발자의 워크플로우를 그대로.<br />
          <span className="text-text-secondary">방해 없는 자동화.</span>
        </h1>
      </section>

      <div className="flex flex-col gap-6">
        {steps.map((step) => (
          <div key={step.num} className="flex gap-6 items-start border border-border-subtle rounded-xl p-6 hover:bg-surface hover:border-border-strong transition-all duration-300">
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-elevated flex items-center justify-center text-2xl">
              {step.icon}
            </div>
            <div>
              <div className="text-xs text-text-tertiary font-mono mb-1">Step {step.num}</div>
              <h3 className="text-lg font-semibold mb-1">{step.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-16">
        <Link href={session ? "/posts" : "/login"} className="inline-block px-10 py-4 bg-accent text-black font-semibold rounded-lg hover:bg-accent-hover transition-colors text-lg">
          {session ? "포스트 관리로 이동 →" : "지금 시작하기 →"}
        </Link>
      </div>
    </div>
  );
}

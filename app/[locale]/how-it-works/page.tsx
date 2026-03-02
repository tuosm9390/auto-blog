import { Link } from "@/i18n/routing";
import { auth } from "@/auth";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const isEn = (await params).locale === 'en';
  return {
    title: isEn ? "How it works | Synapso.dev" : "사용 방법 | Synapso.dev",
    description: isEn 
      ? "Learn how Synapso.dev turns your GitHub commits into professional tech blog posts."
      : "GitHub 커밋을 AI가 분석하여 기술 블로그 포스트를 자동 생성하는 과정을 안내합니다.",
  };
}

export default async function HowItWorksPage() {
  const session = await auth();
  const t = await getTranslations("HowItWorks");

  const steps = [
    {
      num: "01",
      icon: "🔗",
      title: t("step1Title"),
      desc: t("step1Desc")
    },
    {
      num: "02",
      icon: "📊",
      title: t("step2Title"),
      desc: t("step2Desc")
    },
    {
      num: "03",
      icon: "✍️",
      title: t("step3Title"),
      desc: t("step3Desc")
    },
    {
      num: "04",
      icon: "🚀",
      title: t("step4Title"),
      desc: t("step4Desc")
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 md:py-24 animate-fade-in-up">
      <section className="text-center mb-16">
        <span className="inline-block px-3 py-1 border border-border-subtle rounded-full text-xs tracking-widest text-text-tertiary uppercase mb-6">
          How It Works
        </span>
        <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tight mb-4 whitespace-pre-line">
          {t("title")}
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
        <Link href={session ? "/" : "/login"} className="inline-block px-10 py-4 bg-accent text-black font-semibold rounded-lg hover:bg-accent-hover transition-colors text-lg">
          {session ? t("ctaManage") : t("ctaStart")}
        </Link>
      </div>
    </div>
  );
}

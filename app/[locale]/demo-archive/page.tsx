import { getTranslations } from "next-intl/server";

export default async function DemoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;
  const t = await getTranslations("DemoPage");

  const steps = [
    { number: 1, label: t("step1") },
    { number: 2, label: t("step2") },
    { number: 3, label: t("step3") },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 animate-fade-in-up">
      {/* Hero */}
      <section className="flex flex-col items-center text-center py-24 md:py-32">
        <span className="inline-block px-3 py-1 border border-border-subtle rounded-full text-xs tracking-widest text-text-tertiary uppercase mb-6">
          {t("tag")}
        </span>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight leading-tight mb-6 whitespace-pre-line">
          {t("title")}
        </h1>
        <p className="max-w-2xl text-text-secondary text-lg md:text-xl mb-10 leading-relaxed font-body">
          {t("description")}
        </p>
        <div className="flex flex-col items-center gap-3">
          <a
            href="/api/demo/github-oauth"
            className="px-8 py-3 bg-accent text-black font-semibold rounded-lg hover:bg-accent-hover transition-colors"
          >
            {t("cta")}
          </a>
          <span className="text-xs text-text-tertiary">{t("free")}</span>
        </div>
      </section>

      {/* Steps */}
      <section className="py-16 border-t border-border-subtle">
        <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {steps.map((step) => (
            <div
              key={step.number}
              className="flex flex-col items-center text-center border border-border-subtle rounded-xl p-6 hover:bg-surface hover:border-border-strong transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm mb-4">
                {step.number}
              </div>
              <span className="text-sm font-semibold text-text-primary">
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

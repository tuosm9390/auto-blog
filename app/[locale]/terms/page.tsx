import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const isEn = (await params).locale === 'en';
  return {
    title: isEn ? "Terms of Service | Synapso.dev" : "이용약관 | Synapso.dev",
    description: isEn 
      ? "Check Synapso.dev terms of service and intellectual property policies."
      : "Synapso.dev 서비스 이용약관 및 지적 재산권 정책을 확인하세요.",
  };
}

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="mb-10">
    <h2 className="text-xl font-semibold mb-4 text-text-primary">{title}</h2>
    <div className="text-text-secondary space-y-3 leading-relaxed">
      {children}
    </div>
  </section>
);

export default async function TermsPage() {
  const t = await getTranslations("Terms");

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 md:py-24 animate-fade-in-up">
      <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-3">
        {t("title")}
      </h1>
      <p className="text-text-tertiary text-sm mb-12">
        {t("updated")}
      </p>

      <Section title={t("section1")}>
        <p>
          {t("section1Desc")}
        </p>
      </Section>

      <Section title={t("section2")}>
        <div className="border border-accent/30 bg-accent/5 rounded-xl p-5 space-y-3">
          <ul className="space-y-2 text-sm">
            <li className="flex gap-3">
              <span className="text-accent mt-0.5 flex-shrink-0">✓</span>
              <span>
                {t("section2Point1")}
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent mt-0.5 flex-shrink-0">✓</span>
              <span>
                {t("section2Point2")}
              </span>
            </li>
          </ul>
        </div>
      </Section>

      <Section title={t("section8")}>
        <p>
          {t("contact")}{" "}
          <a
            href="mailto:devcraft0416@gmail.com"
            className="text-accent hover:text-accent-hover transition-colors"
          >
            devcraft0416@gmail.com
          </a>
        </p>
      </Section>
    </div>
  );
}

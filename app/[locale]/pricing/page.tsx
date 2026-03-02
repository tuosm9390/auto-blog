import { Metadata } from "next";
import { auth } from "@/auth";
import PricingClient from "./PricingClient";
import { getProfileByUsername } from "@/lib/profiles";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const isEn = (await params).locale === 'en';
  return {
    title: isEn ? "Pricing | Synapso.dev" : "요금제 안내 | Synapso.dev",
    description: isEn 
      ? "Check Synapso.dev pricing plans and professional AI blog automation tools."
      : "Synapso.dev의 요금제를 확인하고 전문성을 높여줄 AI 블로그 자동화 도구를 만나보세요.",
  };
}

export default async function PricingPage() {
  const session = await auth();
  const t = await getTranslations("Pricing");

  let currentTier = "free";

  if (session?.user?.username) {
    const profile = await getProfileByUsername(session.user.username);
    if (profile?.subscription_tier) {
      currentTier = profile.subscription_tier;
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 animate-fade-in-up">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight mb-6 whitespace-pre-line">
          {t("title")}
        </h1>
        <p className="text-lg text-text-secondary">
          {t("desc")}
        </p>
      </div>

      <PricingClient currentTier={currentTier} isAuthenticated={!!session} />

      <div className="mt-24 max-w-3xl mx-auto">
        <h3 className="text-2xl font-display font-bold mb-8 text-center">
          {t("faqTitle")}
        </h3>
        <div className="space-y-6">
          <div className="p-6 border border-border-subtle rounded-xl bg-surface">
            <h4 className="font-semibold text-lg mb-2">
              {t("faq1Q")}
            </h4>
            <p className="text-text-secondary">
              {t("faq1A")}
            </p>
          </div>
          <div className="p-6 border border-border-subtle rounded-xl bg-surface">
            <h4 className="font-semibold text-lg mb-2">
              {t("faq2Q")}
            </h4>
            <p className="text-text-secondary">
              {t("faq2A")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

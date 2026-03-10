import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

interface LoginRequiredProps {
  title?: string;
  desc?: string;
}

export function LoginRequired({ title, desc }: LoginRequiredProps) {
  const t = useTranslations("Common");

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 animate-fade-in-up text-center">
      <h1 className="text-3xl font-display font-bold mb-4">{title || t("loginRequiredTitle")}</h1>
      {desc && <p className="text-text-secondary mb-8">{desc}</p>}
      <div className="border border-border-subtle rounded-xl p-8">
        <p className="text-text-secondary mb-4">{t("loginRequiredDesc")}</p>
        <Link href="/login" className="inline-block px-6 py-3 bg-accent text-black font-semibold rounded-lg hover:bg-accent-hover transition-colors">
          {t("signIn")}
        </Link>
      </div>
    </div>
  );
}

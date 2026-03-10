import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import ScrollToTopButton from "./ScrollToTopButton";

export default async function Footer() {
  const t = await getTranslations("Footer");

  return (
    <footer className="border-t border-border-subtle py-12 mt-auto bg-canvas">
      {/* 고정된 최상단 이동 버튼 */}
      <ScrollToTopButton />

      <div className="max-w-6xl mx-auto px-4 flex flex-col items-center">
        <div className="text-center space-y-4">
          <p className="text-text-secondary text-sm font-medium tracking-tight">
            {t("rights", { year: new Date().getFullYear() })}
          </p>

          <div className="flex flex-col items-center gap-2">
            <a
              href="mailto:devcraft0416@gmail.com"
              className="text-text-tertiary hover:text-accent text-sm font-mono transition-colors flex items-center gap-2 group"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="group-hover:scale-110 transition-transform"
              >
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              devcraft0416@gmail.com
            </a>
            <div className="flex items-center gap-4 mt-1">
              <Link
                href="/terms"
                className="text-text-tertiary hover:text-text-secondary text-xs transition-colors"
              >
                {t("terms")}
              </Link>
              <span className="text-border-strong text-xs">·</span>
              <Link
                href="/pricing"
                className="text-text-tertiary hover:text-text-secondary text-xs transition-colors"
              >
                {t("pricing")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

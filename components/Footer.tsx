"use client";

import { useState, useEffect } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export default function Footer() {
  const [isVisible, setIsVisible] = useState(false);
  const t = useTranslations("Footer");

  // 스크롤 위치에 따라 버튼 표시 여부 결정
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="border-t border-border-subtle py-12 mt-auto bg-canvas">
      {/* 고정된 최상단 이동 버튼 */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-100 z-50 flex flex-col items-center gap-2 text-text-tertiary hover:text-text-primary transition-all duration-300 group cursor-pointer ${
          isVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
        aria-label={t("topAria")}
      >
        <div className="p-3 rounded-full border border-border-strong group-hover:border-accent transition-colors bg-elevated shadow-2xl backdrop-blur-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="group-hover:-translate-y-1 transition-transform"
          >
            <path d="m18 15-6-6-6 6" />
          </svg>
        </div>
        <span className="text-[10px] uppercase tracking-widest font-mono bg-canvas/80 px-2 py-0.5 rounded shadow-sm border border-border-subtle">
          {t("top")}
        </span>
      </button>

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
              <Link href="/terms" className="text-text-tertiary hover:text-text-secondary text-xs transition-colors">
                {t("terms")}
              </Link>
              <span className="text-border-strong text-xs">·</span>
              <Link href="/pricing" className="text-text-tertiary hover:text-text-secondary text-xs transition-colors">
                {t("pricing")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

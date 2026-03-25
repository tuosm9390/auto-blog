import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import LanguageSwitcher from "../LanguageSwitcher";
import Image from "next/image";

export default async function DemoHeader() {
  const t = await getTranslations("Header");

  return (
    <header className="sticky top-0 z-50 border-b border-border-subtle bg-canvas/80 backdrop-blur-md shadow-sm shadow-black/5">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/demo" className="flex items-center gap-2 group">
          <Image src="/favicon.png" alt="Synapso.dev" width={32} height={32} className="rounded-md" />
          <span className="font-display font-semibold text-lg tracking-tight group-hover:text-accent transition-colors">
            Synapso.dev
          </span>
          <span className="ml-1 px-1.5 py-0.5 text-[9px] font-bold border border-accent/30 text-accent rounded-sm uppercase tracking-tighter">
            Demo
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          
          <Link
            href="/tester-apply"
            className="hidden sm:flex text-sm text-white bg-accent hover:bg-accent-hover px-5 py-2 rounded-full transition-all font-bold shadow-lg shadow-accent/20 items-center gap-1.5"
          >
            {t("testerApply")}
          </Link>

          {/* 모바일에서는 버튼 대신 심플하게 처리 (이미 헤더에 LanguageSwitcher가 있으므로 충분) */}
        </div>
      </div>
    </header>
  );
}

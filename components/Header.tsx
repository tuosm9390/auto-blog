import { auth } from "@/auth";
import { SignIn, SignOut } from "./auth-components";
import MobileMenu from "./MobileMenu";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import LanguageSwitcher from "./LanguageSwitcher";

export default async function Header() {
  const session = await auth();
  const t = await getTranslations("Header");
  
  const role = (session?.user as any)?.role || 'user';
  const isAdmin = role === 'admin';
  const isTester = role === 'tester';
  const isPrivileged = isAdmin || isTester;

  return (
    <header className="sticky top-0 z-50 border-b border-border-subtle bg-canvas/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-md bg-accent flex items-center justify-center">
            <span className="text-xs font-bold text-black">SD</span>
          </div>
          <span className="font-display font-semibold text-lg tracking-tight group-hover:text-accent transition-colors">
            Synapso.dev
          </span>
        </Link>

        {/* 데스크탑 nav */}
        <nav className="hidden sm:flex items-center gap-4">
          {/* 1. 권한 있는 유저 전용 메뉴 */}
          {isPrivileged && (
            <>
              <Link
                href="/generate"
                className="text-sm text-accent hover:text-accent-hover transition-colors font-medium"
              >
                {t("generate")}
              </Link>
              <Link
                href="/jobs"
                className="text-sm text-text-secondary hover:text-text-primary transition-colors font-medium"
              >
                {t("jobs")}
              </Link>
              <Link
                href="/settings"
                className="text-sm text-text-secondary hover:text-text-primary transition-colors font-medium"
              >
                {t("settings")}
              </Link>
            </>
          )}

          {/* 2. 관리자 전용 메뉴 */}
          {isAdmin && (
            <Link
              href="/admin/testers"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors font-medium flex items-center gap-1 border-l border-border-subtle pl-4 ml-2"
            >
              {t("testerStatus")}
            </Link>
          )}

          {/* 3. 일반 유저 전용 메뉴 (테스터 신청) */}
          {session?.user && !isPrivileged && (
            <Link
              href="/tester-apply"
              className="text-sm text-accent bg-accent/10 px-3 py-1.5 rounded-full hover:bg-accent/20 transition-all font-semibold border border-accent/20"
            >
              {t("testerApply")}
            </Link>
          )}

          {/* 4. 공통 메뉴 */}
          <Link
            href="/about"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors font-medium"
          >
            {t("about")}
          </Link>
          <Link
            href="/pricing"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors font-medium"
          >
            {t("pricing")}
          </Link>

          <div className="h-4 w-[1px] bg-border-subtle mx-1" />
          <LanguageSwitcher />

          {session?.user ? (
            <div className="flex items-center gap-3 ml-2">
              <Link
                href={/@}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                {session.user.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt={session.user.name ?? "Profile"}
                    className="w-7 h-7 rounded-full object-cover border border-border-subtle"
                  />
                )}
                <span className="text-sm font-medium text-text-primary">
                  {session.user.username || session.user.name}
                </span>
              </Link>
              <SignOut label={t("signOut")} />
            </div>
          ) : (
            <SignIn />
          )}
        </nav>

        {/* 모바일 햄버거 메뉴 (MobileMenu 컴포넌트 내의 로직도 필요에 따라 수정 권장) */}
        <div className="sm:hidden flex items-center gap-3">
          <LanguageSwitcher />
          <MobileMenu
            isLoggedIn={!!session?.user}
            username={session?.user?.username}
            userImage={session?.user?.image}
            userName={session?.user?.name}
            role={role}
          />
        </div>
      </div>
    </header>
  );
}

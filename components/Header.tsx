import { auth } from "@/auth";
import { SignIn, SignOut } from "./auth-components";
import MobileMenu from "./MobileMenu";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import LanguageSwitcher from "./LanguageSwitcher";
import { headers } from "next/headers";
import Image from "next/image";
import { getReleases } from "@/lib/changelog";
import ChangelogDropdown from "./ChangelogDropdown";

const withTimeout = <T,>(p: Promise<T>, ms: number): Promise<T> =>
  Promise.race([
    p,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms)
    ),
  ]);

export default async function Header() {
  await headers();
  
  const session = await auth();
  const t = await getTranslations("Header");
  const releases = await withTimeout(getReleases(), 5000).catch(() => []);

  const role = session?.user?.role || "user";
  const isAdmin = role === "admin";
  const homeHref = session?.user ? "/projects" : "/";

  return (
    <header className="sticky top-0 z-50 border-b border-border-subtle bg-canvas/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href={homeHref} className="flex items-center gap-2 group">
          <Image src="/favicon.png" alt="Synapso.dev" width={32} height={32} className="rounded-md" />
          <span className="font-display font-semibold text-lg tracking-tight group-hover:text-accent transition-colors">
            Synapso.dev
          </span>
        </Link>

        {/* 데스크탑 nav */}
        <nav className="hidden sm:flex items-center gap-4">
          {/* 1. 로그인한 유저 메뉴 */}
          {session?.user && (
            <>
              <Link
                href="/projects"
                className="text-sm text-accent hover:text-accent-hover transition-colors font-medium"
              >
                {t("projects")}
              </Link>
              <Link
                href="/settings"
                className="text-sm text-text-secondary hover:text-text-primary transition-colors font-medium"
              >
                {t("settings")}
              </Link>
            </>
          )}

          {/* 2. 관리자 통합 대시보드 버튼 (난독화 경로) */}
          {isAdmin && (
            <Link
              href="/admin-portal-v5-secret"
              className="text-sm text-accent bg-accent/5 hover:bg-accent/10 px-3 py-1.5 rounded-md transition-all font-bold border border-accent/20 flex items-center gap-1.5 ml-2"
            >
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              {t("adminDashboard")}
            </Link>
          )}

          {/* 3. 공통 메뉴 */}
          {releases.length > 0 && (
            <ChangelogDropdown
              releases={releases.slice(0, 2)}
              latestVersion={releases[0].version}
            />
          )}

          <Link
            href="/about"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors font-medium"
          >
            {t("about")}
          </Link>

          <div className="h-4 w-[1px] bg-border-subtle mx-1" />
          <LanguageSwitcher />

          {session?.user ? (
            <div className="flex items-center gap-3 ml-2">
              <Link
                href={`/@${session.user.username || session.user.name}`}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                {session.user.image && (
                  <Image
                    src={session.user.image}
                    alt={session.user.name ?? "Profile"}
                    width={28}
                    height={28}
                    className="rounded-full object-cover border border-border-subtle"
                  />
                )}
                <span className="text-sm font-medium text-text-primary flex items-center">
                  {session.user.username || session.user.name}
                  {session.user.role === "admin" && (
                    <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-bold bg-accent text-black rounded-sm uppercase tracking-tighter">
                      Admin
                    </span>
                  )}
                </span>
              </Link>
              <SignOut label={t("signOut")} />
            </div>
          ) : (
            <SignIn />
          )}
        </nav>

        {/* 모바일 햄버거 메뉴 */}
        <div className="sm:hidden flex items-center gap-3">
          <LanguageSwitcher />
          <MobileMenu
            isLoggedIn={!!session?.user}
            username={session?.user?.username}
            userImage={session?.user?.image}
            userName={session?.user?.name}
            role={role}
            changelogLatest={releases[0] ?? null}
          />
        </div>
      </div>
    </header>
  );
}

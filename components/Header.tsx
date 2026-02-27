import Link from "next/link";
import { auth } from "@/auth";
import { SignIn, SignOut } from "./auth-components";

export default async function Header() {
  const session = await auth();
  return (
    <header className="sticky top-0 z-50 border-b border-border-subtle bg-canvas/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-md bg-accent flex items-center justify-center">
            <span className="text-xs font-bold text-black">AB</span>
          </div>
          <span className="font-display font-semibold text-lg tracking-tight group-hover:text-accent transition-colors">AutoBlog</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/generate" className="text-sm text-accent hover:text-accent-hover transition-colors font-medium">
            ✦ 새 글 생성
          </Link>
          <Link href="/about" className="text-sm text-text-secondary hover:text-text-primary transition-colors font-medium hidden sm:inline">
            서비스 소개
          </Link>
          <Link href="/pricing" className="text-sm text-text-secondary hover:text-text-primary transition-colors font-medium hidden sm:inline">
            요금제
          </Link>
          {session?.user && (
            <>
              {/* <Link href={`/@${session.user.username}`} className="text-sm text-text-secondary hover:text-text-primary transition-colors font-medium">
                내 블로그
              </Link> */}
              <Link href="/jobs" className="text-sm text-text-secondary hover:text-text-primary transition-colors hidden sm:inline">
                작업 현황
              </Link>
              <Link href="/settings" className="text-sm text-text-secondary hover:text-text-primary transition-colors hidden sm:inline">
                설정
              </Link>
            </>
          )}
          {session?.user ? (
            <div className="flex items-center gap-3 ml-2">
              <Link href={`/@${session.user.username}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                {session.user.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt={session.user.name ?? "Profile"}
                    className="w-7 h-7 rounded-full object-cover border border-border-subtle"
                  />
                )}
                <span className="text-sm font-medium text-text-primary hidden sm:inline">{session.user.username || session.user.name}</span>
              </Link>
              <SignOut />
            </div>
          ) : (
            <SignIn />
          )}
        </nav>
      </div>
    </header>
  );
}

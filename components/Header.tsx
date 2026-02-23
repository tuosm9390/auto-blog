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
          <Link href="/posts" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
            포스트
          </Link>
          <Link href="/generate" className="text-sm text-accent hover:text-accent-hover transition-colors font-medium">
            ✦ 새 글 생성
          </Link>
          {session?.user && (
            <Link href="/settings" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
              설정
            </Link>
          )}
          {session?.user ? (
            <div className="flex items-center gap-3 ml-2">
              <div className="flex items-center gap-2">
                {session.user.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt={session.user.name ?? "Profile"}
                    className="w-7 h-7 rounded-full"
                  />
                )}
                <span className="text-sm font-medium text-text-secondary hidden sm:inline">{session.user.username || session.user.name}</span>
              </div>
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

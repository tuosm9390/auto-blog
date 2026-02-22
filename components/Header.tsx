import Link from "next/link";
import { auth } from "@/auth";
import { SignIn, SignOut } from "./auth-components";

export default async function Header() {
  const session = await auth();
  return (
    <header className="header">
      <div className="header__inner">
        <Link href="/" className="header__logo">
          <div className="header__logo-icon">AB</div>
          <span className="header__logo-text">AutoBlog</span>
        </Link>
        <nav className="header__nav">
          <Link href="/" className="header__nav-link">
            포스트
          </Link>
          <Link href="/generate" className="header__nav-link header__nav-link--accent">
            ✦ 새 글 생성
          </Link>
          {session?.user && (
            <Link href="/settings" className="header__nav-link">
              설정
            </Link>
          )}
          {session?.user ? (
            <div className="header__user">
              <div className="header__profile">
                {session.user.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt={session.user.name ?? "Profile"}
                    className="header__profile-img"
                  />
                )}
                <span className="header__profile-name">{session.user.username || session.user.name}</span>
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

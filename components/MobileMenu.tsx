"use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/routing";
import { SignIn, SignOut } from "./auth-components";
import { useTranslations } from "next-intl";

interface MobileMenuProps {
  isLoggedIn: boolean;
  username?: string | null;
  userImage?: string | null;
  userName?: string | null;
  role?: string;
}

export default function MobileMenu({
  isLoggedIn,
  username,
  userImage,
  userName,
  role = "user",
}: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("Header");

  const isAdmin = role === "admin";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  function close() {
    setIsOpen(false);
  }

  return (
    <div ref={menuRef} className="relative">
      {/* 햄버거 버튼 */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "Menu Close" : "Menu Open"}
        aria-expanded={isOpen}
        className="flex flex-col justify-center items-center w-9 h-9 gap-1.5 rounded-md hover:bg-elevated transition-colors cursor-pointer"
      >
        <span
          className={`block w-5 h-px bg-text-primary transition-all duration-200 origin-center`}
        />
        <span
          className={`block w-5 h-px bg-text-primary transition-all duration-200`}
        />
        <span
          className={`block w-5 h-px bg-text-primary transition-all duration-200 origin-center`}
        />
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border-subtle bg-canvas/95 backdrop-blur-md shadow-lg overflow-hidden z-50">
          <div className="flex flex-col py-2">
            {isLoggedIn ? (
              <>
                {/* 프로필 영역 */}
                {(userImage || userName || username) && (
                  <Link
                    href={"/"}
                    onClick={close}
                    className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle hover:bg-elevated transition-colors"
                  >
                    {userImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={userImage}
                        alt={userName ?? "Profile"}
                        className="w-8 h-8 rounded-full object-cover border border-border-subtle"
                      />
                    )}
                    <span className="text-sm font-medium text-text-primary truncate flex items-center">
                      {username || userName}
                      {role === "admin" && (
                        <span className="ml-1.5 px-1.5 py-0.5 text-[8px] font-bold bg-accent text-black rounded-sm uppercase tracking-tighter">
                          Admin
                        </span>
                      )}
                    </span>
                  </Link>
                )}

                {/* 관리자 통합 대시보드 (최상단 노출) */}
                {isAdmin && (
                  <Link
                    href="/admin-portal-v5-secret"
                    onClick={close}
                    className="px-4 py-3 text-sm text-accent bg-accent/5 hover:bg-accent/10 transition-colors font-bold flex items-center gap-2 border-b border-border-subtle"
                  >
                    <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    {t("adminDashboard")}
                  </Link>
                )}

                {/* 로그인한 유저 메뉴 */}
                <Link
                  href="/generate"
                  onClick={close}
                  className="px-4 py-2.5 text-sm text-accent hover:bg-elevated transition-colors font-medium"
                >
                  {t("generate")}
                </Link>
                <Link
                  href="/jobs"
                  onClick={close}
                  className="px-4 py-2.5 text-sm text-text-secondary hover:bg-elevated hover:text-text-primary transition-colors"
                >
                  {t("jobs")}
                </Link>
                <Link
                  href="/settings"
                  onClick={close}
                  className="px-4 py-2.5 text-sm text-text-secondary hover:bg-elevated hover:text-text-primary transition-colors"
                >
                  {t("settings")}
                </Link>

                <Link
                  href="/about"
                  onClick={close}
                  className="px-4 py-2.5 text-sm text-text-secondary hover:bg-elevated hover:text-text-primary transition-colors"
                >
                  {t("about")}
                </Link>

                {/* 로그아웃 */}
                <div className="px-4 py-2.5 border-t border-border-subtle mt-1">
                  <SignOut />
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/about"
                  onClick={close}
                  className="px-4 py-2.5 text-sm text-text-secondary hover:bg-elevated hover:text-text-primary transition-colors"
                >
                  {t("about")}
                </Link>
                <div className="px-4 py-2.5 border-t border-border-subtle mt-1">
                  <SignIn />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

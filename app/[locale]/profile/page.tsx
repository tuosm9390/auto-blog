"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";
import { LoginRequired } from "@/components/ui/LoginRequired";

export default function ProfilePage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="profile-page animate-pulse">
        <div className="h-9 w-36 bg-surface-subtle rounded-md mb-6" />
        <div className="profile-card items-center flex flex-col">
          <div className="w-[100px] h-[100px] rounded-full bg-surface-subtle mb-4" />
          <div className="h-6 w-40 bg-surface-subtle rounded mb-2" />
          <div className="h-4 w-56 bg-surface-subtle rounded" />
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <LoginRequired />
    );
  }

  return (
    <div className="profile-page animate-in">
      <h1 className="page-title">내 프로필</h1>

      <div className="profile-card">
        {session.user.image && (
          <Image
            src={session.user.image}
            alt={session.user.name || "User"}
            width={100}
            height={100}
            className="profile-card__image"
          />
        )}
        <h2 className="profile-card__name">{session.user.name}</h2>
        <p className="profile-card__email">{session.user.email}</p>
      </div>
    </div>
  );
}

"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";

export default function ProfilePage() {
  const { data: session } = useSession();

  if (!session?.user) {
    return (
      <div className="profile-page">
        <p>로그인이 필요합니다.</p>
      </div>
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

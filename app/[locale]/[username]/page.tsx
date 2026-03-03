import { getProfileByUsername } from "@/lib/profiles";
import { getAllPosts } from "@/lib/posts";
import PostsClient from "@/components/PostsClient";
import UserProfileBox from "@/components/UserProfileBox";
import { Metadata } from "next";
import { auth } from "@/auth";

export const revalidate = 60; // 60초마다 캐시 갱신 (ISR)

interface PageProps {
  params: Promise<{ locale: string; username: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username } = await params;
  const plainUsername = decodeURIComponent(username).replace(/^@/, "");

  const profile = await getProfileByUsername(plainUsername);
  const displayName = profile?.name || plainUsername;

  return {
    title: `${displayName} (@${plainUsername}) — Synapso.dev`,
    description: profile?.bio || `${plainUsername}님의 기술 블로그입니다.`,
  };
}

export default async function UserProfilePage({ params }: PageProps) {
  const { username } = await params;
  const plainUsername = decodeURIComponent(username).replace(/^@/, "");

  const [session, profile, userPosts] = await Promise.all([
    auth(),
    getProfileByUsername(plainUsername).then(
      (p) =>
        p || {
          id: "unknown",
          username: plainUsername,
          name: plainUsername,
          avatar_url: null,
          bio: null,
          updated_at: new Date().toISOString(),
        },
    ),
    getAllPosts({
      query: "",
      repo: "",
      tag: "",
      status: "published",
      author: plainUsername,
    }),
  ]);

  const isOwner = session?.user?.username === plainUsername;

  // 현재 유저가 사용한 태그 및 레포지토리 추출
  const userTags = Array.from(new Set(userPosts.flatMap((p) => p.tags || [])));
  const userRepos = Array.from(
    new Set(userPosts.map((p) => p.repo).filter(Boolean)),
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 md:py-16 animate-fade-in-up">
      {/* 유저 프로필 헤더 */}
      <UserProfileBox profile={profile} variant="large" isOwner={isOwner} />

      {/* 포스트 리스트 */}
      <PostsClient
        initialPosts={userPosts}
        tags={userTags}
        repos={userRepos}
        basePath={`/@${plainUsername}`}
      />
    </div>
  );
}

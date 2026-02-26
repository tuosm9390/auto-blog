import { notFound } from "next/navigation";
import { getProfileByUsername } from "@/lib/profiles";
import { getAllPosts } from "@/lib/posts";
import PostsClient from "@/components/PostsClient";
import UserProfileBox from "@/components/UserProfileBox";
import { Metadata } from "next";
import { auth } from "@/auth";

export const revalidate = 60; // 60초마다 캐시 갱신 (ISR)

interface PageProps {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const plainUsername = decodeURIComponent(username).replace(/^@/, "");

  const profile = await getProfileByUsername(plainUsername);
  const displayName = profile?.name || plainUsername;

  return {
    title: `${displayName} (@${plainUsername}) — AutoBlog`,
    description: profile?.bio || `${plainUsername}님의 기술 블로그입니다.`,
  };
}

export default async function UserProfilePage({ params }: PageProps) {
  const session = await auth();
  const { username } = await params;
  const plainUsername = decodeURIComponent(username).replace(/^@/, "");
  const isOwner = session?.user?.username === plainUsername;

  let profile = await getProfileByUsername(plainUsername);

  // 아직 profiles 테이블에 연동되지 않은 작성자를 위한 폴백
  if (!profile) {
    profile = {
      id: "unknown",
      username: plainUsername,
      name: session?.user?.name || plainUsername,
      avatar_url: (session?.user as any)?.avatar_url || session?.user?.image || null,
      bio: null,
      updated_at: new Date().toISOString()
    };
  }

  // 해당 유저의 글만 DB에서 바로 가져오기
  const userPosts = await getAllPosts({ 
    query: "", 
    repo: "", 
    tag: "", 
    status: "published",
    author: plainUsername 
  });

  // 현재 유저가 사용한 태그 및 레포지토리 추출
  const userTags = Array.from(new Set(userPosts.flatMap(p => p.tags || [])));
  const userRepos = Array.from(new Set(userPosts.map(p => p.repo).filter(Boolean)));

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 md:py-16 animate-fade-in-up">
      {/* 유저 프로필 헤더 */}
      <UserProfileBox profile={profile} variant="large" isOwner={isOwner} />

      {/* 포스트 리스트 */}
      <PostsClient initialPosts={userPosts} tags={userTags} repos={userRepos} basePath={`/@${plainUsername}`} />
    </div>
  );
}

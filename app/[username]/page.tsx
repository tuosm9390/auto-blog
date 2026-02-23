import { notFound } from "next/navigation";
import { getProfileByUsername } from "@/lib/profiles";
import { getAllPosts } from "@/lib/posts";
import PostsClient from "@/components/PostsClient";
import UserProfileBox from "@/components/UserProfileBox";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const plainUsername = decodeURIComponent(username).replace(/^@/, "");

  const profile = await getProfileByUsername(plainUsername);
  if (!profile) return { title: "사용자를 찾을 수 없습니다" };

  return {
    title: `${profile.name || plainUsername} (@${plainUsername}) — AutoBlog`,
    description: profile.bio || `${plainUsername}님의 기술 블로그입니다.`,
  };
}

export default async function UserProfilePage({ params }: PageProps) {
  const { username } = await params;
  const plainUsername = decodeURIComponent(username).replace(/^@/, "");

  const profile = await getProfileByUsername(plainUsername);
  if (!profile) {
    notFound();
  }

  // 해당 유저의 글만 가져오기
  const posts = await getAllPosts({ query: "", repo: "", tag: "", status: "published" });
  const userPosts = posts.filter(p => p.author === plainUsername);

  // 현재 유저가 사용한 태그 및 레포지토리 추출
  const userTags = Array.from(new Set(userPosts.flatMap(p => p.tags || [])));
  const userRepos = Array.from(new Set(userPosts.map(p => p.repo).filter(Boolean)));

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 md:py-16 animate-fade-in-up">
      {/* 유저 프로필 헤더 */}
      <UserProfileBox profile={profile} variant="large" />

      {/* 포스트 리스트 */}
      <PostsClient initialPosts={userPosts} tags={userTags} repos={userRepos} basePath={`/@${plainUsername}`} />
    </div>
  );
}

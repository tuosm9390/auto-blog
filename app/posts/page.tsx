import { getAllPosts, getAllTags, getAllRepos } from "@/lib/posts";
import PostsClient from "./PostsClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "포스트 목록 | AI Tech Blog",
  description: "AI가 분석한 개발 인사이트와 기술 글 모음. GitHub 커밋 기반으로 자동 생성된 고품질 기술 블로그입니다.",
  openGraph: {
    title: "포스트 목록 | AI Tech Blog",
    description: "AI가 분석한 개발 인사이트와 기술 글 모음",
  },
};

export const dynamic = "force-dynamic";

export default async function PostsPage() {
  const posts = await getAllPosts();
  const tags = await getAllTags();
  const repos = await getAllRepos();

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 md:py-16 animate-fade-in-up">
      <section className="mb-10">
        <span className="inline-block px-3 py-1 border border-border-subtle rounded-full text-xs tracking-widest text-text-tertiary uppercase mb-4">
          ◆ AI-Powered Dev Blog
        </span>
        <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-2">AutoBlog</h1>
        <p className="text-text-secondary max-w-lg">AI가 분석한 개발 인사이트와 기술 글 모음</p>
      </section>

      <PostsClient initialPosts={posts} tags={tags} repos={repos} />
    </div>
  );
}

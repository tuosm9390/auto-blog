import { getAllPosts, getAllTags, getAllRepos } from "@/lib/posts";
import PostsClient from "@/components/PostsClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const posts = await getAllPosts({ query: "", tag: "", repo: "", status: "published" });
  const tags = await getAllTags();
  const repos = await getAllRepos();

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 md:py-16 animate-fade-in-up">
      <section className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-2">트렌딩</h1>
          <p className="text-text-secondary max-w-lg">새롭게 작성된 기술 블로그 포스트를 만나보세요.</p>
        </div>
      </section>

      {/* 포스트 리스트 (PostsClient 재사용) */}
      <PostsClient initialPosts={posts} tags={tags} repos={repos} />
    </div>
  );
}

import { getAllPosts, getAllTags, getAllRepos } from "@/lib/posts";
import PostsClient from "@/components/PostsClient";
import { getTranslations } from "next-intl/server";

export const revalidate = 60; // 60초마다 캐시 갱신 (ISR)

export default async function HomePage() {
  const [posts, tags, repos, t] = await Promise.all([
    getAllPosts({ query: "", tag: "", status: "published" }),
    getAllTags(),
    getAllRepos(),
    getTranslations("HomePage"),
  ]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 md:py-16 animate-fade-in-up">
      <section className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-2">
            {t("trending")}
          </h1>
          <p className="text-text-secondary max-w-lg">{t("description")}</p>
        </div>
      </section>

      {/* 포스트 리스트 (PostsClient 재사용) */}
      <PostsClient initialPosts={posts} tags={tags} repos={repos} />
    </div>
  );
}

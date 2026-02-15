import Link from "next/link";
import { getAllPosts } from "@/lib/posts";
import PostCard from "@/components/PostCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const posts = await getAllPosts();

  return (
    <div>
      <section className="hero">
        <div className="hero__badge">◆ AI-Powered Dev Blog</div>
        <h1 className="hero__title">AutoBlog</h1>
        <p className="hero__subtitle">
          GitHub 커밋을 AI가 분석하여
          <br />
          개발 과정을 자동으로 기록합니다
        </p>
      </section>

      {posts.length > 0 ? (
        <div className="posts-grid">
          {posts.map((post, index) => (
            <PostCard key={post.slug} post={post} index={index} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state__icon">📝</div>
          <h2 className="empty-state__title">아직 포스트가 없습니다</h2>
          <p className="empty-state__text">
            GitHub 레포지토리를 연결하고 첫 포스트를 생성해보세요
          </p>
          <Link href="/generate" className="empty-state__link">
            ✦ 첫 글 생성하기
          </Link>
        </div>
      )}
    </div>
  );
}

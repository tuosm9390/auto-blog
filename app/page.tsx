import Link from "next/link";
import { getAllPosts, getAllTags } from "@/lib/posts";
import PostCard from "@/components/PostCard";
import SearchInput from "@/components/SearchInput";
import TagFilter from "@/components/TagFilter";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ q?: string; tag?: string }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const { q, tag } = await searchParams;
  const posts = await getAllPosts({ query: q, tag });
  const allTags = await getAllTags();

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

      <div className="search-filter-bar">
        <SearchInput />
        <TagFilter tags={allTags} />
      </div>

      {posts.length > 0 ? (
        <div className="posts-grid">
          {posts.map((post, index) => (
            <PostCard key={post.id} post={post} index={index} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state__icon">🔍</div>
          <h2 className="empty-state__title">검색 결과가 없습니다</h2>
          <p className="empty-state__text">
            다른 검색어 키워드나 태그를 선택해보세요
          </p>
          {(q || tag) && (
            <Link href="/" className="empty-state__link">
              초기화
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

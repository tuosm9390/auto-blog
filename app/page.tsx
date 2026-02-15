import Link from "next/link";
import { getAllPosts, getAllTags, getAllRepos } from "@/lib/posts";
import PostCard from "@/components/PostCard";
import SearchInput from "@/components/SearchInput";
import TagFilter from "@/components/TagFilter";
import RepoFilter from "@/components/RepoFilter";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ q?: string; tag?: string; repo?: string }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const { q, tag, repo } = await searchParams;
  const posts = await getAllPosts({ query: q, tag, repo });
  const allTags = await getAllTags({ repo }); // Filter tags by repo
  const allRepos = await getAllRepos();

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
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flex: 1 }}>
          <RepoFilter repos={allRepos} />
          <SearchInput />
        </div>
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
            다른 검색어 키워드, 태그, 또는 프로젝트를 선택해보세요
          </p>
          {(q || tag || repo) && (
            <Link href="/" className="empty-state__link">
              초기화
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

import { supabaseAdmin as supabase } from "./supabase-admin";
import { DemoPost, PostStatus } from "./types";

/**
 * 마크다운 본문에서 GitHub 커밋 링크를 찾아 텍스트로 치환합니다.
 * 예: https://github.com/user/repo/commit/abc1234 -> [Commit: abc1234]
 */
export function stripGithubLinks(content: string): string {
  const githubCommitRegex = /https:\/\/github\.com\/([a-zA-Z0-9-._]+)\/([a-zA-Z0-9-._]+)\/commit\/([a-f0-9]+)/gi;
  return content.replace(githubCommitRegex, (match, owner, repo, sha) => {
    return `[Commit: ${sha.substring(0, 7)}]`;
  });
}

/**
 * DB 포스트 객체를 안전한 DemoPost 객체로 변환합니다.
 */
function toDemoPost(post: any): DemoPost {
  return {
    ...post,
    id: post.id,
    slug: post.slug || post.id,
    title: post.title,
    date: post.createdAt,
    summary: post.summary || "",
    content: stripGithubLinks(post.content || ""),
    tags: post.tags || [],
    status: "published",
    author: "", // PII 제거
    repo: "",   // PII 제거
    commits: post.commits || [],
  };
}

/**
 * 데모용 공개 포스트 목록을 가져옵니다.
 * 엄격한 필터링: status = 'published', deletedAt = null
 */
export async function getDemoPosts(): Promise<DemoPost[]> {
  const { data: posts, error } = await supabase
    .from("posts")
    .select("*")
    .eq("status", "published")
    .is("deletedAt", null)
    .order("createdAt", { ascending: false });

  if (error || !posts) {
    console.error("Error fetching demo posts:", error);
    return [];
  }

  return posts.map(toDemoPost);
}

/**
 * 슬러그를 기반으로 특정 데모 포스트를 가져옵니다.
 */
export async function getDemoPostBySlug(slug: string): Promise<DemoPost | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
  
  let query = supabase
    .from("posts")
    .select("*")
    .eq("status", "published")
    .is("deletedAt", null);

  if (isUuid) {
    query = query.eq("id", slug);
  } else {
    query = query.eq("slug", slug);
  }

  const { data: post, error } = await query.single();

  if (error || !post) {
    return null;
  }

  return toDemoPost(post);
}

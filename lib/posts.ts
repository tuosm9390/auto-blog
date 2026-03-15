import { supabaseAdmin as supabase } from "./supabase-admin";
import { Post, PostStatus } from "./types";
import { cache } from "react";

function slugify(title: string): string {
  const date = new Date().toISOString().split("T")[0];
  const slug = title
    .toLowerCase()
    .replace(/[^\w\s가-힣-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
  return ${date}-;
}

interface DbPost {
  id: string;
  slug: string;
  title: string;
  content: string;
  summary: string | null;
  repo: string | null;
  commits: string[] | null;
  tags: string[] | null;
  status: PostStatus | null;
  author: string | null;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string | null;
  deleted_by?: string | null;
}

export async function getAllPosts(options?: {
  query?: string;
  tag?: string;
  repo?: string;
  author?: string;
  status?: PostStatus;
  includeContent?: boolean;
}): Promise<Post[]> {
  let queryBuilder = supabase
    .from("posts")
    .select("*")
    .is("deletedAt", null)
    .order("createdAt", { ascending: false });

  if (options?.query) {
    const q = options.query.replace(/[,()]/g, "");
    queryBuilder = queryBuilder.or(
      	itle.ilike.%%,summary.ilike.%%,content.ilike.%%
    );
  }

  if (options?.tag) queryBuilder = queryBuilder.contains("tags", [options.tag]);
  if (options?.repo) queryBuilder = queryBuilder.eq("repo", options.repo);
  if (options?.author) queryBuilder = queryBuilder.eq("author", options.author);

  if (options?.status) {
    queryBuilder = queryBuilder.eq("status", options.status);
  } else {
    queryBuilder = queryBuilder.eq("status", "published");
  }

  const { data: posts, error } = await queryBuilder;
  if (error) {
    console.error("Error fetching posts:", error);
    return [];
  }

  const stripContent = !options?.includeContent;
  return posts.map((post: DbPost) => ({
    ...post,
    id: post.id,
    slug: post.slug || post.id,
    content: stripContent ? "" : post.content,
    summary: post.summary || "",
    repo: post.repo || "",
    commits: post.commits || [],
    tags: post.tags || [],
    status: post.status || "published",
    author: post.author || "",
    date: post.createdAt,
  }));
}

export const getPostById = cache(async function getPostById(id: string): Promise<Post | null> {
  const { data: post, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .is("deletedAt", null)
    .single();

  if (error || !post) return null;

  return {
    ...post,
    summary: post.summary || "",
    repo: post.repo || "",
    commits: post.commits || [],
    tags: post.tags || [],
    status: post.status || "published",
    author: post.author || "",
    date: post.createdAt,
  };
});

export const getPostByUsernameAndSlug = cache(async function getPostByUsernameAndSlug(username: string, slug: string): Promise<Post | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
  let query = supabase
    .from("posts")
    .select("*")
    .eq("author", username)
    .is("deletedAt", null);

  if (isUuid) {
    query = query.eq("id", slug);
  } else {
    query = query.eq("slug", slug);
  }

  const { data: post, error } = await query.single();
  if (error || !post) return null;

  return {
    ...post,
    summary: post.summary || "",
    repo: post.repo || "",
    commits: post.commits || [],
    tags: post.tags || [],
    status: post.status || "published",
    author: post.author || "",
    date: post.createdAt,
  };
});

export async function createPost(
  title: string,
  content: string,
  metadata: {
    summary: string;
    repo: string;
    commits: string[];
    tags: string[];
    status?: PostStatus;
    author?: string;
  }
): Promise<{ id: string; slug: string }> {
  const slug = slugify(title);
  let uniqueSlug = slug;
  const { data: existingSlugs } = await supabase
    .from("posts")
    .select("slug")
    .like("slug", ${slug}%);

  if (existingSlugs && existingSlugs.length > 0) {
    const slugSet = new Set(existingSlugs.map(s => s.slug));
    if (slugSet.has(slug)) {
      let counter = 1;
      while (slugSet.has(${slug}-)) {
        counter++;
        if (counter > 100) throw new Error("slug 생성에 실패했습니다.");
      }
      uniqueSlug = ${slug}-;
    }
  }

  const { data, error } = await supabase
    .from("posts")
    .insert({
      slug: uniqueSlug,
      title,
      content,
      summary: metadata.summary,
      repo: metadata.repo,
      commits: metadata.commits,
      tags: metadata.tags,
      status: metadata.status || "published",
      author: metadata.author || "",
    })
    .select("id, slug")
    .single();

  if (error || !data) throw new Error("포스트 생성에 실패했습니다.");
  return { id: data.id, slug: data.slug };
}

export async function deletePost(id: string, username: string): Promise<boolean> {
  const { error } = await supabase
    .from("posts")
    .update({
      deletedAt: new Date().toISOString(),
      deleted_by: username
    })
    .eq("id", id)
    .eq("author", username);
  return !error;
}

export async function updatePost(
  id: string,
  username: string,
  title: string,
  content: string,
  metadata: {
    summary: string;
    repo: string;
    commits: string[];
    tags: string[];
  }
): Promise<boolean> {
  const { error } = await supabase
    .from("posts")
    .update({
      title,
      content,
      summary: metadata.summary,
      repo: metadata.repo,
      commits: metadata.commits,
      tags: metadata.tags,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("author", username);

  return !error;
}

export async function publishDraft(id: string, username: string): Promise<boolean> {
  const { error } = await supabase
    .from("posts")
    .update({
      status: "published",
      updatedAt: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("author", username);

  return !error;
}

export async function getDraftsByAuthor(author: string): Promise<Post[]> {
  const { data: posts, error } = await supabase
    .from("posts")
    .select("*")
    .eq("author", author)
    .eq("status", "draft")
    .is("deletedAt", null)
    .order("createdAt", { ascending: false });

  if (error || !posts) return [];
  return posts.map((post: DbPost) => ({
    ...post,
    id: post.id,
    slug: post.slug || post.id,
    summary: post.summary || "",
    repo: post.repo || "",
    commits: post.commits || [],
    tags: post.tags || [],
    status: post.status || "draft",
    author: post.author || "",
    date: post.createdAt,
  }));
}

export async function getLastPostDate(author: string, repo: string): Promise<Date | null> {
  const { data } = await supabase
    .from("posts")
    .select("createdAt")
    .eq("author", author)
    .eq("repo", repo)
    .order("createdAt", { ascending: false })
    .limit(1)
    .single();

  return data?.createdAt ? new Date(data.createdAt) : null;
}

export async function getAllTags(options?: { repo?: string }): Promise<string[]> {
  let queryBuilder = supabase
    .from("posts")
    .select("tags")
    .eq("status", "published")
    .is("deletedAt", null);

  if (options?.repo) queryBuilder = queryBuilder.eq("repo", options.repo);

  const { data, error } = await queryBuilder;
  if (error || !data) return [];

  const tags = new Set<string>();
  data.forEach((post: { tags: string[] | null }) => {
    post.tags?.forEach((tag: string) => tags.add(tag));
  });
  return Array.from(tags).sort();
}

export async function getAllRepos(): Promise<string[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("repo")
    .eq("status", "published")
    .is("deletedAt", null);

  if (error || !data) return [];
  const repos = new Set<string>();
  data.forEach((post: { repo: string | null }) => {
    if (post.repo) repos.add(post.repo);
  });
  return Array.from(repos).sort();
}

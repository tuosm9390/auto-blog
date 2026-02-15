import { supabase } from "./supabase";
import { Post } from "./types";

function slugify(title: string): string {
  const date = new Date().toISOString().split("T")[0];
  const slug = title
    .toLowerCase()
    .replace(/[^\w\s가-힣-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
  return `${date}-${slug}`;
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
  createdAt: string;
}

export async function getAllPosts(options?: {
  query?: string;
  tag?: string;
  repo?: string;
}): Promise<Post[]> {
  let queryBuilder = supabase
    .from("posts")
    .select("*")
    .order("createdAt", { ascending: false });

  if (options?.query) {
    const q = options.query;
    queryBuilder = queryBuilder.or(
      `title.ilike.%${q}%,summary.ilike.%${q}%,content.ilike.%${q}%`
    );
  }

  if (options?.tag) {
    queryBuilder = queryBuilder.contains("tags", [options.tag]);
  }

  if (options?.repo) {
    queryBuilder = queryBuilder.eq("repo", options.repo);
  }

  const { data: posts, error } = await queryBuilder;

  if (error) {
    console.error("Error fetching posts:", error);
    return [];
  }

  return posts.map((post: DbPost) => ({
    ...post,
    id: post.id,
    summary: post.summary || "",
    repo: post.repo || "",
    commits: post.commits || [],
    tags: post.tags || [],
    date: post.createdAt, // Supabase returns ISO string
  }));
}

export async function getPostById(id: string): Promise<Post | null> {
  const { data: post, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !post) {
    return null;
  }

  return {
    ...post,
    summary: post.summary || "",
    repo: post.repo || "",
    commits: post.commits || [],
    tags: post.tags || [],
    date: post.createdAt,
  };
}

export async function createPost(
  title: string,
  content: string,
  metadata: {
    summary: string;
    repo: string;
    commits: string[];
    tags: string[];
  }
): Promise<{ id: string; slug: string }> {
  const slug = slugify(title);

  // slug 중복 처리
  let uniqueSlug = slug;
  let counter = 1;

  while (true) {
    const { data } = await supabase
      .from("posts")
      .select("slug")
      .eq("slug", uniqueSlug)
      .single();

    if (!data) break; // 중복 없음

    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  const { data, error } = await supabase.from("posts").insert({
    slug: uniqueSlug,
    title,
    content,
    summary: metadata.summary,
    repo: metadata.repo,
    commits: metadata.commits,
    tags: metadata.tags,
  }).select("id, slug").single();

  if (error) {
    throw new Error(`Failed to create post: ${error.message}`);
  }

  return { id: data.id, slug: data.slug };
}

export async function deletePost(id: string): Promise<boolean> {
  const { error } = await supabase.from("posts").delete().eq("id", id);
  return !error;
}

export async function updatePost(
  id: string,
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
    .eq("id", id);

  return !error;
}

export async function getAllTags(): Promise<string[]> {
  const { data, error } = await supabase.from("posts").select("tags");

  if (error || !data) {
    return [];
  }

  const tags = new Set<string>();
  data.forEach((post: { tags: string[] | null }) => {
    post.tags?.forEach((tag: string) => tags.add(tag));
  });

  return Array.from(tags).sort();
}

export async function getAllRepos(): Promise<string[]> {
  const { data, error } = await supabase.from("posts").select("repo");

  if (error || !data) {
    return [];
  }

  const repos = new Set<string>();
  data.forEach((post: { repo: string | null }) => {
    if (post.repo) {
      // "owner/repo" -> "repo" (optional, but user requested project distinction. 
      // Usually repo name is enough, but full name is safer. 
      // Let's keep full name for uniqueness, maybe display short name in UI)
      repos.add(post.repo);
    }
  });

  return Array.from(repos).sort();
}

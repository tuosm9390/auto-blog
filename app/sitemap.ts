import { MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/posts';

const BASE_URL = 'https://auto-blog-eta.vercel.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 정적 페이지
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/how-it-works`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  // 동적 포스트 페이지
  let postPages: MetadataRoute.Sitemap = [];
  try {
    const posts = await getAllPosts();
    postPages = posts.map((post) => ({
      url: `${BASE_URL}/@${post.author}/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error('Sitemap: 포스트 조회 실패', error);
  }

  return [...staticPages, ...postPages];
}

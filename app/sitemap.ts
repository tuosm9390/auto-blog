import { MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/posts';

const BASE_URL = 'https://synapso-dev.vercel.app';

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
    const posts = await getAllPosts({ includeContent: false });
    const seenAuthors = new Set<string>();
    for (const post of posts) {
      if (!post.author || !post.slug) continue;
      const lastMod = post.date ? new Date(post.date) : new Date();
      // 저자 프로필 페이지 (중복 제거)
      if (!seenAuthors.has(post.author)) {
        seenAuthors.add(post.author);
        postPages.push({
          url: `${BASE_URL}/@${post.author}`,
          lastModified: lastMod,
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        });
      }
      // 개별 포스트 페이지
      postPages.push({
        url: `${BASE_URL}/@${post.author}/${post.slug}`,
        lastModified: lastMod,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      });
    }
  } catch (error) {
    console.error('Sitemap: 포스트 조회 실패', error);
  }

  return [...staticPages, ...postPages];
}

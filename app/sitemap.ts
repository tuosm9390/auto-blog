import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://auto-blog-eta.vercel.app',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://auto-blog-eta.vercel.app/posts',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    // 추후 블로그 포스트를 읽어와서 동적으로 sitemap 항목을 추가할 수 있습니다.
  ];
}

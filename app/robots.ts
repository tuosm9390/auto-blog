import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/settings', '/jobs', '/generate', '/login', '/profile'],
    },
    sitemap: 'https://auto-blog-eta.vercel.app/sitemap.xml',
  };
}

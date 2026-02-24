import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        // 클릭재킹 방지
        { key: "X-Frame-Options", value: "DENY" },
        // MIME 스니핑 방지
        { key: "X-Content-Type-Options", value: "nosniff" },
        // XSS 필터 (레거시 브라우저)
        { key: "X-XSS-Protection", value: "1; mode=block" },
        // 레퍼러 정책
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        // HTTPS 강제 (Vercel은 자동 적용, 로컬/기타 환경 대비)
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        // 불필요한 브라우저 기능 비활성화
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
        // Content Security Policy
        // - self: 자신의 오리진만 허용
        // - github.com: 커밋 링크 이동
        // - avatars.githubusercontent.com: GitHub 아바타 이미지
        // - supabase: DB API 호출
        // - unsafe-inline: Tailwind CSS 인라인 스타일 필요
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https://avatars.githubusercontent.com",
            "font-src 'self'",
            `connect-src 'self' https://*.supabase.co https://api.github.com`,
            "frame-ancestors 'none'",
          ].join("; "),
        },
      ],
    },
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
};

export default nextConfig;

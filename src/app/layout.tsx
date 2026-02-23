import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://your-autoblog-domain.com"),
  title: {
    default: "AI Tech Blog | 개발 및 자동화 인사이트",
    template: "%s | AI Tech Blog"
  },
  description:
    "AI 기반 코드 분석, 기술 트렌드, 자동화 아키텍처 및 소프트웨어 엔지니어링 인사이트를 다루는 전문가의 기술 블로그입니다.",
  keywords: ["기술 블로그", "개발자", "AI", "자동화", "소프트웨어 엔지니어링", "Next.js", "회고", "코드 분석"],
  creator: "AI Tech Blogger",
  openGraph: {
    title: "AI Tech Blog | 개발 및 자동화 인사이트",
    description:
      "AI 기반 코드 분석, 기술 트렌드, 자동화 아키텍처 및 소프트웨어 엔지니어링 인사이트를 다루는 전문가의 기술 블로그입니다.",
    type: "website",
    locale: "ko_KR",
    siteName: "AI Tech Blog",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Tech Blog | 개발 및 자동화 인사이트",
    description: "AI 기반 기술 및 코드 인사이트 자동화 블로그.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}

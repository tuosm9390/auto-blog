import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://auto-blog-eta.vercel.app"),
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

import Providers from "@/components/Providers";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${spaceGrotesk.variable} ${ibmPlexSans.variable} ${jetbrainsMono.variable} bg-canvas text-text-primary font-body min-h-screen flex flex-col`}>
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import "../globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  return {
    metadataBase: new URL("https://synapso-dev.vercel.app"),
    title: {
      default: isEn
        ? "Synapso.Dev | Development & Automation Insights"
        : "Synapso.Dev | 개발 및 자동화 인사이트",
      template: "%s",
    },
    description: isEn
      ? "Expert tech blog focusing on AI-powered code analysis, tech trends, automation architecture, and software engineering insights."
      : "AI 기반 코드 분석, 기술 트렌드, 자동화 아키텍처 및 소프트웨어 엔지니어링 인사이트를 다루는 전문가의 기술 블로그입니다.",
    keywords: [
      "Tech Blog",
      "Developer",
      "AI",
      "Automation",
      "Software Engineering",
      "Next.js",
      "Retrospective",
      "Code Analysis",
    ],
    creator: "AI Tech Blogger",
    openGraph: {
      title: isEn
        ? "Synapso.Dev | Development & Automation Insights"
        : "Synapso.Dev | 개발 및 자동화 인사이트",
      description: isEn
        ? "Expert tech blog focusing on AI-powered code analysis, tech trends, automation architecture, and software engineering insights."
        : "AI 기반 코드 분석, 기술 트렌드, 자동화 아키텍처 및 소프트웨어 엔지니어링 인사이트를 다루는 전문가의 기술 블로그입니다.",
      type: "website",
      locale: locale === "ko" ? "ko_KR" : "en_US",
      siteName: "Synapso.Dev",
    },
    twitter: {
      card: "summary_large_image",
      title: isEn
        ? "Synapso.Dev | Development & Automation Insights"
        : "Synapso.Dev | 개발 및 자동화 인사이트",
      description: isEn
        ? "AI-powered tech and code insight automation blog."
        : "AI 기반 기술 및 코드 인사이트 자동화 블로그.",
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
}

import Providers from "@/components/Providers";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ConfirmProvider from "@/components/ConfirmProvider";
import { Toaster } from "sonner";

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <meta
        name="google-site-verification"
        content="MDjk5WdTY8Pl_7kx3O84WmAebWeKmh2-1BK39ZzeGWA"
      />
      <body
        className={`${spaceGrotesk.variable} ${ibmPlexSans.variable} ${jetbrainsMono.variable} bg-canvas text-text-primary font-body min-h-screen flex flex-col`}
      >
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <ConfirmProvider>
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
              <Toaster
                position="bottom-right"
                theme="dark"
                toastOptions={{
                  className:
                    "border-border-strong rounded-xl bg-elevated text-text-primary font-body !shadow-2xl",
                  style: {
                    background: "var(--color-elevated)",
                    borderColor: "var(--color-border-strong)",
                    color: "var(--color-text-primary)",
                  },
                }}
              />
            </ConfirmProvider>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

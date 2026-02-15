import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "AutoBlog — AI 자동 포스팅 블로그",
  description:
    "GitHub 레포지토리의 커밋 변경사항을 AI가 분석하여 자동으로 블로그 글을 생성합니다.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <Providers>
          <Header />
          <main className="main">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}

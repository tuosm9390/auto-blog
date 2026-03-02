import GenerateForm from "@/components/GenerateForm";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const isEn = (await params).locale === 'en';
  return {
    title: isEn ? "New Post — Synapso.dev" : "새 포스트 생성 — Synapso.dev",
    description: isEn 
      ? "AI analyzes your GitHub repository commits and automatically writes blog posts."
      : "GitHub 레포지토리의 커밋을 AI가 분석하여 블로그 글을 자동으로 작성합니다.",
  };
}

export default function GeneratePage() {
  return <GenerateForm />;
}

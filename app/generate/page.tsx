import GenerateForm from "@/components/GenerateForm";

export const metadata = {
  title: "새 포스트 생성 — AutoBlog",
  description: "GitHub 레포지토리의 커밋을 AI가 분석하여 블로그 글을 자동으로 작성합니다.",
};

export default function GeneratePage() {
  return <GenerateForm />;
}

import { Metadata } from "next";
import { auth } from "@/auth";
import PricingClient from "./PricingClient";
import { getProfileByUsername } from "@/lib/profiles";

export const metadata: Metadata = {
  title: "요금제 안내 | AutoBlog",
  description: "AutoBlog의 요금제를 확인하고 전문성을 높여줄 AI 블로그 자동화 도구를 만나보세요.",
};

export default async function PricingPage() {
  const session = await auth();
  
  let currentTier = "free";
  
  if (session?.user?.username) {
    const profile = await getProfileByUsername(session.user.username);
    if (profile?.subscription_tier) {
      currentTier = profile.subscription_tier;
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 animate-fade-in-up">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight mb-6">
          개발에만 집중하세요.<br className="hidden sm:block" />글쓰기는 AI가 대신합니다.
        </h1>
        <p className="text-lg text-text-secondary">
          코드만 작성하세요. 커밋 내역을 분석해 전문적인 기술 블로그 포스트로 변환해 드립니다.
        </p>
      </div>

      <PricingClient currentTier={currentTier} isAuthenticated={!!session} />
      
      <div className="mt-24 max-w-3xl mx-auto">
        <h3 className="text-2xl font-display font-bold mb-8 text-center">자주 묻는 질문</h3>
        <div className="space-y-6">
          <div className="p-6 border border-border-subtle rounded-xl bg-surface">
            <h4 className="font-semibold text-lg mb-2">생성된 글의 저작권은 누구에게 있나요?</h4>
            <p className="text-text-secondary">
              결과물에 대한 모든 지적 재산권(저작권 등)은 원천 데이터(커밋 및 코드)를 제공한 사용자에게 100% 귀속됩니다. AutoBlog는 여러분의 코드를 AI 학습 모델에 사용하지 않으며, 작업 완료 후 즉시 파기합니다.
            </p>
          </div>
          <div className="p-6 border border-border-subtle rounded-xl bg-surface">
            <h4 className="font-semibold text-lg mb-2">무료로 계속 사용할 수 있나요?</h4>
            <p className="text-text-secondary">
              네, Basic(무료) 플랜은 월 3회 AI 포스트 생성을 평생 무료로 지원합니다. 더 전문적이고 긴 분석이 필요하다면 Pro 플랜으로 업그레이드하세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

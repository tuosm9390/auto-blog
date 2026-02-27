"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface PricingClientProps {
  currentTier: string;
  isAuthenticated: boolean;
}

export default function PricingClient({ currentTier, isAuthenticated }: PricingClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const handleCheckout = async (tier: string, priceId: string) => {
    if (!isAuthenticated) {
      toast("로그인이 필요합니다", { description: "결제를 진행하려면 먼저 로그인해주세요." });
      router.push("/api/auth/signin");
      return;
    }

    if (currentTier === tier) {
      toast.info("이미 이용 중인 요금제입니다.");
      return;
    }

    try {
      setIsLoading(tier);
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "결제 세션 생성 실패");
      }

      // Stripe Checkout 페이지로 이동
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error(error);
      toast.error("오류 발생", { description: error.message });
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Billing Cycle Toggle */}
      <div className="flex justify-center">
        <div className="bg-surface border border-border-subtle rounded-full p-1 flex items-center">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
              billingCycle === "monthly" ? "bg-elevated text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            월간 결제
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
              billingCycle === "yearly" ? "bg-elevated text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            연간 결제
            <span className="text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded-full font-bold">20% 할인</span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-start">
        
        {/* Basic Tier */}
        <div className="border border-border-subtle bg-surface rounded-2xl p-8 flex flex-col h-full">
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-2">Basic</h3>
            <p className="text-text-secondary text-sm">가끔 글을 쓰는 취준생과 주니어를 위한 플랜</p>
            <div className="mt-6">
              <span className="text-4xl font-display font-bold">$0</span>
              <span className="text-text-tertiary"> / month</span>
            </div>
          </div>
          <ul className="space-y-4 mb-8 flex-1 text-sm text-text-secondary">
            <li className="flex gap-3"><span className="text-accent">✓</span> 월 3회 AI 포스트 생성</li>
            <li className="flex gap-3"><span className="text-accent">✓</span> 단일 GitHub 저장소 연동</li>
            <li className="flex gap-3"><span className="text-accent">✓</span> 기본 마크다운 스타일</li>
            <li className="flex gap-3"><span className="text-text-tertiary">✓</span> <span className="opacity-70">AutoBlog 워터마크 포함</span></li>
          </ul>
          <button 
            disabled
            className="w-full py-3 px-4 rounded-xl font-medium border border-border-strong text-text-secondary bg-elevated/50 cursor-not-allowed"
          >
            {currentTier === "free" ? "현재 이용 중" : "기본 플랜"}
          </button>
        </div>

        {/* Pro Tier (Highlighted) */}
        <div className="border-2 border-accent bg-surface rounded-2xl p-8 flex flex-col h-full relative transform md:-translate-y-4 shadow-2xl shadow-accent/5">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent text-black px-4 py-1 rounded-full text-xs font-bold tracking-wide">
            MOST POPULAR
          </div>
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-2 text-text-primary">Pro</h3>
            <p className="text-text-secondary text-sm">퍼스널 브랜딩을 강화하려는 전문 개발자</p>
            <div className="mt-6">
              <span className="text-4xl font-display font-bold">{billingCycle === "yearly" ? "$9" : "$12"}</span>
              <span className="text-text-tertiary"> / month</span>
              {billingCycle === "yearly" && <div className="text-xs text-text-tertiary mt-1">매년 $108 결제됨</div>}
            </div>
          </div>
          <ul className="space-y-4 mb-8 flex-1 text-sm text-text-primary">
            <li className="flex gap-3"><span className="text-accent">✓</span> <strong>월 30회</strong> AI 포스트 생성</li>
            <li className="flex gap-3"><span className="text-accent">✓</span> <strong>Gemini 1.5 Pro</strong> 고급 분석 모델 적용</li>
            <li className="flex gap-3"><span className="text-accent">✓</span> <strong>워터마크 완벽 제거</strong></li>
            <li className="flex gap-3"><span className="text-accent">✓</span> SEO 메타 데이터 자동 최적화</li>
            <li className="flex gap-3"><span className="text-accent">✓</span> 특정 기술 블로그 문체 커스텀</li>
          </ul>
          <button 
            onClick={() => handleCheckout("pro", billingCycle === "yearly" ? "price_pro_yearly_dummy" : "price_pro_monthly_dummy")}
            disabled={isLoading === "pro" || currentTier === "pro"}
            className="w-full py-3 px-4 rounded-xl font-semibold bg-accent text-black hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {isLoading === "pro" ? "처리 중..." : currentTier === "pro" ? "이용 중인 플랜" : "Pro로 업그레이드 ✦"}
          </button>
        </div>

        {/* Business Tier */}
        <div className="border border-border-subtle bg-surface rounded-2xl p-8 flex flex-col h-full">
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-2">Business</h3>
            <p className="text-text-secondary text-sm">기술 홍보가 필요한 기업 및 개발 팀</p>
            <div className="mt-6">
              <span className="text-4xl font-display font-bold">{billingCycle === "yearly" ? "$39" : "$49"}</span>
              <span className="text-text-tertiary"> / month</span>
            </div>
          </div>
          <ul className="space-y-4 mb-8 flex-1 text-sm text-text-secondary">
            <li className="flex gap-3"><span className="text-accent">✓</span> <strong>무제한</strong> 포스트 생성</li>
            <li className="flex gap-3"><span className="text-accent">✓</span> 팀원 계정 통합 및 공동 편집</li>
            <li className="flex gap-3"><span className="text-accent">✓</span> 기업 고유 브랜드 보이스 학습</li>
            <li className="flex gap-3"><span className="text-accent">✓</span> Notion, Velog 자동 퍼블리싱</li>
          </ul>
          <button 
            onClick={() => handleCheckout("business", billingCycle === "yearly" ? "price_biz_yearly_dummy" : "price_biz_monthly_dummy")}
            disabled={isLoading === "business" || currentTier === "business"}
            className="w-full py-3 px-4 rounded-xl font-medium border border-border-strong hover:bg-elevated transition-colors text-text-primary disabled:opacity-50"
          >
            {isLoading === "business" ? "처리 중..." : currentTier === "business" ? "이용 중인 플랜" : "Business 시작하기"}
          </button>
        </div>

      </div>
    </div>
  );
}

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "이용약관 | AutoBlog",
  description: "AutoBlog 서비스 이용약관 및 지적 재산권 정책을 확인하세요.",
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-10">
    <h2 className="text-xl font-semibold mb-4 text-text-primary">{title}</h2>
    <div className="text-text-secondary space-y-3 leading-relaxed">{children}</div>
  </section>
);

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 md:py-24 animate-fade-in-up">
      <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-3">
        이용약관
      </h1>
      <p className="text-text-tertiary text-sm mb-12">최종 업데이트: 2026년 2월 27일</p>

      <Section title="1. 서비스 개요">
        <p>
          AutoBlog("서비스")는 GitHub 커밋 내역을 AI가 분석하여 기술 블로그 포스트를 자동으로
          생성하는 플랫폼입니다. 본 약관은 서비스 이용 시 적용되는 권리와 의무를 규정합니다.
        </p>
      </Section>

      <Section title="2. 지적 재산권 정책">
        <div className="border border-accent/30 bg-accent/5 rounded-xl p-5 space-y-3">
          <h3 className="font-semibold text-text-primary">핵심 원칙: 저작권은 사용자에게 귀속됩니다</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex gap-3">
              <span className="text-accent mt-0.5 flex-shrink-0">✓</span>
              <span>
                <strong className="text-text-primary">저작권 귀속</strong>: AI가 생성한 콘텐츠의
                저작권은 원천 데이터(커밋 및 코드)를 제공한 <strong className="text-text-primary">사용자</strong>에게
                100% 귀속됩니다.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent mt-0.5 flex-shrink-0">✓</span>
              <span>
                <strong className="text-text-primary">최소 라이선스</strong>: AutoBlog는 서비스
                제공(저장, 표시)에 필요한 최소한의 비독점적 라이선스만 보유합니다. 어떤 목적으로도
                제3자에게 사용자 콘텐츠를 판매하거나 양도하지 않습니다.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent mt-0.5 flex-shrink-0">✓</span>
              <span>
                <strong className="text-text-primary">Zero Data Retention</strong>: 분석에 사용된
                원본 코드 및 커밋 데이터는 AI 학습 모델에 활용되지 않으며, 분석 완료 후 즉시
                파기됩니다.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent mt-0.5 flex-shrink-0">✓</span>
              <span>
                <strong className="text-text-primary">삭제 권리</strong>: 사용자가 포스트를 삭제하면
                AutoBlog가 보유한 라이선스도 자동으로 종료됩니다.
              </span>
            </li>
          </ul>
        </div>
      </Section>

      <Section title="3. 사용자 의무">
        <p>사용자는 다음 사항을 준수해야 합니다:</p>
        <ul className="list-disc list-inside space-y-2 text-sm ml-2">
          <li>본인이 권한을 보유한 GitHub 저장소만 분석 대상으로 사용</li>
          <li>서비스를 통해 타인의 지적 재산권을 침해하지 않음</li>
          <li>자동화 도구나 봇을 통한 비정상적인 API 호출 금지</li>
          <li>계정 자격증명을 제3자와 공유하지 않음</li>
        </ul>
      </Section>

      <Section title="4. 서비스 요금제 및 결제">
        <p>
          AutoBlog는 Free, Pro, Business 3가지 요금제를 제공합니다. 유료 플랜의 구독 요금은
          매월 자동 결제되며, Stripe를 통해 안전하게 처리됩니다.
        </p>
        <p>
          구독 취소는 언제든지 가능하며, 취소 시 현재 청구 주기가 끝날 때까지 서비스가 유지됩니다.
          미사용 기간에 대한 환불은 제공되지 않습니다.
        </p>
      </Section>

      <Section title="5. 서비스 가용성 및 면책">
        <p>
          AutoBlog는 서비스의 지속적 가용성을 보장하기 위해 최선을 다하나, 시스템 점검, 외부
          API(GitHub, Google Gemini) 장애 등으로 인한 일시적 중단이 발생할 수 있습니다.
        </p>
        <p>
          AI가 생성한 콘텐츠의 정확성이나 완전성에 대해 AutoBlog는 보증하지 않습니다. 최종
          발행 전 반드시 내용을 검토하시기 바랍니다.
        </p>
      </Section>

      <Section title="6. 개인정보 처리">
        <p>
          AutoBlog는 GitHub OAuth를 통한 로그인 시 공개 프로필 정보(사용자명, 이름, 아바타)만
          수집합니다. 이메일 주소는 결제 처리에만 사용되며 마케팅 목적으로 활용되지 않습니다.
        </p>
      </Section>

      <Section title="7. 약관 변경">
        <p>
          AutoBlog는 서비스 개선을 위해 본 약관을 변경할 수 있습니다. 중요한 변경 사항은 최소
          7일 전에 서비스 내 공지를 통해 안내됩니다.
        </p>
      </Section>

      <Section title="8. 문의">
        <p>
          약관에 관한 문의사항은{" "}
          <a
            href="mailto:devcraft0416@gmail.com"
            className="text-accent hover:text-accent-hover transition-colors"
          >
            devcraft0416@gmail.com
          </a>
          으로 연락해 주세요.
        </p>
      </Section>
    </div>
  );
}

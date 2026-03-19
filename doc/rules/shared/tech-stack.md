Date: 2026-03-19 14:30:00
Author: Antigravity

# 🛠️ Synapso.dev Tech Stack (v0.6.0)

## 1. Core Stack
- **Next.js 16.1.6 (App Router)**: 최신 프레임워크 기반 성능 및 렌더링 최적화.
- **React 19.2.3**: Concurrent Rendering 및 최신 Hook 활용.
- **Tailwind CSS v4.2.0**: CSS-first 구성의 차세대 스타일 엔진.
- **Supabase (PostgreSQL)**: 실시간 데이터베이스 및 RLS 보안 강화.
- **NextAuth.js (v5.0.0-beta.30)**: GitHub OAuth 기반의 안전한 인증 체계.
- **next-intl**: i18n 기반의 글로벌 서비스 지원.

## 2. AI & Third-Party
- **Google Gemini SDK (@google/generative-ai)**: Gemini 2.5 Pro/Flash를 활용한 코드 심층 분석 및 포스트 생성.
- **Stripe SDK**: 구독 관리 및 결제 처리 (`lib/billing.ts`, `lib/stripe.ts`).
- **Octokit**: GitHub API 연동 및 레포지토리/커밋 데이터 관리.
- **Resend**: 트랜잭션 이메일 발송 (`lib/email.ts`).
- **Upstash Redis/Ratelimit**: 서버리스 환경의 분산 레이트 리미팅 처리.

## 3. Security & Validation
- **Zod**: 모든 API 입출력 및 환경 변수의 런타임 타입 검증.
- **Supabase RLS**: 데이터 무결성 및 사용자별 접근 제어를 위한 DB 레벨 보안 정책.
- **isomorphic-dompurify**: 생성된 마크다운 콘텐츠의 XSS 방어.

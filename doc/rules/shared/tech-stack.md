Date: 2026-03-16 12:06:48
Author: Antigravity

# 🛠️ Synapso.dev Tech Stack (v0.5.0)

## 1. Core Stack
- **Next.js 16 (App Router)**: 최신 프레임워크 기반 성능 최적화.
- **Tailwind CSS v4**: CSS-first 구성의 스타일 엔진.
- **Supabase (PostgreSQL)**: 실시간 데이터베이스 및 RLS 보안.
- **NextAuth.js (v5 Beta)**: GitHub OAuth 기반의 안전한 인증.
- **next-intl**: i18n 기반의 글로벌 서비스 지원.

## 2. AI & Third-Party
- **Google Gemini SDK**: Gemini 2.5 Pro를 활용한 GitHub Diff 심층 분석 및 포스트 생성.
- **Stripe SDK**: 구독 및 결제 처리 (illing.ts, stripe.ts).
- **Octokit**: GitHub API 연동 및 레포지토리 관리.

## 3. Security & Validation
- **Zod**: 모든 API 입출력의 런타임 타입 검증.
- **Supabase RLS**: 데이터 무결성 보장을 위한 DB 레벨의 보안 정책.

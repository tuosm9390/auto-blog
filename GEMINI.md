# 📜 Antigravity Master Operational Guidelines - auto-blog

Date: 2026-03-16
Author: Antigravity

## 1. 프로젝트 개요

**auto-blog (Synapso.dev)**는 사용자의 GitHub 커밋 내역을 분석하여 Google Gemini AI를 통해 자동으로 블로그 포스트를 생성해주는 플랫폼입니다.

## 2. 기술 스택 (Tech Stack)

- **Frontend**: Next.js 15 (App Router), Tailwind CSS v4, Lucide React
- **Backend**: Next.js API Routes, Supabase (PostgreSQL), NextAuth v5
- **AI**: Google Gemini SDK (@google/generative-ai)
- **Infrastructure**: Vercel, Stripe (Payments), GitHub API (Octokit)

## 3. 핵심 보안 지침 (Security Mandates)

- **심층 방어 (Defense-in-Depth)**: API 계층의 인증(
  equireAuth)과 데이터 계층(DAL)의 소유권 검증(.eq("author", username))을 반드시 병행한다.
- **Zero Trust**: 클라이언트로부터 오는 모든 입력값은 Zod를 통해 검증하며, 특히 리소스 ID(UUID)에 대한 소유권을 매번 확인한다.
- **RLS 준수**: 데이터베이스 정책은 절대 USING (true)를 사용하지 않으며, JWT의 username을 기반으로 엄격히 제한한다.
- **시크릿 관리**: 모든 API 키와 비밀 정보는 서버측 .env에서만 관리하며 절대로 클라이언트에 노출하지 않는다.

## 4. 진행 상황 (Current Status)

- **v0.5.0 (2026-03-16)**: 보안 강화 작업 완료
  - 모든 API에 IDOR 방어 로직 적용
  - Stripe 웹훅 멱등성(Idempotency) 구현
  - 보안 감사 보고서 및 RLS 개선 스크립트 작성

## 5. 코딩 규칙 (Coding Standards)

- **언어**: 모든 주석과 문서는 한국어를 원칙으로 한다.
- **에러 처리**: 서버의 스택 트레이스를 클라이언트에 노출하지 않으며, 사용자 친화적인 메시지를 반환한다.
- **성능**: 리스트 조회 시 불필요한 content 필드는 스트립(Strip)하여 전송 데이터 크기를 최소화한다.

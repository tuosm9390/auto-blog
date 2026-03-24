# Implementation Plan: Marketing Demo Page

**Branch**: `001-marketing-demo` | **Date**: 2026-03-25 | **Spec**: [specs/001-marketing-demo/spec.md](spec.md)
**Input**: Feature specification from `/specs/001-marketing-demo/spec.md`

## Summary
마케팅 및 고객 전환을 위해 로그인 없이 서비스 결과물(블로그 포스트)을 미리 볼 수 있는 전용 데모 페이지(`/demo`)를 구축합니다. 기존 데모 로직을 아카이브하고, 실제 데이터를 안전하게(개인정보 제거 및 읽기 전용) 노출하며 전환 유도(테스터 신청)에 집중한 레이아웃을 제공합니다.

## Technical Context

**Language/Version**: TypeScript / Next.js 16.1.6, React 19.2.3
**Primary Dependencies**: @supabase/supabase-js, next-auth, tailwindcss v4
**Storage**: Supabase (PostgreSQL)
**Testing**: Integration tests (Playwright or Jest/Vitest for logic)
**Target Platform**: Vercel
**Project Type**: Web Service (SaaS)
**Performance Goals**: < 1s p95 for demo list page (via ISR)
**Constraints**: 
- No PII (Personally Identifiable Information) exposure
- Hardened read-only interaction
- Custom Header for conversion focus
**Scale/Scope**: All public posts accessibility for guest users

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **AI-First**: Does this expose real AI-generated content? (Yes, real blog posts)
- [x] **Security**: Does this prevent IDOR? (Yes, read-only public access specifically scoped)
- [x] **Performance**: Does this use Next.js 16 best practices? (Yes, planning to use ISR)
- [x] **Integrity**: Is TDD planned? (Yes, integration tests for path routing and PII stripping)
- [x] **Type-Safe**: Are data boundaries validated? (Yes, via Zod)

## Project Structure

### Documentation (this feature)

```text
specs/001-marketing-demo/
├── plan.md              # 이 파일
├── research.md          # 조사 결과
├── data-model.md        # 데이터 모델 (필요시)
├── quickstart.md        # 로컬 실행 가이드
├── contracts/           # API/UI 계약
└── tasks.md             # 세부 작업 목록
```

### Source Code (repository root)

```text
app/
├── [locale]/
│   ├── demo/
│   │   ├── page.tsx         # 신규 데모 목록 페이지
│   │   └── [slug]/
│   │       └── page.tsx     # 신규 데모 상세 페이지
│   └── demo-archive/        # 기존 데모 페이지 이동 (아카이브)
components/
├── demo/
│   ├── DemoHeader.tsx       # 데모 전용 헤더
│   └── DemoPostContent.tsx  # PII가 제거된 포스트 컴포넌트
lib/
└── demo.ts                  # 데모용 데이터 페칭 유틸리티 (PII 스트리핑 로직 포함)
```

**Structure Decision**: 신규 경로 `/demo`를 위해 `app/[locale]/demo` 구조를 신설하고, 기존 `/demo`는 `/demo-archive`로 폴더명을 변경하여 보관합니다.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A       | -          | -                                   |

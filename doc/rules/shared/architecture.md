Date: 2026-03-19 14:30:00
Author: Antigravity

# 🏗️ Synapso.dev Architecture (v0.6.0)

## 1. Directory Structure
- **app/[locale]/**: 다국어 지원 페이지 및 레이아웃 (Next.js App Router).
- **app/api/**: 백엔드 API 엔드포인트.
  - **/admin/**: 관리자 전용 기능 (Testers, Users 관리).
  - **/cron/**: 자동 포스팅 크론 잡 로직.
  - **/webhooks/stripe/**: 결제 상태 동기화 웹훅.
- **lib/**: 핵심 비즈니스 로직 및 유틸리티.
  - **ai.ts**: Gemini AI 분석 엔진.
  - **api-utils.ts**: 공통 가드 및 에러 핸들링.
  - **jobs.ts**: 비동기 작업 큐 관리.
- **components/**: 원자적 디자인 패턴 기반 UI 컴포넌트.
- **doc/**: 프로젝트 규칙, 아키텍처, 마케팅 및 결과 문서.

## 2. Database Schema (Supabase)
### profiles Table
- **id** (text, PK): GitHub 고유 ID (sub).
- **username** (text): GitHub 사용자 이름.
- **role** (text): admin, tester, user (default: 'user').
- **email** (text): 사용자 이메일.
- **subscription_tier** (text): free, pro, business (default: 'free').
- **usage_count_month** (int): 이번 달 사용한 AI 생성 횟수.

### tester_applications Table
- **id** (uuid, PK): 신청 고유 ID.
- **user_id** (text, FK): 신청자 프로필 ID.
- **status** (text): pending, approved, rejected.
- **experience** (text): Entry, Junior, Middle, Senior.
- **interests** (text[]): 기술 관심 분야.

### jobs Table
- **id** (uuid, PK): 작업 고유 ID.
- **user_id** (text, FK): 요청자 ID.
- **status** (text): pending, processing, completed, failed.
- **result** (jsonb): AI 분석 결과 데이터.

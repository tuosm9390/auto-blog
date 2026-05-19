Date: 2026-03-19 14:30:00
Author: Antigravity

# 🏗️ Synapso.dev Architecture (v0.6.0)

## 1. Directory Structure
- **app/[locale]/**: 다국어 지원 페이지 및 레이아웃 (Next.js App Router).
- **app/api/**: 백엔드 API 엔드포인트.
  - **/admin/**: 관리자 전용 기능 (Testers, Users 관리).
  - **/cron/**: 구독 결제 갱신 크론 (billing 전용).
  - **/projects/**: 프로젝트 CRUD, drift 조회, refresh 트리거.
  - **/webhooks/portone/**: PortOne 결제 상태 동기화 웹훅.
- **lib/**: 핵심 비즈니스 로직 및 유틸리티.
  - **api-utils.ts**: 공통 가드 및 에러 핸들링.
  - **projects.ts**: 프로젝트 DB CRUD.
  - **project-refresh.ts**: GitHub 커밋 수집 → AI 분석 파이프라인.
  - **project-memory-ai.ts**: Gemini 호출 및 thesis drift AI 분석.
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

### projects Table
- **id** (uuid, PK): 프로젝트 고유 ID.
- **user_id** (text, FK): 소유자 프로필 ID.
- **repo_full_name** (text): GitHub 레포 전체명 (owner/repo).
- **title** (text): 프로젝트 제목.
- **thesis** (text): 핵심 thesis 문장.

### project_plans Table
- **id** (uuid, PK): 플랜 고유 ID.
- **project_id** (uuid, FK): 연결된 프로젝트 ID.
- **content** (text): AI 생성 프로젝트 플랜.

### analysis_runs Table
- **id** (uuid, PK): 분석 실행 고유 ID.
- **project_id** (uuid, FK): 연결된 프로젝트 ID.
- **status** (text): pending, processing, completed, failed.
- **result** (jsonb): AI 분석 결과 (progress%, drift[], blockers).

### state_snapshots Table
- **id** (uuid, PK): 스냅샷 고유 ID.
- **project_id** (uuid, FK): 연결된 프로젝트 ID.
- **snapshot_at** (timestamptz): 스냅샷 시각.
- **data** (jsonb): 해당 시점 프로젝트 상태 전체.

Date: 2026-03-16 12:06:39
Author: Antigravity

# 🏗️ Synapso.dev Architecture (v0.5.0)

## 1. Directory Structure
- pp/[locale]/: 다국어 지원 페이지 (Next.js App Router).
- pp/api/: 백엔드 API 엔드포인트.
  - /admin/: 관리자 전용 API (Testers 등).
  - /tester-apply/: 테스터 신청 API.
- lib/: 비즈니스 로직 및 유틸리티.
  - pi-utils.ts: 권한별 공통 가드 및 에러 핸들링.
- components/: 재사용 가능한 UI 컴포넌트.
- doc/: 모든 프로젝트 문서 및 규칙.

## 2. Database Schema (Supabase)
### profiles Table
- id (text, PK): GitHub 고유 ID (sub).
- username (text): GitHub 사용자 이름.
- ole (text): dmin, 	ester, user (default: 'user').
- email (text): 사용자 이메일.
- subscription_tier (text): ree, pro, usiness (default: 'free').

### 	ester_applications Table
- id (uuid, PK): 신청 고유 ID.
- user_id (text, FK): 신청자 프로필 ID.
- status (text): pending, pproved, ejected.
- experience: Entry, Junior, Middle, Senior.
- interests: Web, App, AI, etc (text[]).

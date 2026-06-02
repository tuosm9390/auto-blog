Date: 2026-03-19 14:30:00
Author: Antigravity

# 🔐 Authentication & Authorization (v0.6.0)

## 1. Identity Management
- 모든 사용자는 GitHub 고유 id (sub)를 Primary Key로 사용합니다.
- 사용자가 GitHub 닉네임을 변경하더라도 sub는 불변이므로 권한 정보가 안전하게 유지됩니다.

## 2. Role-Based Access Control (RBAC)
- **admin**: 전체 시스템 제어 및 관리자 전용 API (`/api/admin/*`) 접근 가능.
- **tester**: `/generate`, `/jobs`, `/settings` 등 유료 수준의 AI 기능 접근 가능.
- **user**: 공개 블로그 조회, 서비스 소개 및 **테스터 신청** 기능만 이용 가능.
- **guest**: 비로그인 상태로 공개된 기술 포스트 및 기본 페이지 조회 가능.

## 3. Implementation Details
- **Middleware/Auth Callback**: `auth.ts` 및 `middleware.ts`에서 페이지 단위 접근 제어를 수행합니다.
- **Server-side Guard**: `lib/api-utils.ts`의 `requireAdminAuth`, `requirePrivilegedAuth`를 활용하여 API 수준에서 무단 접근을 원천 차단합니다.
- **DB RLS**: 사용자가 직접 자신의 `role`을 수정할 수 없도록 Supabase 정책을 엄격히 적용합니다.
- **Session Management**: NextAuth v5를 사용하여 서버 컴포넌트와 클라이언트 컴포넌트 모두에서 안전한 세션 상태를 공유합니다.

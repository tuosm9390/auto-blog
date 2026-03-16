Date: 2026-03-16 12:06:56
Author: Antigravity

# 🔐 Authentication & Authorization (v0.5.0)

## 1. Identity Identity
- 모든 사용자는 GitHub 고유 id (sub)를 Primary Key로 사용합니다.
- 사용자가 GitHub 닉네임을 변경하더라도 sub는 불변이므로 권한 정보가 유지됩니다.

## 2. Role-Based Access Control (RBAC)
- dmin: 전체 기능 및 관리자 전용 API 접근 가능.
- 	ester: /generate, /jobs, /settings 등 유료 서비스 레벨 기능 접근 가능.
- user: 공개된 블로그, 서비스 소개, 요금제 조회 및 **테스터 신청** 기능만 이용 가능.
- guest: 비로그인 상태로 공개된 콘텐츠만 조회 가능.

## 3. Implementation
- **Middleware/Auth Callback**: uth.ts에서 페이지 접근 가드를 수행합니다.
- **Server-side Guard**: lib/api-utils.ts의 equireAdminAuth, equirePrivilegedAuth를 활용하여 API 호출을 차단합니다.
- **DB RLS**: 사용자가 직접 자신의 ole이나 subscription_tier를 수정할 수 없습니다.

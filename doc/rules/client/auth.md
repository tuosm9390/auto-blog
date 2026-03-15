Date: 2026-03-16
Author: Antigravity

# 🔑 인증 및 권한 (Auth Domain)

## 1. 기술적 요건

- **Framework**: NextAuth v5 (Beta) 사용.
- **Middleware**: middleware.ts에서 특정 경로(/generate, /settings 등) 보호.

## 2. 보안 가이드

- auth() 헬퍼를 사용하여 서버 측 세션을 확인한다.
- 모든 API에서
  requireAuth 유틸리티를 호출하여 세션 유효성을 먼저 검증한다.

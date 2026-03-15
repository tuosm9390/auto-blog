# 📝 포스트 및 작업 관리 (Posts & Jobs Domain)

## 1. 데이터 소유권 (Ownership)

- **IDOR 방어**: 모든 포스트 조회, 수정, 삭제 시 username 필드 확인 필수.
- **Soft Delete**: deleted_at 필드를 사용하여 데이터를 영구 삭제하지 않고 플래그 처리한다.

## 2. AI 분석 (Jobs)

- jobs 테이블을 통해 작업 상태(pending, running, completed, failed)를 관리한다.
- lib/ai.ts의 Gemini SDK 호출 시 타임아웃 및 재시도 로직을 준수한다.

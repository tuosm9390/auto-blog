Date: 2026-03-16 10:51:33
Author: Antigravity

# [Implementation Plan] Admin Tester Management System

## Goal

사용자가 테스터를 신청하고, 관리자가 이를 조회/승인/거절할 수 있는 풀스택 시스템 구축.

## Phase 1: Database & API

- [x] **Task 1: SQL 스크립트 작성 및 실행**
  -     ester_applications 테이블 생성 및 RLS 정책 설정.
  - profiles의 user_id와 외래키 연결.
  - Verify: Supabase Dashboard에서 테이블 생성 확인.
- [x] **Task 2: 테스터 신청 API (POST /api/tester-apply)**
  - 일반 유저가 신청 폼 데이터를 제출하면 DB에 저장.
  - Verify: curl 또는 Postman으로 신청 데이터 삽입 확인.
- [x] **Task 3: 관리자 전용 테스터 목록 API (GET /api/admin/testers)**
  - admin 권한 체크 후 전체 신청 목록 반환.
  - Verify: 관리자 세션으로 호출 시 200 OK 및 데이터 확인.
- [x] **Task 4: 테스터 상태 변경 API (PATCH /api/admin/testers/[id])**
  - 승인/거절 상태 업데이트. 승인 시 해당 유저의
    ole을 ester로 변경(선택 사항).
  - Verify: 상태 변경 후 DB 반영 확인.

## Phase 2: User Interface (UI)

- [x] **Task 5: 테스터 신청 페이지 구현 (/tester-apply)**
  - 신청 동기 및 이메일 입력 폼 제작.
  - Verify: 일반 유저 로그인 후 신청 완료 메시지 확인.
- [x] **Task 6: 관리자 테스터 현황 페이지 구현 (/admin/testers)**
  - 신청자 목록 테이블, 상태 필터링, 승인/거절 버튼 구현.
  - Verify: uosm 계정으로 접속하여 목록 조회 및 처리 테스트.

## Phase 3: Verification & Security

- [x] **Task 7: 권한 접근 테스트**
  - 일반 유저가 /admin/testers 접근 시 차단 여부 재확인.
  - Verify: 403 Forbidden 또는 리다이렉트 확인.
- [x] **Task 8: 최종 통합 테스트**
  - 신청 -> 관리자 확인 -> 승인 프로세스 전체 점검.

## Done When

- 일반 유저가 테스터 신청을 완료할 수 있음.
- 관리자( uosm)가 전용 페이지에서 모든 신청 현황을 관리할 수 있음.
- 권한 없는 사용자의 관리자 페이지 접근이 완벽히 차단됨.

### 🛡️ 추가된 보안 강화 조치 (Completed)
- GitHub 고유 ID(sub) 기반 권한 식별 (닉네임 변경 이슈 해결)
- API 유틸리티(equirePrivilegedAuth)를 통한 서버 사이드 2중 검증
- Supabase RLS를 통한 사용자 직접 권한 수정 차단


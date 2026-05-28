# Checklist

## 2026-05-28 Evidence Draft Display Fix Plan

- [x] 현재 문서 관리 페이지와 editor 렌더링 구조 확인.
- [x] 탭 전환 시 제목과 본문이 유지되는 원인 분석.
- [x] 저장 전 template 초안 표시 정책 정의.
- [x] 구현 계획서 작성.
- [x] 변경 파일 검토.
- [x] 커밋 생성.

## 2026-05-28 Project Documents Implementation

- [x] 구현 결정 사항과 기존 코드 경계 재확인.
- [x] `project_documents` companion SQL 추가.
- [x] ProjectDocument 타입, 템플릿, readiness, 데이터 접근 함수 추가.
- [x] 문서 생성, 저장, 적용, 제외 서버 액션 추가.
- [x] `/projects/[id]/documents` 페이지와 컴포넌트 추가.
- [x] 프로젝트 상세 페이지 Documents 진입점 추가.
- [x] refresh 분석 파이프라인에 applied documents 연결.
- [x] 한국어와 영어 메시지 추가.
- [x] 빌드와 lint 검증.
- [x] 변경 사항 커밋.

## 2026-05-28 Project Documents Implementation Plan

- [x] 기존 Project Documents 설계 문서와 실제 코드 경계 확인.
- [x] DB, 타입, 서버 액션, UI, 분석 파이프라인 구현 단위 분해.
- [x] 구현 순서와 검증 기준 정의.
- [x] 구현 계획서 작성.
- [x] 변경 파일 검토.
- [x] 커밋 생성.

## 2026-05-28 Project Documents Feature Design

- [x] 현재 Project Memory 저장 모델과 프로젝트 상세 UI 확인.
- [x] 기존 Evidence 문서 초안과 문서 관리 페이지 전제 확인.
- [x] 문서 확인, 수정, 적용, 저장 기능의 제품 역할 정의.
- [x] 구현 후보 접근 방식과 권장 범위 정리.
- [x] 기능 설계 문서 작성.
- [x] 변경 파일 검토.
- [x] 커밋 생성.

## 2026-05-26 GitHub OAuth redirect_uri 오류 수정

- [x] 인증 구현과 로그인 액션 확인.
- [x] OAuth 공개 URL 환경변수와 callback 경로 확인.
- [x] redirect_uri 불일치 원인 수정.
- [x] 관련 검증 실행.
- [x] 변경 사항 커밋.

## 2026-05-26 개별 Evidence 문서와 문서 관리 페이지 전제

- [x] 현재 프로젝트 상세/runs/drift/edit 페이지 구조 확인.
- [x] Evidence Pack 8종을 개별 문서로 분리.
- [x] 각 문서별 역할, 사용 시점, 상태 판단 신호, 초안 작성.
- [x] 프로젝트 문서 관리 페이지 전제 작성.
- [x] 변경 파일 검토.
- [x] 커밋 생성.

## 2026-05-26 Evidence Pack 템플릿 작성

- [x] 기존 Project Memory 저장 모델과 PRD 템플릿 구조 확인.
- [x] Evidence Pack 산출 범위 확정.
- [x] 프로젝트 상태 판단용 문서 초안 8종 작성.
- [x] 변경 파일 검토.
- [x] 커밋 생성.

## 2026-05-26 프로젝트 관리 문서 전제 정리

- [x] 현재 Project Memory 제품 방향과 기존 문서 구조 확인.
- [x] 프로젝트 관리 및 소프트웨어 개발 문서 유형 외부 자료 조사.
- [x] 가장 많이 반복되는 문서 유형을 Synapso.dev 관리 환경 기준으로 재분류.
- [x] 전제 문서 작성.
- [x] 변경 파일 검토.

## 2026-05-07 PRD Template Guidance

- [x] Inspect project editor and localization structure.
- [x] Add a PRD markdown template guide to the project form.
- [x] Add Korean and English localized template copy.
- [x] Verify JSON, typecheck, and build.
- [ ] Commit the logical change.

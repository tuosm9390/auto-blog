Date: 2026-03-16 14:15:00
Author: Antigravity (기획팀 클리오)

# [최종 리뷰 패키지] 유저 권한 호출 예외 처리 및 기본값 적용 사양

## 1. 개요
본 문서는 synapso.dev 플랫폼의 유저 인증 과정에서 발생하는 권한(Role) 호출 예외 상황에 대한 비즈니스 로직 보완 사항을 정의합니다. 아리아 팀장님의 지적 사항인 "DB 조회 실패 시 기본값(\"user\") 제공"을 보장하여 시스템 안정성을 확보하는 것이 목적입니다.

## 2. 현황 및 문제점
- **현행 로직**: auth.ts의 jwt 콜백에서 upsertProfile 호출 실패(null 반환) 시 token.role을 설정하지 않음.
- **리스크**: 권한 정보가 누락된 유저는 세션에서 role이 undefined로 표시되어, 권한 기반 UI/UX(관리자 메뉴, 유료 기능 등)에서 오동작을 일으킬 수 있음.

## 3. 수정 요구 사양 (Specification)

### 3.1. 기본값 정책
- 모든 유저는 별도의 권한이 명시되지 않거나 DB 조회에 실패할 경우 **기본 권한(\"user\")**을 가짐.
- 적용 우선순위:
    1. DB 조회 성공 시: dbProfile.role
    2. DB 조회 성공했으나 role 값이 없는 경우: \"user\"
    3. DB 조회 실패(Error/Null) 시: \"user\"

### 3.2. 파일별 수정 가이드 (개발팀 전달용)

#### [대상 파일: auth.ts]
- jwt 콜백 내부의 upsertProfile 호출 로직 보완:
    - try-catch 블록 내에서 token.role에 기본값 \"user\"를 명시적으로 할당.
    - dbProfile이 존재할 때만 해당 값으로 덮어쓰기 수행.
    - 에러 발생 시 로그를 남기되, token.role은 \"user\"를 유지.

`	ypescript
// 수정 제안 (Pseudocode)
try {
  const dbProfile = await upsertProfile({...});
  token.role = dbProfile?.role || \"user\"; // 안전한 체이닝 및 폴백
} catch (err) {
  console.error(\"Failed to sync profile:\", err);
  token.role = \"user\"; // 예외 발생 시 기본값 보장
}
`

## 4. 기대 효과
- DB 장애나 네트워크 지연 등 예외 상황에서도 유저의 최소 권한을 보장하여 서비스 연속성 유지.
- 프론트엔드 UI에서 role 기반 렌더링 시 발생할 수 있는 런타임 에러 예방.

## 5. 승인 요청
- 아리아 팀장님 (개발 총괄): 코드 수준의 폴백 로직 정합성 확인 요청.
- 세이지 팀장님 (기획 파트): 비즈니스 정책 준수 여부 최종 확인.

---
*본 문서는 기획팀 클리오에 의해 작성되었으며, 실무 반영은 개발팀 서브태스크를 통해 진행될 예정입니다.*

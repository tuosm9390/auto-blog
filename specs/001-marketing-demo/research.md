# Research: Marketing Demo Page

**Date**: 2026-03-25  
**Feature**: Marketing Demo Page (`001-marketing-demo`)

## 1. 기존 데모 시스템 분석 및 아카이브 전략

### Findings
- 기존 데모 시스템은 `app/[locale]/demo`와 `app/api/demo`에 위치하며, 사용자 GitHub 계정을 연동하여 즉석에서 포스트를 생성해보는 기능을 제공함.
- 신규 마케팅 요구사항은 "이미 생성된 포스트들을 둘러보는 갤러리" 형태이므로 기존 로직과 충돌함.

### Decision
- **기존 코드 보존**: 기존 데모 기능은 추후 참고를 위해 `app/[locale]/demo-archive`로 이동함.
- **라우팅 전환**: 새로운 마케팅용 갤러리는 `/demo` 경로를 그대로 사용하여 마케팅 URL의 일관성을 유지함.

---

## 2. PII (개인식별정보) 스트리핑 전략

### Findings
- `Post` 테이블의 `author`, `repo` 컬럼에는 실제 유저의 GitHub ID와 리포지토리명이 저장됨.
- 마크다운 본문(`content`) 내에 AI가 생성한 커밋 링크들이 포함되어 있을 수 있음.

### Decision
- **데이터 수준 가공**: `lib/demo.ts` 유틸리티를 만들어 `getAllPosts` 호출 결과를 가공함.
    - `post.author = ""`, `post.repo = ""` 로 초기화.
- **콘텐츠 수준 가공**: `DemoPostContent` 컴포넌트에서 마크다운 렌더링 전 정규표현식을 통해 GitHub 링크를 비활성화함.
    - 대상 패턴: `https://github.com/[^/]+/[^/]+/commit/[a-f0-9]+`
    - 치환: `[Commit: short-sha]` (링크 기능 제거)

---

## 3. 성능 및 렌더링 전략 (ISR)

### Findings
- 데모 페이지는 실시간성이 아주 중요하지는 않지만, 새로운 포스트가 공개될 때 반영되어야 함.
- 많은 사용자가 동시에 접근할 마케팅 페이지이므로 정적 생성이 유리함.

### Decision
- **ISR 적용**: `revalidate = 3600` (1시간) 주기를 적용함.
- **데이터 소스**: `status = 'published'` 상태인 모든 포스트를 쿼리함.

---

## 4. UI/UX: 데모 전용 레이아웃

### Findings
- 기존 `Header` 컴포넌트는 로그인 정보, 프로필, 설정 등 많은 메뉴를 포함함.
- 마케팅 페이지는 사용자 전환(테스터 신청)에 집중해야 함.

### Decision
- **신규 컴포넌트**: `components/demo/DemoHeader.tsx` 생성.
    - 좌측: 서비스 로고 (클릭 시 `/demo` 이동)
    - 우측: `LanguageSwitcher`, `TesterApplyButton` (강조된 버튼)
- **제거된 요소**: 내비게이션 바, 유저 프로필 박스, 검색(선택사항, 일단 제거).

---

## 5. Alternatives Considered
- **Option A**: 기존 `Header`에 `isDemo` prop을 추가하여 분기 처리.
    - **Rejected**: 조건부 로직이 너무 복잡해지고, 데모 페이지 전용 스타일링을 적용하기 어려움.
- **Option B**: 데이터베이스에서 데모용 포스트를 따로 관리.
    - **Rejected**: 중복 데이터 관리 비용 발생. 실제 운영되는 블로그의 모습을 보여주는 것이 마케팅 효과가 더 좋음.

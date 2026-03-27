# Changelog

All notable changes to Synapso.dev are documented in this file.

---

## [0.2.1] - 2026-03-27

### Added

- **JSON-LD 구조화 데이터 (GEO+SEO):** Schema.org 마크업 전 페이지 적용
  - `WebSite` + `SearchAction` — 루트 레이아웃 (모든 페이지 공통)
  - `BlogPosting` + `BreadcrumbList` — 포스트 상세 페이지
  - `ProfilePage` + `Person` — 유저 프로필 페이지
- **`components/KeyTakeaways.tsx`:** 포스트 요약을 AI 엔진 인용에 최적화된 핵심 요약 블록으로 노출
- **canonical URL + og:url:** 포스트 및 프로필 메타데이터에 중복 콘텐츠 방지용 canonical 추가

### Fixed

- **sitemap.ts:** 개별 포스트 URL 누락 버그 수정 — 저자 프로필 URL만 포함되던 것을 포스트 개별 URL도 포함하도록 수정
- **sitemap.ts:** 빈 author/slug 포스트의 무효 URL 삽입 방지 + Invalid Date 처리 강화
- **JSON-LD XSS 방어:** `dangerouslySetInnerHTML` 내 `<`, `>`, `&` 이스케이프로 스크립트 인젝션 방지

---

## [0.2.0] - 2026-03-26

### Added

- **AI Reverse Spec Recovery (5-section output format):** AI 분석 결과가 5개의 구조화된 섹션으로 출력됨
  - `커밋 분석` — 커밋 개발내역 요약
  - `작업 순서` — 커밋 순서 기반 작업 흐름 분석
  - `핵심 코드` — 핵심 기능 및 코드 분석
  - `개발 스토리` — 요구사항 → 기획 → 개발 순서의 개발 스토리
  - `핵심 교훈` — 이번 작업의 주요 인사이트
- **userContext (개발 배경 입력):** 포스트 생성 시 500자 이내의 개발 맥락을 직접 입력 가능. 레포지토리별 localStorage에 자동 저장/복원
- **5-탭 JobCard 뷰어:** 분석 완료된 작업을 섹션별 탭으로 탐색 가능. 구형 포맷은 "전체" 탭 fallback으로 하위 호환성 유지
- **CommitTimeline 컴포넌트:** "작업 순서" 탭에서 커밋 SHA를 GitHub 링크와 함께 순서대로 시각화
- **AI 추론 배지:** "개발 스토리" 탭에서 userContext 입력 여부에 따라 "AI 추론 결과" / "사용자 컨텍스트 반영됨" 배지 표시
- **`lib/constants/sections.ts`:** SECTION_HEADINGS 상수를 AI 프롬프트 검증과 클라이언트 탭 파싱이 공유하는 단일 소스로 추출
- **`components/jobs/parseContentSections.ts`:** 마크다운 content를 5-섹션 탭 배열로 파싱하는 유틸 (코드블록 내 헤딩 오탐 방지 포함)
- **`DESIGN.md`:** 프로젝트 디자인 시스템 공식 문서화 (색상 토큰, 컴포넌트 패턴, 접근성 기준)
- i18n: `Generate`/`Jobs` 네임스페이스에 신규 키 추가 (한국어/영어)

### Changed

- **`lib/ai.ts` 리팩터링:** `generateWithRetry`가 `ParsedResult`를 직접 반환하도록 변경 (이중 JSON 파싱 제거). `buildPrompt`에 80,000자 토큰 가드 추가
- **`lib/jobs.ts`:** `runAIAnalysisBackground`에 `userContext` 파라미터 추가
- **`app/api/generate/route.ts`:** Zod 스키마에 `userContext: z.string().max(500).optional()` 추가
- **`components/GenerateForm.tsx`:** userContext textarea + 글자 수 카운터 + localStorage 500ms 디바운스 저장

---

## [0.1.0] - initial release

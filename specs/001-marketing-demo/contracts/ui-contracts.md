# UI Contract: Demo Components

## 1. `DemoHeader` Component
마케팅 최적화 헤더입니다.

**Props**:
- `locale`: string (현재 언어)

**Elements**:
- Logo (Left): `synapso.dev` 텍스트/로고. 클릭 시 `/[locale]/demo`로 이동.
- Action Group (Right):
    - `LanguageSwitcher`: 기존 i18n 컴포넌트 재사용.
    - `TesterApplyButton`: "테스터 신청하기" 버튼. 강조 스타일 적용. 클릭 시 `/[locale]/tester-apply`로 이동.

---

## 2. `DemoPostCard` Component
목록에서 개별 포스트를 보여주는 카드입니다.

**Props**:
- `post`: `DemoPost` 객체

**Visual Constraints**:
- 수정/삭제 버튼 노출 금지.
- 작성자(author) 프로필 아바타 및 이름 노출 금지.
- 리포지토리명 노출 금지.

---

## 3. `DemoPostContent` Component
포스트 본문을 렌더링하는 컴포넌트입니다.

**Props**:
- `content`: string (Markdown)

**Processing**:
- 렌더링 전 Regex 가공:
    - Target: `https://github.com/([a-zA-Z0-9-._]+)/([a-zA-Z0-9-._]+)/commit/([a-f0-9]+)`
    - Replace: `<span class="commit-sha">[Commit: $3]</span>`
- 마크다운 파서 옵션에서 `link` 태그의 `target="_blank"` 속성 및 특정 도메인 필터링 적용.

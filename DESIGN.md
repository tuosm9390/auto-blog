# Synapso.dev Design System

> 이 문서는 Synapso.dev의 디자인 시스템 레퍼런스입니다.
> `/plan-design-review`, `/design-review` 스킬은 이 문서를 기준으로 설계 결정을 평가합니다.

---

## 1. 디자인 철학

- **개발자 우선 (Developer-first):** 사용자의 대부분은 개발자다. UI는 군더더기 없이 명확해야 하며, 정보 밀도와 가독성을 우선한다.
- **의도된 미니멀리즘:** 화면에 없어도 되는 요소는 존재하지 않는다. 모든 UI 요소는 기능적 이유가 있어야 한다.
- **신뢰 구축:** 계정과 코드 데이터를 다루는 서비스이므로 모든 인터페이스 결정은 신뢰를 높이는 방향으로 설계된다.
- **AI 슬롭 금지:** 제네릭 카드 그리드, 범용 히어로 섹션, "모던한 UI" 등의 표현은 실제 설계 결정이 아니다. 구체적인 토큰/패턴으로 대체한다.

---

## 2. 색상 토큰

Tailwind v4 기반의 CSS 커스텀 프로퍼티를 사용한다.

### 텍스트

| 토큰 | 용도 |
|------|------|
| `text-text-primary` | 제목, 본문 주요 텍스트 |
| `text-text-secondary` | 설명, 보조 정보 |
| `text-text-tertiary` | 힌트, 플레이스홀더, 비활성 라벨 |

### 배경/표면

| 토큰 | 용도 |
|------|------|
| `bg-surface` | 카드·입력 배경 (기본) |
| `bg-elevated` | 호버 상태, 탭 패널 내부, 배지 배경 |

### 테두리

| 토큰 | 용도 |
|------|------|
| `border-border-subtle` | 기본 카드·입력 테두리 |
| `border-border-strong` | 포커스, 선택됨 상태 |

### 액센트 (브랜드 컬러)

| 토큰 | 용도 |
|------|------|
| `text-accent` | 링크, 활성 탭 텍스트, 아이콘 강조 |
| `bg-accent` | 주요 CTA 버튼 배경 |
| `bg-accent-hover` | CTA 버튼 호버 |
| `bg-accent/5` | AI 배지·힌트 배너 배경 (미세 틴트) |
| `border-accent` | 활성 탭 언더라인, AI 배지 왼쪽 테두리 |
| `border-accent/30` | 상태 배지 테두리 (처리 중) |

### 상태 컬러

| 토큰 | 용도 |
|------|------|
| `text-success` / `bg-success` | 완료 배지, 성공 버튼 (`text-black` 조합) |
| `text-error` / `bg-error` | 에러 메시지, 글자 수 초과 |
| `bg-success/20`, `bg-error/20` | 상태 배지 배경 (반투명) |
| `text-yellow-500` | 경고 (글자 수 경계, 남은 횟수 부족) |

---

## 3. 타이포그래피

| 역할 | 클래스 |
|------|--------|
| 페이지 제목 (h1) | `text-3xl font-display font-bold` |
| 섹션 제목 (h2) | `text-lg font-semibold` |
| 카드 제목 (h3) | `text-lg font-semibold` |
| 본문 | `text-sm` (기본) |
| 보조 설명 | `text-sm text-text-secondary` |
| 메타 정보 | `text-xs text-text-tertiary` |
| 코드/SHA | `font-mono text-sm` |

---

## 4. 컴포넌트 패턴

### 4-1. 탭 내비게이션 (Tab Navigation)

```tsx
// 활성 탭
"border-b-2 border-accent text-text-primary font-medium"

// 비활성 탭
"border-b-2 border-transparent text-text-tertiary hover:text-text-secondary"

// 공통
"flex-shrink-0 whitespace-nowrap px-4 py-2 text-sm transition-colors -mb-px"

// 컨테이너 (모바일 가로 스크롤)
"flex overflow-x-auto scrollbar-none border-b border-border-subtle"
```

- `role="tablist"` / `role="tab"` / `role="tabpanel"` 필수
- 활성 탭에 `aria-selected={true}`, `aria-controls="tabpanel-{id}-{label}"` 필수
- 기본 탭: 콘텐츠 중 가장 핵심 섹션 (예: `개발 스토리`)

### 4-2. AI 배지 / 힌트 배너

```tsx
"border-l-2 border-accent bg-accent/5 rounded-r-lg px-3 py-2 text-sm text-text-secondary"
```

- AI가 추론한 정보임을 나타낼 때 사용
- `✦ {메시지}` 형식으로 아이콘 접두어 사용
- 조건부 렌더링: 해당 콘텐츠가 보이는 탭에서만 표시

### 4-3. 상태 배지 (Status Badge)

```tsx
// 완료
"bg-success/20 text-success border border-success/30"

// 실패
"bg-error/20 text-error border border-error/30"

// 처리 중
"bg-accent/20 text-accent border border-accent/30 animate-pulse"

// 대기
"bg-elevated text-text-tertiary border border-border-subtle"

// 공통
"px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
```

### 4-4. 입력 필드 / Textarea

```tsx
// 기본 input/textarea
"bg-surface border border-border-subtle rounded-lg px-4 py-3 text-sm text-text-primary
 placeholder:text-text-tertiary focus:outline-none focus:border-border-strong"

// textarea 추가
"resize-none"
```

- `htmlFor`–`id` 연결 필수
- `maxLength` 설정 시 글자 수 카운터 표시 (`aria-live="polite"`)

### 4-5. 글자 수 카운터

```tsx
const color =
  count >= 500 ? "text-error"
  : count >= 450 ? "text-yellow-500"
  : "text-text-tertiary";
```

- 0–449: `text-text-tertiary`
- 450–499: `text-yellow-500` (경고)
- 500 (최대): `text-error`

### 4-6. CTA 버튼

```tsx
// 주요 (accent)
"px-6 py-3 bg-accent text-black font-semibold rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50"

// 성공 (게시/완료)
"bg-success text-black font-semibold rounded-lg hover:opacity-90 transition-all"

// 보조 (outline)
"border border-border-subtle rounded-lg text-sm text-text-secondary hover:border-border-strong transition-colors"

// 위험 (삭제)
"text-text-tertiary hover:text-error transition-colors"
```

- 비활성 상태: `disabled:opacity-50 cursor-not-allowed`
- 로딩 상태: 텍스트를 로딩 메시지로 교체 (스피너 미사용)

### 4-7. 카드 컨테이너

```tsx
// 기본 카드
"border border-border-subtle rounded-xl p-6 bg-surface/30 hover:border-border-strong transition-all"

// 섹션 그룹 (폼 영역)
"border border-border-subtle rounded-xl p-6 space-y-4"
```

### 4-8. CommitTimeline (커밋 순서 시각화)

- 원형 번호 + 세로 연결선 + SHA GitHub 링크 구조
- 링크: `https://github.com/{owner}/{repo}/commit/{sha}` (`target="_blank"`, `rel="noopener noreferrer"`)
- SHA 표시: `sha.substring(0, 7)` + 외부 링크 아이콘
- 컨테이너: `aria-label="커밋 작업 순서"`

---

## 5. 레이아웃

### 페이지 기본 레이아웃

```tsx
"max-w-3xl mx-auto px-4 py-12 md:py-16 animate-fade-in-up"
```

### 그리드

- 2열 그리드: `grid sm:grid-cols-2 gap-4` (입력 필드 쌍)
- 버튼 정렬: `flex justify-end` (우측 정렬), `flex gap-3 justify-end` (복수 버튼)

---

## 6. 애니메이션

| 클래스 | 용도 |
|--------|------|
| `animate-fade-in-up` | 페이지/섹션 진입 |
| `animate-in slide-in-from-top-4 duration-300` | 확장 콘텐츠 열림 |
| `animate-pulse` | 처리 중 상태 배지 |
| `transition-colors` | 색상 전환 (hover, focus) |
| `transition-all` | 복합 속성 전환 |

---

## 7. 접근성 기준

- **키보드 탐색:** 모든 인터랙티브 요소는 Tab으로 포커스 가능해야 한다.
- **ARIA:**
  - 탭: `role="tablist/tab/tabpanel"`, `aria-selected`, `aria-controls`
  - 라이브 영역: `aria-live="polite"` (글자 수 카운터 등)
  - 폼 연결: `htmlFor` + `id` 쌍
  - 아이콘 전용 SVG: `aria-hidden="true"`
  - 의미 있는 영역: `aria-label` (예: `aria-label="커밋 작업 순서"`)
- **색상 대비:** 모든 텍스트는 WCAG AA 기준(4.5:1) 이상을 유지한다.
- **터치 타겟:** 최소 44×44px (버튼, 링크)

---

## 8. 반응형

- **기본 접근:** 모바일 우선, `sm:` 브레이크포인트로 데스크탑 레이아웃 추가
- **탭 내비게이션:** 모바일에서 `overflow-x-auto scrollbar-none` 가로 스크롤
- **그리드:** `grid sm:grid-cols-2` → 모바일 1열, 데스크탑 2열
- **헤더 섹션:** `flex flex-col md:flex-row` 분기

---

## 9. 네이밍 컨벤션

- 컴포넌트: `PascalCase` (예: `JobCard`, `CommitTimeline`)
- CSS 클래스: Tailwind 유틸리티 직접 사용, 커스텀 CSS 최소화
- i18n 키: `PascalCase` 네임스페이스 + `camelCase` 키 (예: `Jobs.aiInferredBadge`)
- localStorage 키: `synapso_{feature}_{identifier}` (예: `synapso_user_context_{repoName}`)

---

## 10. 반드시 하지 말 것

- `outline: none` 단독 사용 (포커스 링 제거 금지)
- `!important` 사용 (캐스케이드 파괴)
- `font-size < 16px` 입력 요소 (iOS 자동 줌 트리거)
- 제네릭 "Clean, modern UI" 기술 (실제 토큰/패턴으로 대체)
- 탭 컴포넌트에서 ARIA 속성 누락
- AI 배지를 모든 탭에 표시 (해당 콘텐츠 탭에만 조건부 표시)

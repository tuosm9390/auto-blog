# 프로젝트 리팩토링 계획서

## Context

Synapso.dev 코드베이스(19개 컴포넌트 ~1,484줄, 17개 API 라우트 ~1,269줄)에서 **22가지 중복/비일관성 문제**를 확인했다. 재사용 가능한 UI 컴포넌트가 분리되지 않아 동일한 버튼/카드/체크박스 스타일이 20회 이상 인라인으로 반복되고, API 라우트에서는 인증 보일러플레이트가 15곳에서 중복되며, Stripe 관련 5개 라우트가 `lib/` 아키텍처 원칙을 위반하고 있다. 이 리팩토링은 코드 중복을 제거하고 일관된 패턴을 확립하여 유지보수성을 높이는 것이 목적이다.

---

## Phase 1: 기반 유틸리티 및 타입 정리

### 1-1. 인라인 타입을 `lib/types.ts`로 통합

`lib/types.ts`에 추가:

```typescript
export interface Repo {
  name: string;
  full_name: string;
  private: boolean;
}
export interface SubscriptionInfo {
  tier: string;
  usageCount: number;
  monthlyLimit: number;
  remaining: number;
  resetDate: string | null;
}
```

수정 파일:

- `components/GenerateForm.tsx` — 인라인 `Repo`, `UsageInfo` 제거 → `lib/types.ts` import
- `app/[locale]/settings/page.tsx` — 인라인 `Repo`, `UserSettingsData`, `SubscriptionInfo` 제거 → import

### 1-2. 날짜 포맷 유틸리티 추출

신규: `lib/date.ts`

- `formatDateTime(date, locale)` — `yyyy.MM.dd HH:mm` 패턴
- `formatShortDate(date, locale)` — `M/d HH:mm` 패턴
- `getDateLocale(locale)` — `ko`/`enUS` 분기

수정 파일 (중복 제거):

- `components/GenerateForm.tsx` — `date-fns` locale import + 분기 로직 제거
- `components/PostCard.tsx` — 동일
- `app/[locale]/jobs/page.tsx` — 동일
- `app/[locale]/[username]/[slug]/page.tsx` — 동일

### 1-3. nextResetDate 유틸리티

`lib/subscription.ts`에 `getNextResetDate()` 함수 추가, 3곳의 인라인 계산 대체:

- `app/api/webhooks/stripe/route.ts`
- `app/api/subscription/verify/route.ts`
- `lib/subscription.ts` 내부

---

## Phase 2: 공통 UI 컴포넌트 추출

신규 디렉토리: `components/ui/`

### 2-1. `Button.tsx`

- variant: `primary` | `secondary` | `destructive` | `ghost`
- size: `sm` | `md` | `lg`
- 영향: 9개 파일 16회 이상의 인라인 버튼 className 대체

### 2-2. `SelectFilter.tsx` (TagFilter + RepoFilter 통합)

- props: `options`, `activeValue`, `onChange`, `labelAll`, `formatOption?`
- 삭제: `components/TagFilter.tsx`, `components/RepoFilter.tsx`
- 수정: `components/PostsClient.tsx` — import 변경

### 2-3. `LoginRequired.tsx`

- 4곳 중복 대체: `GenerateForm.tsx`, `settings/page.tsx`, `jobs/page.tsx`, `profile/page.tsx`

### 2-4. `Checkbox.tsx`

- 2곳 중복 대체: `GenerateForm.tsx`, `settings/page.tsx`

### 2-5. `Card.tsx`

- `border border-border-subtle rounded-xl` + padding variant
- 10회 이상 반복 패턴 대체

### 2-6. `PageContainer.tsx`

- maxWidth: `sm`(`3xl`) | `md`(`4xl`) | `lg`(`5xl`) | `xl`(`6xl`)
- 13곳의 페이지 래퍼 패턴 대체

### 배럴 export

`components/ui/index.ts` — 모든 UI 컴포넌트 re-export

---

## Phase 3: 중복 컴포넌트 제거

### 3-1. ScrollToTop 중복 제거

- `components/Footer.tsx` — scroll-to-top 로직(1~27줄) 및 버튼 JSX(32~60줄) 제거
- Footer를 서버 컴포넌트로 전환: `"use client"` 제거, `useTranslations` → `getTranslations`
- `ScrollToTopButton.tsx`는 그대로 유지 (이미 `[slug]/page.tsx`에서 사용 중)
- Footer 내부에서 `<ScrollToTopButton />` import하여 배치 (서버 컴포넌트 안에 클라이언트 컴포넌트 가능)

### 3-2. about 리뷰 데이터 분리

- 신규: `data/reviews.ts` — `reviewsKo`, `reviewsEn` 배열 이동
- 수정: `app/[locale]/about/page.tsx` — import로 대체

---

## Phase 4: 거대 페이지 파일 분리

### 4-1. settings/page.tsx (342줄 → ~80줄 + 4개 하위 컴포넌트)

신규 디렉토리: `components/settings/`

- `BillingSection.tsx` — 구독 정보 + 사용량 바 + 포털/취소 버튼
- `PostingModeSection.tsx` — 수동/자동 토글
- `ScheduleSection.tsx` — daily/weekly 라디오
- `RepoSelector.tsx` — 레포지토리 체크박스 목록

`SettingsContent`는 상태 관리 + 섹션 컴포넌트 조합만 담당.

### 4-2. jobs/page.tsx (300줄 → ~100줄 + 3개 하위 컴포넌트)

신규 디렉토리: `components/jobs/`

- `JobCard.tsx` — 개별 작업 카드 (상태 뱃지, 확장/축소, 발행/삭제)
- `DraftCard.tsx` — 개별 초안 카드
- `JobTabs.tsx` — 탭 네비게이션

---

## Phase 5: API 리팩토링

### 5-1. 공통 API 유틸리티

신규: `lib/api-utils.ts`

```typescript
requireAuth(); // 인증 체크 + username/accessToken 반환 (15곳 보일러플레이트 통합)
isAuthError(); // 타입 가드
apiError(); // 표준 에러 응답
apiSuccess(); // 표준 성공 응답
parseJsonBody(); // JSON 파싱 + 400 에러 처리
requirePostOwnership(); // 포스트 소유권 검증 (4곳 중복 통합)
```

수정: 모든 인증 필요 API 라우트 (15개)

### 5-2. Stripe 비즈니스 로직 분리

신규: `lib/billing.ts`

- `createCheckoutSession()` — `app/api/checkout/route.ts`에서 추출
- `createPortalSession()` — `app/api/stripe/portal/route.ts`에서 추출
- `verifyCheckoutAndActivate()` — `app/api/subscription/verify/route.ts`에서 추출
- `cancelSubscription()` — `app/api/subscription/route.ts` DELETE에서 추출
- `handleWebhookEvent()` — `app/api/webhooks/stripe/route.ts`에서 추출

효과: 5개 API 라우트에서 `supabaseAdmin` 직접 import 제거, `lib/` 아키텍처 원칙 준수

### 5-3. 입력 검증 Zod 확대

추가 스키마 (기존 4곳 → 7곳):

- `checkoutSchema` — `app/api/checkout/route.ts` (현재 수동 `!tier || !cycle`)
- `settingsSchema` — `app/api/settings/route.ts` (현재 수동 if문)
- `bioSchema` — `app/api/profiles/[username]/bio/route.ts` (현재 수동 typeof)

### 5-4. 에러 메시지 한국어 통일

- `"Unauthorized"` → `"인증이 필요합니다."`
- `"Forbidden"` → `"권한이 없습니다."`
- `"Internal server error"` → `"서버 오류가 발생했습니다."`
- 기타 영어 에러 메시지 → 한국어

---

## 실행 순서 및 의존성

```
Phase 1 (타입/유틸리티)   ← 기반, 먼저 완료
    ↓
Phase 2 (UI 컴포넌트)    ← Phase 3, 4에서 사용
    ↓
Phase 3 (중복 제거)      ← Phase 2의 UI 컴포넌트 활용
Phase 4 (페이지 분리)    ← Phase 2의 UI 컴포넌트 활용
Phase 5 (API 리팩토링)   ← Phase 1의 유틸리티 사용, 독립 진행 가능
```

---

## 파일 변경 요약

| 구분      | 수량                                             |
| --------- | ------------------------------------------------ |
| 신규 파일 | ~16개 (lib 3, ui 7, settings 4, jobs 3, data 1)  |
| 수정 파일 | ~25개 (모든 API 라우트 + 주요 컴포넌트 + 페이지) |
| 삭제 파일 | 2개 (TagFilter.tsx, RepoFilter.tsx)              |

---

## 검증 계획

각 Phase 완료 후:

1. `npm run build` — 타입 에러/빌드 실패 없음
2. `npm run lint` — 린트 통과
3. 주요 플로우 수동 테스트:
   - 홈 → 포스트 목록 필터링 (SelectFilter 동작)
   - /generate → 커밋 선택 → AI 생성 → 잡 폴링
   - /settings → 구독 정보 표시, 모드 전환, 레포 선택, 저장
   - /jobs → 탭 전환, 작업 확장, 초안 발행, 삭제
   - /pricing → Stripe 체크아웃 → 웹훅 → 구독 활성화
   - 로그인/로그아웃 플로우
4. Footer ScrollToTop 버튼 정상 표시/동작 확인

---

## 🛠️ 추가 업데이트 (2026-03-16) - 보안 및 안정성

### [완료] API/DAL 소유권 검증 통합

- lib/posts.ts, lib/jobs.ts 등 데이터 접근 계층에 uthor 필터 강제 적용.
- equireJobOwnership 유틸리티 도입으로 API 보안 일관성 확보.

### [완료] Stripe 웹훅 멱등성 구현

- stripe_events 테이블을 통한 중복 이벤트 처리 방지 로직 적용.

### [진행 예정] DB RLS 정책 실제 적용

- scripts/fix-security-rls.sql을 실행하여 DB 레벨 보안 완성 필요.

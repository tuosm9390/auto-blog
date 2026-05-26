# synapso.dev — AI-Powered Project Memory Dashboard

## 프로젝트 개요 (Overview)

**synapso.dev**는 솔로 빌더와 소규모 팀을 위한 **AI 기반 프로젝트 상태 추적 SaaS**입니다.

개발자가 PRD(제품 요구사항 문서)를 등록하고 GitHub 저장소를 연결하면, Google Gemini AI가 최근 커밋·PR·이슈 활동을 PRD와 교차 분석하여 **프로젝트의 현재 진행률, drift(계획 이탈), blocker, risk를 구조화된 대시보드로 보고**합니다.

> **"코드는 당신이 짭니다. 프로젝트 상태는 AI가 추적합니다."**

---

## 서비스 피벗 배경 (Product Pivot)

초기 synapso.dev는 GitHub 커밋을 Gemini AI가 분석하여 **기술 블로그 포스트를 자동 생성**하는 SaaS로 출발했습니다. Reverse Spec Recovery(커밋→기획 역추론) 프롬프팅과 Structured Output을 결합한 포스트 생성기로, Stripe 결제와 자동 포스팅 크론까지 구현했습니다.

2026년 5월 피벗 결정 이후, 블로그 생성 기능(약 4,800줄)을 전면 제거하고 **Project Memory** 단독 서비스로 전환했습니다. 기술 인프라(인증, DB, 결제, GitHub 연동)는 그대로 유지하면서 핵심 가치 제안을 교체한 구조적 피벗입니다.

---

## 핵심 파이프라인 (Core Pipeline)

전체 데이터 흐름은 **프로젝트 등록 → GitHub 활동 수집 → Gemini 분석 → 스냅샷 저장 → 대시보드 표시**의 5단계로 구성됩니다.

```
프로젝트 + PRD 등록  →  GitHub 활동 수집   →   Gemini 분석    →  스냅샷 저장   →  대시보드 표시
────────────────       ─────────────────      ─────────────      ─────────────     ─────────────
projects 테이블         커밋/PR/이슈 수집       PRD 교차 분석      state_snapshots   진행률/drift
project_plans 테이블    Octokit API            Structured JSON    analysis_runs     시계열 히스토리
PRD 마크다운 입력        불필요 파일 필터링       Exponential Retry   수치 정규화        ko/en 출력
```

### 1단계: 프로젝트 등록 (`lib/projects.ts`)

- 프로젝트 이름, 설명, 원래 thesis(가설)와 현재 thesis를 입력하여 프로젝트를 생성
- 선택적으로 GitHub 저장소(`owner/repo`)를 연결하여 활동 기반 분석 활성화
- PRD/계획 문서를 마크다운으로 등록하면 `project_plans` 테이블에 버전 1로 저장
- `project-slug`는 이름 기반으로 자동 생성, 충돌 시 `-1`, `-2` 카운터 부여 (최대 100회 보호)
- React `cache()`로 동일 요청 내 DB 중복 조회 방지 (`getProjectById`, `getProjectByOwnerAndSlug`)

### 2단계: GitHub 활동 수집 (`lib/github.ts`)

- `getRecentCommits`로 설정된 소스 윈도우(기본 7일) 내 최근 커밋 최대 5개를 가져옴
- `getCommitDiff`로 각 커밋의 파일별 변경 내용을 수집, `EXCLUDED_FILE_PATTERNS`로 lock 파일·바이너리·빌드 아티팩트를 자동 필터링하여 Gemini 컨텍스트 낭비 방지
- `getPullRequestsForCommit`으로 커밋과 연결된 PR의 제목·본문을 수집하여 의사결정 맥락 확보
- 커밋 메시지와 PR 본문에서 `#(\d{1,6})` 정규식으로 이슈 번호를 추출, `getIssuesByNumbers`로 이슈 제목·상태·본문 수집
- GitHub 연결 없이도 동작: baseline 스냅샷을 자동 생성하여 PRD만으로 분석 시작 가능

### 3단계: Gemini 분석 (`lib/project-memory-ai.ts`)

- `@google/genai` SDK로 Gemini API 호출. `responseMimeType: "application/json"` + `responseSchema`로 **Structured Output** 강제하여 파싱 오류 원천 차단
- 프롬프트는 프로젝트 thesis, PRD 전문, 커밋 활동, PR 맥락, 이슈 맥락을 구조화된 블록으로 조합
- **7가지 분석 항목**: 현황 요약(2~4문장), 진행률(0~100), 현재 단계명, blocker/risk/drift 수, watchNext 2~4개, planProgress 3~6개, drift 0~3개
- **출력 언어 지정**: `locale` 파라미터(`ko`/`en`)에 따라 출력 언어 시스템 프롬프트를 교체. status 값(done/in_progress/at_risk/blocked)과 drift_type 값은 언어 무관 고정
- **Exponential Backoff 재시도**: 503(Gemini 과부하) 시 `2^n * 2000ms` 딜레이로 최대 3회 재시도
- 분석 결과에 commit/PR/issue/PRD 출처를 `evidence` 배열로 첨부하여 근거 추적 가능

### 4단계: 분석 파이프라인 조율 (`lib/project-refresh.ts`)

- `refreshProjectState`가 전체 파이프라인을 조율하는 단일 진입점
- `createAnalysisRun`으로 분석 실행 레코드(pending → processing → completed/failed)를 관리
- GitHub 연결 여부(`hasRepoConnection = hasRepoConfigured && Boolean(accessToken)`)를 판단하여 AI 분석 또는 baseline bootstrap을 분기
- `buildCommitCoverage`, `buildIssueCoverage`로 분석 범위 메타데이터를 스냅샷에 함께 저장
- `rawOutputJson`에 모드(분석 vs baseline), 입력 데이터 수, `fallbackReason`을 기록하여 디버깅 및 감사 추적 지원

### 5단계: 스냅샷 저장 및 대시보드 표시

- `state_snapshots` 테이블에 진행률, 현재 단계, blocker/risk/drift 수, watchNext, planProgress JSON, drift JSON, evidence JSON 저장
- 스냅샷 히스토리(`getStateSnapshotsByProject`)로 프로젝트 상태 변화를 시계열로 추적
- 대시보드에서 진행률 바, drift 카드, watchNext 체크리스트, planProgress 항목별 상태 렌더링
- `/projects/[id]/runs`에서 분석 실행 이력 및 실패 원인 조회 가능

---

## 프로젝트 구조 (Project Structure)

```text
synapso.dev/
├── app/
│   ├── [locale]/                     # next-intl 다국어 라우팅 (ko / en)
│   │   ├── projects/                 # Project Memory 대시보드
│   │   │   ├── page.tsx              # 프로젝트 목록
│   │   │   ├── new/page.tsx          # 프로젝트 생성 (PRD 입력 포함)
│   │   │   └── [id]/
│   │   │       ├── page.tsx          # 프로젝트 대시보드 (진행률·drift·스냅샷)
│   │   │       ├── edit/page.tsx     # 프로젝트·PRD 수정
│   │   │       ├── drift/page.tsx    # Drift 상세 추적
│   │   │       └── runs/page.tsx     # 분석 실행 이력
│   │   ├── settings/page.tsx         # 계정·구독 설정
│   │   ├── pricing/page.tsx          # 구독 플랜 안내
│   │   ├── changelog/page.tsx        # GitHub Releases 기반 업데이트 노트
│   │   ├── about/page.tsx            # 서비스 소개
│   │   ├── how-it-works/page.tsx     # 작동 방식 설명
│   │   ├── admin/                    # 관리자 포털 (유저·테스터·구독 관리)
│   │   ├── login/page.tsx            # GitHub OAuth 로그인
│   │   └── tester-apply/page.tsx     # 베타 테스터 신청
│   ├── actions/                      # React Server Actions (project 생성·수정·새로고침)
│   └── api/
│       ├── projects/                 # 프로젝트 CRUD + 상태 새로고침
│       │   ├── route.ts
│       │   └── [id]/
│       │       ├── route.ts          # 조회·수정·삭제
│       │       ├── refresh/route.ts  # 상태 분석 트리거
│       │       └── drift/route.ts    # Drift 상세 조회
│       ├── github/                   # 저장소 목록 조회
│       ├── cron/billing/route.ts     # 구독 자동 갱신 (매일 01:00 UTC)
│       ├── portone/billing-key/      # PortOne 결제키 등록
│       ├── webhooks/portone/         # PortOne 웹훅 수신
│       └── subscription/             # 사용량·플랜 조회
├── lib/
│   ├── projects.ts                   # Project Memory CRUD (projects, plans, snapshots, runs)
│   ├── project-memory-ai.ts          # Gemini 기반 프로젝트 상태 분석 프롬프트 및 호출
│   ├── project-refresh.ts            # 프로젝트 상태 새로고침 파이프라인 조율
│   ├── github.ts                     # Octokit 기반 커밋 Diff·PR·이슈 수집, 파일 필터링
│   ├── subscription.ts               # 티어별 제한 상수(TIER_LIMITS), Lazy Reset
│   ├── portone-billing.ts            # PortOne SDK 결제키 저장·청구·취소·웹훅 처리
│   ├── profiles.ts                   # 사용자 프로필 관리, Profile ID 마이그레이션
│   ├── email.ts                      # Resend 기반 트랜잭션 이메일 발송
│   ├── changelog.ts                  # GitHub Releases 기반 업데이트 노트
│   ├── supabase-admin.ts             # Service Role Key 기반 관리자 클라이언트
│   └── types.ts                      # 공유 타입 (Project, ProjectPlan, StateSnapshot 등)
├── components/
│   ├── projects/                     # Project Memory 대시보드 컴포넌트
│   ├── settings/                     # 구독·계정 설정 UI
│   ├── Header.tsx / Footer.tsx
│   └── ui/                           # 공통 UI 컴포넌트
├── messages/                         # next-intl 번역 파일 (ko.json, en.json)
├── scripts/
│   └── drop-blog-tables.sql          # 블로그 잔여 DB 테이블 DROP 마이그레이션
└── auth.ts                           # NextAuth v5 GitHub OAuth 설정
```

---

## 상세 기능 구현 (Technical Implementation)

### AI 분석 프롬프트: 운영 리뷰어 페르소나

```typescript
// lib/project-memory-ai.ts
`당신은 AI-native solo builder의 프로젝트 상태를 점검하는 운영 리뷰어입니다.

목표는 "글을 쓰는 것"이 아니라, 프로젝트 상태를 구조화된 JSON으로 보고하는 것입니다.
말투는 간결하고 사실 중심이어야 합니다. 과장 금지. 마케팅 금지.`
```

Gemini 프롬프트는 마케팅이나 수식어를 명시적으로 금지하고, 정보 부족 시 "보수적으로 추정"하도록 지시합니다. PR title/body와 issue 본문이 있으면 커밋 메시지보다 우선하여 의사결정 맥락을 판단합니다.

### Structured Output으로 응답 스키마 강제

```typescript
// lib/project-memory-ai.ts
const schema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    progressPercent: { type: Type.INTEGER },
    currentPhase: { type: Type.STRING },
    blockerCount: { type: Type.INTEGER },
    riskCount: { type: Type.INTEGER },
    driftCount: { type: Type.INTEGER },
    watchNext: { type: Type.ARRAY, items: { type: Type.STRING } },
    planProgress: { type: Type.ARRAY, items: { /* label, status, evidence, notes */ } },
    drift: { type: Type.ARRAY, items: { /* title, drift_type, original, current, why, evidence_refs */ } },
  },
  required: ["summary", "progressPercent", "currentPhase", ...],
};
```

스키마에 없는 자유 텍스트 필드를 원천 차단하여 파싱 오류 가능성을 제거합니다. `progressPercent`는 수신 후 `Math.max(0, Math.min(100, value))`로 범위를 강제 정규화합니다.

### Baseline Bootstrap: GitHub 없이도 동작

```typescript
// lib/project-refresh.ts
const analysis = hasRepoConnection
  ? await analyzeProjectState(currentProject, plan, commitDiffs, pullRequests, issues, locale)
  : buildBaselineAnalysis(currentProject.id, currentProject.name, plan, locale);
```

GitHub 연결 전에도 PRD만으로 초기 스냅샷을 생성합니다. Baseline 스냅샷의 `fallbackReason`은 `missing_plan_and_github_activity` / `missing_repo_connection` / `missing_github_token` 중 하나로 명시되어 사용자에게 다음 설정 단계를 안내합니다.

### 안정적인 사용자 식별자 설계

```typescript
// auth.ts
if (account) {
  token.accessToken = account.access_token;
  token.sub = account.providerAccountId; // GitHub Numeric ID (불변)
}
```

NextAuth v5 기본 동작(매 로그인마다 `randomUUID()` 생성)을 오버라이드하여 **GitHub Numeric ID를 `token.sub`으로 고정**합니다. 기존 UUID 기반 프로필은 `migrateProfileId` 함수로 1회성 자동 마이그레이션하여 데이터 손실 없이 전환합니다.

### 계층적 구독 시스템 (Tier-based Constraint)

```typescript
// lib/subscription.ts
export const TIER_LIMITS: Record<SubscriptionTier, { ... }> = {
  free:     { monthlyLimit: 20,       aiModel: "gemini-3.1-flash-lite-preview", ... },
  pro:      { monthlyLimit: 30,       aiModel: "gemini-3-flash-preview",        price: { monthly: 6900, yearly: 58800 } },
  business: { monthlyLimit: Infinity, aiModel: "gemini-3.1-pro-preview",        price: { monthly: 29900, yearly: 274800 } },
};
```

- **Lazy Reset**: 매 사용량 조회 시 `usage_reset_date`가 현재 시각을 지났으면 카운터를 자동 초기화. 별도 스케줄러 없이 DB 부하를 최소화
- **원자적 증가**: Supabase RPC `increment_usage_count`로 경쟁 조건 없는 카운터 증가. RPC 미존재 시 단순 update로 fallback
- **취소 롤백**: 분석 실패 시 `decrementUsage`로 사용량 원복

### PortOne 결제 시스템

```typescript
// lib/portone-billing.ts
export async function saveBillingKeyAndCharge(username, billingKey, tier, cycle) {
  // 1. 첫 결제 실행
  await paymentClient.payWithBillingKey({ paymentId, billingKey, ... });

  // 2. 결제 이벤트 멱등성 기록 (upsert + ignoreDuplicates)
  await supabaseAdmin.from("payment_events").upsert(
    { id: paymentId, ... },
    { onConflict: "id", ignoreDuplicates: true }
  );

  // 3. 프로필 구독 상태 업데이트
  await supabaseAdmin.from("profiles").update({ subscription_tier, subscription_status: "active", ... });
}
```

- **자동 갱신 Cron** (`/api/cron/billing`, 매일 01:00 UTC): `usage_reset_date <= now`인 active 구독자를 조회하여 `chargeWithBillingKey` 자동 실행. 결제 실패 시 `past_due` 상태 전환
- **웹훅 멱등성**: `payment_events` 테이블에 이벤트 ID를 PK로 upsert하여 동일 이벤트 중복 처리 방지
- **빌링키 삭제 복원력**: 구독 취소 시 PortOne 빌링키 삭제 실패해도 DB 상태는 정상 업데이트

### 보안 아키텍처

```typescript
// next.config.ts — 전역 보안 헤더
{
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Content-Security-Policy": "default-src 'self'; connect-src 'self' https://*.supabase.co ...",
}
```

- **역할 기반 접근 제어**: JWT에 `role` 필드 포함. `/admin` 경로를 `role === 'admin'`으로 보호. `/@admin-user` 같은 username 오탐을 `startsWith` 정밀 매칭으로 구분
- **Cron 엔드포인트 보호**: `CRON_SECRET` Bearer 토큰으로 외부 호출 차단
- **Rate Limiting**: Upstash Redis 기반 API 요청 제한
- **server-only 가드**: `lib/supabase-admin.ts`에 `server-only` 패키지 임포트로 Service Role Key 클라이언트 코드의 클라이언트 번들 진입 차단

---

## 데이터베이스 스키마 (Database Schema)

| 테이블             | 역할                                                                |
| ------------------ | ------------------------------------------------------------------- |
| `profiles`         | 사용자 정보, 구독 티어, PortOne 빌링키, 월별 사용량, 역할(role)     |
| `payment_events`   | 결제 이벤트 멱등성 기록 (이벤트 ID를 PK로 중복 방지)               |
| `projects`         | Project Memory 프로젝트 (이름, thesis, GitHub 연결, slug)           |
| `project_plans`    | PRD/계획 문서 (버전 관리, is_current 플래그)                        |
| `analysis_runs`    | 분석 실행 기록 (pending → processing → completed/failed)            |
| `state_snapshots`  | AI 분석 결과 스냅샷 (진행률, drift, planProgress, evidence)         |

> **정리 예정 테이블**: `posts`, `jobs`, `user_settings`, `processed_commits`는 블로그 기능 전용으로 `scripts/drop-blog-tables.sql` 실행 시 제거됩니다.

---

## 개발 히스토리 및 문제 해결 (Development History)

### AI 응답 안정성 — Structured Output 도입

**배경**  
초기 Gemini 연동에서는 응답을 자유 텍스트로 받은 뒤 정규식으로 파싱했습니다. 섹션이 누락되거나 포맷이 달라지면 백엔드에서 파싱 오류가 발생했습니다.

**문제**  
AI의 자유 텍스트 응답은 구조가 일정하지 않아 JSON.parse 실패, 섹션 누락, 잘못된 타입 등의 런타임 오류가 산발적으로 발생했습니다.

**해결**  
`@google/genai` SDK의 `responseMimeType: "application/json"` + `responseSchema` 조합으로 응답 스키마를 스키마 계층에서 강제했습니다. 정수여야 할 필드(`progressPercent`, `blockerCount` 등)는 `Type.INTEGER`로 선언하고, 수신 후에도 `Math.max(0, Math.min(100, value))`로 범위를 방어적으로 정규화합니다.

**결과**  
파싱 오류 제로. 스키마 변경 시 TypeScript 타입과 `schema` 객체를 동시에 수정하므로 타입 불일치도 컴파일 타임에 탐지됩니다.

---

### 사용자 식별자 불안정 — GitHub Numeric ID 고정

**배경**  
NextAuth v5 기본 동작에서는 `token.sub`에 `randomUUID()`를 할당합니다. 로그인할 때마다 같은 GitHub 사용자에 다른 ID가 생성되어 DB 프로필이 중복 생성되었습니다.

**문제**  
Supabase의 `profiles` 테이블이 로그인마다 새 UUID 레코드를 생성하고, 기존 프로필(구독 정보 포함)과 단절됩니다.

**해결**  
`auth.ts`의 `jwt` 콜백에서 `account.providerAccountId`(GitHub의 불변 Numeric ID)를 `token.sub`으로 명시 고정했습니다. 기존 UUID 기반 프로필은 `migrateProfileId` 함수가 `updateProfileId` → 기존 UUID 레코드 삭제 순으로 1회성 마이그레이션합니다.

**결과**  
로그인 방식(세션 만료·재로그인·브라우저 교체)과 무관하게 동일한 `profiles` 레코드에 연결됩니다. 구독 상태와 사용량이 로그인 간에 안정적으로 유지됩니다.

---

### 결제 시스템 전환 — Stripe → PortOne

**배경**  
초기 구독 결제는 Stripe로 구현했습니다. 한국 시장 출시를 위해 원화 결제와 카드사 직접 연동이 필요했습니다.

**문제**  
Stripe는 한국 카드사 직접 연동을 지원하지 않아 PG사를 거쳐야 하고, 원화 정기결제 흐름이 복잡합니다.

**해결**  
PortOne V2 Server SDK로 전환했습니다. 빌링키 기반 정기결제 흐름(최초 카드 등록 → 빌링키 발급 → 이후 서버 측 자동 청구)을 `portone-billing.ts`에 구현하고, `payment_events` 테이블로 웹훅 재전송에 의한 이중 결제를 방지했습니다. 기존 `lib/stripe.ts`는 글로벌 결제 대비용으로 410 스텁으로 보존했습니다.

**결과**  
한국 주요 카드사 직결, 원화 정기결제, 자동 갱신 크론 완성. 웹훅 멱등성으로 결제 이중 처리 방지.

---

### 서비스 피벗 — 블로그 생성기 → Project Memory

**배경**  
블로그 자동 생성(Reverse Spec Recovery) 기능은 기술적으로 완성됐지만, 핵심 가치 제안이 "Project Memory(thesis drift 추적)"로 전환되었습니다.

**문제**  
블로그 기능 코드(약 4,800줄)가 신규 기능 개발의 인지 부담이 되고, 서비스 정체성을 희석시켰습니다.

**해결**  
커밋 `462f269`에서 블로그 관련 54개 파일을 삭제했습니다: `lib/ai.ts`, `lib/jobs.ts`, `lib/posts.ts`, `lib/demo.ts`, `lib/settings.ts`, 블로그 관련 모든 페이지(`generate/`, `jobs/`, `@[username]/`, `demo/`)와 API 라우트, 자동 포스팅 크론 등입니다. 이어진 커밋 `cd717a5`에서 DB 참조 잔재를 정리하고 `scripts/drop-blog-tables.sql`을 추가했습니다. 기술 인프라(인증, GitHub 연동, 결제, i18n)는 Project Memory에서 그대로 재활용됩니다.

**결과**  
빌드 통과 (17개 정적 페이지 생성). 코드베이스가 Project Memory에 집중된 단순한 구조로 정리됐습니다.

---

### i18n 도입 — next-intl 기반 한·영 이중 언어

**배경**  
서비스 초기에는 한국어 단일 언어였으나, 글로벌 접근성을 위해 영어 지원이 필요했습니다.

**문제**  
하드코딩된 한국어 문자열이 컴포넌트 전체에 분산되어 있어 번역 추가가 어려웠습니다.

**해결**  
`next-intl`을 도입하여 `/messages/ko.json`, `/messages/en.json`으로 번역 파일을 분리했습니다. `[locale]` 라우트 세그먼트로 언어별 URL을 구성하고, Project Memory 분석 출력도 `locale` 파라미터를 Gemini 프롬프트에 주입하여 AI 응답 언어를 제어합니다.

**결과**  
한국어/영어 전환 시 UI 문자열과 AI 분석 결과가 동시에 언어 전환됩니다.

---

### SEO 및 GEO 최적화

**배경**  
정적 마케팅 페이지의 검색 가시성과 AI 검색 엔진 대응이 필요했습니다.

**해결**  
- `sitemap.ts`: 정적 페이지 URL을 자동 생성, 무효 URL 방지 및 XSS 이스케이프 적용
- JSON-LD 구조화 데이터를 `<body>` 내 `<script type="application/ld+json">`으로 삽입 (기존 `<head>` 위치에서 이동하여 표준 준수)
- Vercel ISR로 정적 페이지 캐싱과 동적 데이터 결합

---

## 사용 기술 및 라이브러리 (Tech Stack)

| 영역              | 기술                                                                        |
| ----------------- | --------------------------------------------------------------------------- |
| **Framework**     | Next.js 16.1.6 (App Router), React 19.2.3                                   |
| **Auth**          | NextAuth v5.0.0-beta.30 (GitHub OAuth, JWT 전략, GitHub Numeric ID 고정)    |
| **Database**      | Supabase (PostgreSQL, Service Role Admin Client)                             |
| **AI / LLM**      | `@google/genai` — Gemini 2.5 Flash Lite / Flash / Pro (Structured Output)   |
| **결제**          | PortOne Server SDK (`@portone/server-sdk`, 빌링키 정기결제, 한국 원화)      |
| **Styling**       | Tailwind CSS v4.2.0, CSS Variables, 다크 테마                               |
| **i18n**          | next-intl v4 (ko / en 이중 언어, AI 응답 언어 제어 포함)                    |
| **이메일**        | Resend + `@react-email/components`                                          |
| **Rate Limiting** | Upstash Redis (`@upstash/ratelimit`)                                        |
| **Validation**    | Zod v4                                                                      |
| **GitHub 연동**   | Octokit v5 (커밋 Diff·PR·이슈 수집, 파일 필터링)                           |
| **Analytics**     | Vercel Analytics                                                            |
| **Infra**         | Vercel (Serverless, ISR, Cron Jobs)                                         |
| **Testing**       | Vitest, @testing-library/react                                              |

---

## 주요 구현 특징 (Key Highlights)

### 1. Structured Output으로 AI 응답 안정성 보장

Gemini API의 `responseSchema`로 JSON 타입 응답을 스키마 계층에서 강제합니다. `progressPercent` 같은 수치 필드는 수신 후에도 범위 정규화를 적용하는 이중 방어 구조입니다. 자유 텍스트 생성의 불안정성을 완전히 제거하여 파싱 오류를 원천 차단합니다.

### 2. GitHub 없이도 시작 가능한 Baseline Bootstrap

GitHub 연결 전에는 PRD만으로 초기 스냅샷을 자동 생성하고, `fallbackReason`으로 다음 설정 단계를 안내합니다. GitHub 연결 후 첫 새로고침에서 즉시 활동 기반 분석으로 전환됩니다. 사용자 온보딩 마찰을 최소화하는 점진적 가치 제공 흐름입니다.

### 3. PR/이슈 맥락 우선 활용으로 분석 정확도 향상

커밋 메시지만으로는 의사결정 이유를 파악하기 어렵습니다. PR 제목·본문과 이슈 맥락을 커밋 SHA에서 역추적하여 "왜 이 변경을 했는지"를 Gemini에게 제공합니다. 분석 결과의 근거(evidence)를 PR/이슈/커밋/PRD 단위로 첨부하여 추적 가능성을 확보합니다.

### 4. 멱등성 보장 결제 시스템

`payment_events` 테이블에 이벤트 ID를 PK로 `upsert + ignoreDuplicates`하여 웹훅 재전송에 의한 이중 결제를 방지합니다. 빌링키 삭제 실패 시에도 DB 상태는 정상 업데이트되는 복원력을 갖추었습니다.

### 5. Lazy Reset으로 사용량 초기화 스케줄러 제거

월별 사용량 초기화를 별도 크론 없이 처리합니다. 매 사용량 조회 시 `usage_reset_date`가 지났으면 즉시 초기화합니다. 스케줄러 장애나 타이밍 레이스 없이 DB 조회 한 번으로 초기화가 완성됩니다.

### 6. 시계열 스냅샷 히스토리

`state_snapshots` 테이블에 분석 결과를 누적 저장하여 프로젝트 상태 변화를 시계열로 추적합니다. `analysis_runs` 테이블로 각 분석 실행의 입력 데이터와 결과를 감사 추적할 수 있습니다.

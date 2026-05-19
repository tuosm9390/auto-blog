# synapso.dev — AI-Powered Tech Blog Generator

## 프로젝트 개요 (Overview)

**synapso.dev**는 개발자의 GitHub 커밋 히스토리를 Google Gemini AI가 분석하여 **전문적인 시니어 엔지니어 관점의 기술 블로그 포스트를 자동 생성**하는 멀티유저 SaaS 플랫폼입니다.

단순한 변경사항 나열을 넘어, 커밋 Diff 패턴과 파일 구조 변화를 바탕으로 "요구사항 → 기획 → 개발"이라는 개발자의 의사결정 흐름을 역추론(**Reverse Spec Recovery**)하여 완성도 높은 마크다운 문서를 자동 생성·발행합니다.

추가로, **Project Memory** 기능을 통해 GitHub 커밋·PR·이슈 활동을 PRD 기준으로 AI가 분석하여 프로젝트 진행 상태, 드리프트, 리스크를 구조화된 대시보드로 추적합니다.

> **"코딩만 하세요. 기술 블로그는 AI가 완성합니다."**

---

## 핵심 파이프라인 (Core Pipeline)

전체 데이터 흐름은 **인증 → 커밋 수집 → 작업 큐 → AI 분석 → 포스트 발행**의 5단계로 구성됩니다.

```
GitHub OAuth     →   커밋 Diff 수집   →   Job 큐 등록    →   Gemini 분석    →   포스트 발행
─────────────        ─────────────        ───────────        ─────────────       ─────────────
NextAuth v5          Octokit API           Supabase jobs       Structured JSON     Slug 자동 생성
GitHub 토큰 저장      불필요 파일 필터링      pending → done      5-섹션 강제 검증     Soft Delete
repo scope           80,000자 제한          5분 타임아웃          Exponential Retry   ISR 렌더링
```

### 1단계: GitHub 인증 및 커밋 수집 (`auth.ts`, `lib/github.ts`)

- NextAuth v5로 GitHub OAuth 인증. `repo` scope 요청으로 퍼블릭·프라이빗 저장소 모두 접근
- **GitHub Numeric ID를 안정적 사용자 식별자로 고정**: NextAuth 기본 동작(매 로그인마다 randomUUID 생성)을 오버라이드하여 `account.providerAccountId`를 `token.sub`으로 명시 설정. 로그인할 때마다 user.id가 달라지는 버그를 원천 차단
- Octokit으로 커밋 Diff 추출 시 `EXCLUDED_FILE_PATTERNS`로 lock 파일, 바이너리, 빌드 아티팩트, `.env` 계열을 자동 필터링하여 AI 컨텍스트 윈도우 낭비 방지
- PR 연결 커밋과 이슈 번호 추출도 지원하여 Project Memory 분석에 맥락 데이터를 제공

### 2단계: 비동기 작업 큐 (`lib/jobs.ts`)

- AI 분석은 Serverless Request Timeout을 초과할 수 있으므로, 작업을 `jobs` 테이블에 `pending` 상태로 등록 후 백그라운드에서 처리
- `runAIAnalysisBackground`는 `Promise.race([run(), timeout])` 패턴으로 5분 초과 시 자동 `failed` 처리
- 프론트엔드는 폴링으로 상태(`pending → processing → completed / failed`)를 실시간 반영

### 3단계: AI 심층 분석 (`lib/ai.ts`)

- `@google/genai` SDK(신규)를 사용하여 Gemini API 호출. `responseMimeType: "application/json"` + `responseSchema`로 **Structured Output** 강제
- **5개 섹션 완결성 정규식 검증**: 응답에 `커밋 개발내역 / 작업 순서 / 핵심 기능 / 개발 스토리 / 핵심 교훈` 5개 섹션이 모두 포함되지 않으면 즉시 재시도
- **Exponential Backoff 재시도**: Rate Limit(429) 또는 섹션 누락 시 `2^n * 2000ms` 딜레이로 최대 3회 재시도
- **Reverse Spec Recovery 프롬프팅**: 단순 코드 설명 금지. 커밋(구현)으로부터 요구사항·기획·개발 의사결정을 역추론하도록 시스템 프롬프트 설계
- 전체 Diff 합산 80,000자 초과 시 자동 트런케이션으로 토큰 비용 제어

### 4단계: 포스트 발행 (`lib/posts.ts`)

- `YYYY-MM-DD-<slugified-title>` 형식의 날짜 기반 Slug 자동 생성
- 동일 Slug 충돌 방지: DB에서 기존 Slug를 조회 후 `-1`, `-2` 카운터 부여 (최대 100회 보호)
- **Soft Delete 패턴**: 삭제 요청 시 실제 레코드 삭제 대신 `deletedAt` 타임스탬프 설정. 휴먼 에러 시 복구 가능
- React `cache()` 적용으로 동일 요청 내 DB 중복 조회 방지 (`getPostById`, `getPostByUsernameAndSlug`)

### 5단계: Project Memory — AI 기반 프로젝트 상태 추적

Project Memory는 GitHub 활동(커밋, PR, 이슈)과 PRD(제품 요구사항 문서)를 Gemini AI가 교차 분석하여 프로젝트의 현재 상태를 구조화된 스냅샷으로 보고하는 기능입니다.

```
GitHub 커밋/PR/이슈 수집 → PRD 교차 분석 → Gemini 상태 분석 → StateSnapshot 저장 → 대시보드 표시
```

- `lib/project-refresh.ts`가 전체 파이프라인을 조율합니다
- `lib/project-memory-ai.ts`가 Gemini Structured Output으로 상태 JSON을 생성합니다
- `lib/projects.ts`가 `projects`, `project_plans`, `analysis_runs`, `state_snapshots` 테이블 CRUD를 담당합니다
- 분석 결과에는 진행률(%), 현재 단계, blocker/risk/drift 수, watchNext 항목, PRD 기준 planProgress, drift 목록이 포함됩니다
- GitHub 연결이 없으면 baseline 스냅샷을 자동 생성하고, 연결 시 실제 활동 기반 분석으로 전환됩니다
- PR title/body와 issue 맥락을 우선 활용하여 의사결정 추론의 정확도를 높입니다
- 한국어/영어 다국어 출력을 지원합니다

### 6단계: GitHub Releases 기반 Changelog

`lib/changelog.ts`가 GitHub Releases API에서 릴리스 노트를 가져와 새 기능, 버그 수정, 보안, 리팩토링으로 분류합니다. `unstable_cache`로 1시간 캐시하여 API 호출을 최소화합니다.

---

## 프로젝트 구조 (Project Structure)

```text
synapso.dev/
├── app/
│   ├── [locale]/               # next-intl 다국어 라우팅 (ko / en)
│   │   ├── @[username]/        # 사용자 퍼블릭 블로그 페이지 (/:username)
│   │   ├── generate/           # 포스트 생성 UI
│   │   ├── jobs/               # 작업 현황 대시보드
│   │   ├── settings/           # 자동 포스팅·결제 설정
│   │   ├── pricing/            # 구독 플랜 안내
│   │   ├── projects/           # Project Memory 대시보드 및 상세
│   │   ├── changelog/          # GitHub Releases 기반 업데이트 노트
│   │   ├── demo/               # 로그인 없이 체험 가능한 데모
│   │   └── admin/              # 관리자 전용 포털
│   ├── actions/                # React Server Actions
│   └── api/
│       ├── generate/           # AI 분석 트리거 엔드포인트
│       ├── jobs/               # Job CRUD
│       ├── posts/              # 포스트 CRUD
│       ├── github/             # 리포·커밋 목록 조회
│       ├── settings/           # 사용자 설정 관리
│       ├── subscription/       # 사용량·플랜 조회
│       ├── portone/            # PortOne 결제 연동
│       ├── webhooks/           # PortOne / Stripe 웹훅 수신
│       └── cron/
│           ├── auto-post/      # 자동 포스팅 스케줄러 (매일 09:00 UTC)
│           └── billing/        # 구독 갱신 청구 스케줄러 (매일 01:00 UTC)
├── lib/
│   ├── ai.ts                   # Gemini 연동, 프롬프트 빌딩, Retry 로직
│   ├── github.ts               # Octokit 기반 커밋 Diff 추출, 파일 필터링
│   ├── jobs.ts                 # Job 상태 머신 및 백그라운드 워커
│   ├── posts.ts                # 포스트 CRUD, Slug 생성, Soft Delete
│   ├── profiles.ts             # 사용자 프로필 관리, Profile ID 마이그레이션
│   ├── projects.ts             # Project Memory CRUD (projects, plans, snapshots, runs)
│   ├── project-memory-ai.ts    # Gemini 기반 프로젝트 상태 분석 프롬프트 및 호출
│   ├── project-refresh.ts      # 프로젝트 상태 새로고침 파이프라인 조율
│   ├── subscription.ts         # 티어별 제한 상수(TIER_LIMITS), 사용량 Lazy Reset
│   ├── portone-billing.ts      # PortOne SDK 결제키 저장·청구·취소·웹훅 처리
│   ├── settings.ts             # 자동 포스팅 설정, processed_commits 중복 방지
│   ├── email.ts                # Resend 기반 트랜잭션 이메일 발송
│   ├── billing.ts              # Stripe 기반 레거시 결제 (글로벌)
│   ├── changelog.ts            # GitHub Releases 기반 업데이트 노트
│   ├── types.ts                # 공유 타입 (Post, Project, StateSnapshot 등)
│   └── supabase-admin.ts       # Service Role Key 기반 관리자 클라이언트
└── components/
    ├── GenerateForm.tsx         # 커밋 선택 및 AI 생성 폼
    ├── EditForm.tsx             # 마크다운 편집기
    ├── PostContent.tsx          # rehype 기반 마크다운 렌더러
    ├── jobs/                   # Job 상태 폴링 컴포넌트
    └── settings/               # 자동 포스팅 / 결제 설정 UI
```

---

## 상세 기능 구현 (Technical Implementation)

### AI 프롬프팅: Reverse Spec Recovery

```typescript
// lib/ai.ts — 개발자가 userContext를 제공하지 않은 경우 AI가 코드로부터 역추론
const section4Instruction = userContext
  ? `### 개발 스토리
     [USER CONTEXT]를 바탕으로 요구사항 → 기획 → 개발 순서로 스토리를 구성하라.`
  : `### 개발 스토리
     [USER CONTEXT 없음 — AI가 코드로부터 역추론]
     반드시 섹션 서두에 "AI가 코드로부터 추론한 내용입니다"라는 문구를 포함할 것.`;
```

프롬프트는 단순 코드 설명을 명시적으로 금지하고, Diff 패턴과 의존성 변화로부터 "왜 이 코드를 만들었는지"를 독자가 이해할 수 있도록 설계됩니다.

### Structured Output으로 환각 억제

```typescript
// lib/ai.ts — JSON Schema를 responseSchema로 강제하여 파싱 에러 원천 차단
const schema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING },
    summary: { type: SchemaType.STRING },
    tags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    content: { type: SchemaType.STRING },
  },
  required: ["title", "summary", "tags", "content"],
};

const model = genAI.getGenerativeModel({
  model: modelName,
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: schema,
  },
});
```

응답 수신 후 SECTION_HEADINGS 상수로 5개 섹션 완결성을 정규식 검증합니다. 누락 시 Exponential Backoff로 재시도합니다.

### 계층적 구독 시스템 (Tier-based Constraint)

```typescript
// lib/subscription.ts
export const TIER_LIMITS: Record<SubscriptionTier, { ... }> = {
  free:     { monthlyLimit: 20,       aiModel: "gemini-3.1-flash-lite-preview", watermark: true,  maxAutoRepos: 1        },
  pro:      { monthlyLimit: 30,       aiModel: "gemini-3-flash-preview",        watermark: false, maxAutoRepos: Infinity },
  business: { monthlyLimit: Infinity, aiModel: "gemini-3.1-pro-preview",        watermark: false, maxAutoRepos: Infinity },
};
```

- **Lazy Reset**: 매 사용량 조회 시 `usage_reset_date`가 현재 시각을 지났으면 카운터를 자동 초기화. 별도 스케줄러 없이 DB 부하를 최소화
- **원자적 증가**: Supabase RPC `increment_usage_count`로 경쟁 조건(race condition) 없는 카운터 증가. RPC 미존재 시 fallback 로직 포함
- **취소 롤백**: 분석 실패 또는 취소 시 `decrementUsage`로 사용량을 원복

### PortOne 결제 시스템

```typescript
// lib/portone-billing.ts — 빌링키 기반 정기 결제 흐름
export async function saveBillingKeyAndCharge(username, billingKey, tier, cycle) {
  // 1. 첫 결제 실행
  await paymentClient.payWithBillingKey({ paymentId, billingKey, ... });

  // 2. 결제 이벤트 멱등성 기록 (upsert + ignoreDuplicates)
  await supabaseAdmin.from("payment_events").upsert({ id: paymentId, ... }, { onConflict: "id", ignoreDuplicates: true });

  // 3. 프로필 구독 상태 업데이트
  await supabaseAdmin.from("profiles").update({ subscription_tier, subscription_status: "active", ... });
}
```

- **자동 갱신 Cron** (`/api/cron/billing`, 매일 01:00 UTC): `usage_reset_date <= now`인 active 구독자를 조회하여 `chargeWithBillingKey` 자동 실행. 결제 실패 시 `past_due` 상태 전환
- **웹훅 멱등성**: `payment_events` 테이블에 이벤트 ID를 PK로 upsert하여 동일 이벤트 중복 처리 방지
- **빌링키 삭제 복원력**: 구독 취소 시 PortOne 빌링키 삭제 실패해도 DB 상태는 정상 업데이트 (zombie key는 추후 cron에서 정리)

### 자동 포스팅 파이프라인 (`/api/cron/auto-post`, 매일 09:00 UTC)

```
auto_mode 유저 조회 → 사용량·티어 확인 → weekly 스케줄 체크 → 미처리 커밋 조회
→ Gemini 분석 → 사용량 증가 → 포스트 생성 → processed_commits 기록
```

- `processed_commits` 테이블로 이미 포스팅된 커밋 SHA를 추적, 중복 발행 방지
- `auto_schedule: "weekly"` 설정 시 마지막 포스트 생성 후 7일 이내면 건너뜀
- Free 티어는 `auto_repos` 최대 1개만 허용 (`TIER_LIMITS.maxAutoRepos`)
- AI 분석 실패 시 `jobs` 테이블에 실패 기록을 남겨 사용자가 `/jobs` 페이지에서 확인 가능

### 보안 아키텍처

```typescript
// next.config.ts — 전역 보안 헤더 설정
{
  "X-Frame-Options": "DENY",                    // 클릭재킹 방지
  "X-Content-Type-Options": "nosniff",          // MIME 스니핑 방지
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Content-Security-Policy": "default-src 'self'; connect-src 'self' https://*.supabase.co ...",
}
```

- **역할 기반 접근 제어**: NextAuth JWT에 `role` 필드 포함. 미들웨어에서 `/admin` 경로를 `role === 'admin'`으로 보호. `/@admin-user` 같은 username과의 오탐을 `startsWith` 정밀 매칭으로 구분
- **Cron 엔드포인트 보호**: `CRON_SECRET` Bearer 토큰으로 외부 호출 차단
- **마크다운 XSS 방지**: `isomorphic-dompurify`로 사용자 입력 HTML 살균
- **Rate Limiting**: Upstash Redis 기반 API 요청 제한

---

## 데이터베이스 스키마 (Database Schema)

| 테이블              | 역할                                                  |
| ------------------- | ----------------------------------------------------- |
| `profiles`          | 사용자 정보, 구독 티어, PortOne 빌링키, 월별 사용량   |
| `posts`             | 블로그 포스트 (Soft Delete, is_public 필드)           |
| `jobs`              | AI 분석 작업 큐 (pending/processing/completed/failed) |
| `user_settings`     | 자동 포스팅 모드, 대상 저장소, 스케줄 설정            |
| `processed_commits` | 자동 포스팅 처리된 커밋 SHA (중복 방지)               |
| `payment_events`    | 결제 이벤트 멱등성 기록                               |
| `projects`          | Project Memory 프로젝트 (이름, thesis, GitHub 연결)   |
| `project_plans`     | PRD/계획 문서 (버전 관리, is_current 플래그)          |
| `analysis_runs`     | 분석 실행 기록 (pending → completed/failed)           |
| `state_snapshots`   | AI 분석 결과 스냅샷 (진행률, drift, planProgress)     |

---

## 사용 기술 및 라이브러리 (Tech Stack)

| 영역              | 기술                                                                  |
| ----------------- | --------------------------------------------------------------------- |
| **Framework**     | Next.js 16.1.6 (App Router), React 19.2.3                             |
| **Auth**          | NextAuth v5.0.0-beta.30 (GitHub OAuth, JWT 전략)                      |
| **Database**      | Supabase (PostgreSQL, RLS, Service Role Admin)                        |
| **AI / LLM**      | `@google/genai` — Gemini 2.5 Flash Lite / Flash / Pro                 |
| **결제 (국내)**   | PortOne Server SDK (`@portone/server-sdk`, 빌링키 정기결제)           |
| **결제 (글로벌)** | Stripe (레거시 보존)                                                  |
| **Styling**       | Tailwind CSS v4.2.0, CSS Variables, 다크 테마                         |
| **i18n**          | next-intl v4 (ko / en 이중 언어)                                      |
| **Markdown**      | `react-markdown`, `rehype-highlight`, `rehype-sanitize`, `remark-gfm` |
| **이메일**        | Resend + `@react-email/components`                                    |
| **Rate Limiting** | Upstash Redis (`@upstash/ratelimit`)                                  |
| **Validation**    | Zod v4                                                                |
| **GitHub 연동**   | Octokit v5                                                            |
| **Analytics**     | Vercel Analytics                                                      |
| **Infra**         | Vercel (Serverless, ISR, Cron Jobs)                                   |
| **Testing**       | Vitest, @testing-library/react                                        |

---

## 주요 구현 특징 (Key Highlights)

### 1. Structured Output으로 AI 환각(Hallucination) 억제

Gemini API의 `responseSchema`를 활용한 JSON 타입 응답 강제와, 5개 섹션 완결성의 정규식 후검증을 결합하여 백엔드 파싱 에러를 원천 차단합니다. 자유 텍스트 생성의 불안정성을 스키마 계층에서 봉쇄한 설계입니다.

### 2. Serverless 환경에 최적화된 비동기 작업 큐

Vercel Serverless의 10~60초 Request Timeout 한계를 극복하기 위해, 무거운 AI 분석 작업을 `jobs` 테이블 기반 상태 머신으로 분리하고 `Promise.race([run(), 5분_타임아웃])`으로 안전하게 처리합니다. 실패 내역도 DB에 기록되어 사용자 관점에서 투명한 에러 처리를 제공합니다.

### 3. 토큰 비용 최적화 파이프라인

`EXCLUDED_FILE_PATTERNS`로 lock 파일, 빌드 아티팩트, 바이너리 파일을 Diff에서 사전 차단하고, 파일당 3,000자 패치 트런케이션과 전체 80,000자 상한선을 적용하여 AI 컨텍스트 윈도우 한계를 우회하고 API 비용을 구조적으로 절감합니다.

### 4. 멱등성 보장 결제 시스템

`payment_events` 테이블에 이벤트 ID를 Primary Key로 `upsert + ignoreDuplicates`하여 웹훅 재전송에 의한 이중 결제를 방지합니다. Lazy Reset 패턴으로 월별 사용량 초기화도 별도 스케줄러 없이 처리합니다.

### 5. 안정적인 사용자 식별자 설계

NextAuth v5 기본 동작의 불안정한 UUID 생성 문제를 해결하기 위해 GitHub Numeric ID를 `token.sub`으로 고정하고, 기존 UUID 기반 프로필의 `id` 컬럼을 `migrateProfileId` 함수로 1회성 자동 마이그레이션합니다.

### 6. Project Memory — PRD 기준 프로젝트 상태 추적

GitHub 커밋·PR·이슈 활동을 PRD와 교차 분석하여 프로젝트의 진행률, 현재 단계, blocker/risk/drift를 구조화된 JSON으로 보고합니다. Gemini Structured Output으로 환각을 억제하고, baseline bootstrap과 실제 활동 분석을 자동 전환합니다. 스냅샷 히스토리를 통해 프로젝트 상태 변화를 시계열로 추적할 수 있습니다.

### 7. GitHub Releases 기반 Changelog

GitHub Releases API에서 릴리스 노트를 가져와 새 기능·버그 수정·보안·리팩토링으로 자동 분류합니다. `unstable_cache`로 1시간 캐시하여 API 호출을 최소화하고, Footer에서 업데이트 노트 페이지로 연결합니다.

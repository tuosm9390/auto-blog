# synapso.dev - AI-Powered Tech Blog Generator

## 프로젝트 개요 (Overview)
**synapso.dev**는 개발자가 작성한 GitHub 커밋 내역을 Google Gemini AI가 분석하여, 단편적인 변경사항의 나열이 아닌 **전문적인 시니어 엔지니어 관점의 기술 블로그 포스트로 자동 생성**해주는 멀티유저 SaaS 플랫폼입니다.
단순한 코드 요약을 넘어, 커밋에 담긴 코드 패턴과 구조 변경을 바탕으로 "요구사항 → 기획/설계 → 개발"이라는 개발자의 의사결정 과정(Reverse Spec Recovery)을 역추론하여 완성도 높은 마크다운 문서를 즉시 발행합니다.

## 핵심 파이프라인 (Core Pipeline)
이 프로젝트의 주요 데이터 흐름은 **커밋 수집 → 작업 등록 → AI 분석 → 포스트 발행**의 4단계 파이프라인으로 구성됩니다.

1. **GitHub 연동 및 커밋 수집 (`lib/github.ts`)**
   - NextAuth를 통해 GitHub OAuth 인증 후 리포지토리 접근 권한을 획득합니다.
   - Octokit을 사용해 커밋 Diff를 추출하며, AI 응답 품질 향상과 토큰 절약을 위해 패키지 Lock 파일, 환경변수, 바이너리, 빌드 결과물 등 불필요한 파일을 자동(`shouldExcludeFile`) 필터링합니다.
2. **비동기 작업 큐 및 상태 관리 (`lib/jobs.ts`)**
   - 사용자 경험을 위해 무거운 AI 분석 작업은 Supabase `jobs` 테이블에 대기열(Pending 상태)로 등록됩니다.
   - 백그라운드 프로세스(`runAIAnalysisBackground`)가 최대 5분의 타임아웃 규칙과 함께 작업을 비동기 처리하며 진행 상태(Processing, Completed, Failed)를 UI에 실시간(또는 Polling)으로 반영합니다.
3. **AI 심층 분석 및 명세 역추론 (`lib/ai.ts`)**
   - 수집된 Commit Diff를 바탕으로 Gemini 프롬프트를 구성합니다.
   - 단일 스트링 생성이 아닌 **Structured Output(JSON Schema)** 모드를 활용해 제목, 요약문, 태그, 본문(마크다운) 구조를 강제하여 파싱 안정성을 더했습니다.
   - Rate Limiting 429 에러 처리와 Exponential Backoff를 통한 Retry 메커니즘이 내장되어 있습니다.
4. **포스트 발행 및 관리 (`lib/posts.ts`)**
   - 생성된 JSON 데이터는 마크다운으로 변환되어 `posts` 테이블에 저장되며, 날짜 기반의 고유 Slug(예: `YYYY-MM-DD-title-slug`)가 자동 할당됩니다.
   - ISR(Incremental Static Regeneration) 등을 통해 Vercel 환경에서 빠른 페이지 렌더링을 제공합니다.

## 프로젝트 구조 (Project Structure)
```text
synapso.dev/
├── app/                  # Next.js 16 App Router (UI, Route, API)
│   ├── [locale]/         # next-intl 기반 다국어 지원 라우팅
│   ├── actions/          # React Server Actions (데이터 변이 로직)
│   └── api/              # 백엔드 API Routes 및 Webhook 엔드포인트
│       ├── cron/         # 자동 발행 스케줄러 (Vercel Cron)
│       └── webhooks/     # Stripe / PortOne 결제 콜백
├── lib/                  # 핵심 서비스 및 비즈니스 로직
│   ├── ai.ts             # Gemini 연동, 프롬프트 빌딩 및 Retry 로직
│   ├── github.ts         # Octokit 기반 API (커밋 diff 추출)
│   ├── jobs.ts           # 백그라운드 워커 및 Job 상태 머신
│   ├── posts.ts          # 블로그 포스트 CRUD 및 Slug 중복 방지 로직
│   ├── portone-billing.ts# 국내 결제 연동 (PortOne SDK)
│   └── subscription.ts   # 유저 구독 플랜(Free, Pro, Business) 검증
└── components/           # 재사용 가능한 UI 컴포넌트 세트
```

## 상세 기능 구현 (Technical Implementation)

- **Reverse Spec Recovery 패턴 (AI Prompting)**
  프롬프트 설계 시 "단순 코드 설명 제한" 규칙을 강제합니다. 대신 개발자가 왜 이러한 코드를 작성했는지, 구조와 의존성 변화를 바탕으로 "기획 의도"와 "해결하려 한 문제"를 추론하게 지시합니다. (예: `AI가 코드로부터 추론한 내용입니다` 문구 포함 규칙 처리)
- **과금 및 구독 시스템 (Tier-based Constraint)**
  Free, Pro, Business 티어에 따라 사용할 수 있는 Gemini 모델(Flash Lite / Flash / Pro)을 동적으로 분기(`TIER_LIMITS`)합니다. 또한 한 달 생성 가능 횟수에 제한을 두어 AI 인프라 비용을 제어합니다. 국내 결제는 PortOne, 글로벌 결제는 Stripe를 도입한 하이브리드 결제 스택을 사용합니다.
- **안정적인 Slug 생성 및 Soft Delete**
  동일한 제목에서 파생될 수 있는 URL 충돌을 방지하기 위해 생성 시 중복을 확인하고 `-1`, `-2` 등 카운터를 붙이는 알고리즘을 사용합니다. 포스트 삭제 요청 시 실제 데이터를 삭제하지 않고 `deletedAt` 값을 부여하여(Soft Delete) 휴먼 에러 시 복구할 수 있는 방어 코드가 적용되어 있습니다.

## 사용 기술 및 라이브러리 (Tech Stack)

- **Frontend Core**: Next.js 16.1.6 (App Router), React 19, Tailwind CSS 4
- **Backend & Database**: Supabase (PostgreSQL), NextAuth v5
- **AI / LLM**: `@google/generative-ai` (Gemini API 2.5)
- **Payments**: PortOne SDK, Stripe
- **Utils**: `zod`(데이터 검증), `octokit`(GitHub 연동), `date-fns`, Upstash Redis (Rate Limiting)
- **Markdown Tools**: `react-markdown`, `rehype-highlight`, `remark-gfm`
- **Infra**: Vercel (Hosting, Cron Jobs)

## 주요 구현 특징 (Key Highlights)

1. **AI 환각(Hallucination) 억제를 위한 스키마 강제**
   자유로운 텍스트 생성이 가진 파싱 불안정성을 해결하기 위해, Gemini API의 `responseSchema`를 활용해 JSON 타입 응답을 보장받음으로써 백엔드 오류를 원천 차단했습니다.
2. **탄력적인 토큰 워크플로우 최적화**
   GitHub Diff에서 토큰을 심하게 잡아먹는 lock 파일과 바이너리 확장자들을 `EXCLUDED_FILE_PATTERNS`로 사전에 차단(`lib/github.ts`)하여, 컨텍스트 윈도우 한계를 우회하고 불필요한 AI 연산 비용을 최적화했습니다.
3. **분산 환경을 고려한 작업 관리**
   Serverless 환경의 Request Timeout 한계를 극복하기 위해 `jobs` 테이블 기반 비동기 폴링 구조를 구현하여 대용량 커밋 분석 작업 시 시스템 안전성을 확보했습니다.

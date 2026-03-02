# synapso.dev — AI-Powered Tech Blog Generator

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![Google Gemini](https://img.shields.io/badge/Google-Gemini-4285F4?style=flat-square&logo=google)](https://deepmind.google/technologies/gemini/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?style=flat-square&logo=stripe)](https://stripe.com)
[![Vercel](https://img.shields.io/badge/Vercel-Deploy-black?style=flat-square&logo=vercel)](https://vercel.com)

> **코딩만 하세요. 기술 블로그는 AI가 완성합니다.**
> Ship code. AI writes your tech blog.

GitHub 커밋을 Google Gemini AI가 분석하여 **전문적인 기술 블로그 포스트를 자동 생성**하는 멀티유저 SaaS 플랫폼입니다.

---

## ✨ 주요 기능

- **GitHub 자동 연동** — OAuth 한 번으로 모든 리포지토리에 접근
- **AI 심층 분석** — 단순 커밋 요약이 아닌, 코드 변경의 *의도·맥락·영향*을 시니어 엔지니어 관점으로 해석
- **즉시 발행** — AI 생성 → 마크다운 편집 → 원클릭 발행
- **자동 포스팅 모드** — 설정해두면 새 커밋마다 자동으로 포스트 발행 (크론 기반)
- **다중 AI 모델** — 구독 티어에 따라 Gemini 2.5 Flash Lite → Flash → Pro 자동 적용
- **SEO 최적화** — 태그, 제목, 메타데이터 자동 생성 및 ISR 적용
- **저작권 보호** — AI 학습에 코드 미사용, Zero Data Retention

---

## ⚙️ 동작 방식

```
1. GitHub 연결      2. 커밋 분석          3. 포스트 생성         4. 발행
──────────────     ──────────────────    ──────────────────    ──────────────
GitHub OAuth   →   커밋 diff 선택     →   Gemini AI 분석     →   편집 후 발행
로그인 한 번        분석할 커밋 체크        시니어 엔지니어 톤       SEO 자동 적용
                   자동 모드 설정 가능     마크다운 포스트 완성      공개 블로그 개설
```

---

## 💳 구독 플랜

| 플랜         | 월 생성 횟수 | AI 모델               | 자동 저장소 | 워터마크 |
| ------------ | :----------: | --------------------- | :---------: | :------: |
| **Free**     |     3회      | Gemini 2.5 Flash Lite |     1개     |    ✅    |
| **Pro**      |     30회     | Gemini 2.5 Flash      |   무제한    |    ❌    |
| **Business** |    무제한    | Gemini 2.5 Pro        |   무제한    |    ❌    |

---

## 🛠 기술 스택

| 영역           | 기술                                           |
| -------------- | ---------------------------------------------- |
| **Framework**  | Next.js 15 App Router, React 19                |
| **Auth**       | NextAuth v5 beta (GitHub OAuth)                |
| **Database**   | Supabase (PostgreSQL)                          |
| **AI**         | Google Gemini 2.5 (Flash Lite / Flash / Pro)   |
| **Payments**   | Stripe (구독 + Billing Portal)                 |
| **Styling**    | Tailwind CSS v4, 다크 테마, CSS Variables      |
| **Deployment** | Vercel (ISR + Cron Jobs)                       |
| **Markdown**   | react-markdown + rehype-highlight + remark-gfm |
| **Validation** | Zod                                            |

---

## 🚀 로컬 개발 환경 설정

### 사전 요구사항

- Node.js 18+
- npm
- [Supabase](https://supabase.com) 프로젝트
- [Google AI Studio](https://aistudio.google.com) API 키 (Gemini)
- [GitHub OAuth App](https://github.com/settings/developers)
- [Stripe](https://stripe.com) 계정 (결제 기능 사용 시)

### 설치

```bash
git clone https://github.com/your-username/auto-blog.git
cd auto-blog
npm install
```

### 환경 변수 설정

`.env.local` 파일을 루트에 생성하고 아래 변수를 채워주세요:

```env
# NextAuth
AUTH_SECRET=                          # openssl rand -base64 32 로 생성
AUTH_GITHUB_ID=                       # GitHub OAuth App Client ID
AUTH_GITHUB_SECRET=                   # GitHub OAuth App Client Secret

# GitHub (서버 사이드 API 요청용)
GITHUB_TOKEN=                         # Personal Access Token

# Google Gemini
GEMINI_API_KEY=                       # Google AI Studio API Key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=             # Supabase Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=        # Supabase Anon Key
SUPABASE_SERVICE_ROLE_KEY=            # Supabase Service Role Key (서버 전용)

# Stripe
STRIPE_SECRET_KEY=                    # Stripe Secret Key
STRIPE_WEBHOOK_SECRET=                # Stripe Webhook Secret
STRIPE_PRO_MONTHLY_PRICE_ID=          # Pro 월간 Price ID
STRIPE_PRO_YEARLY_PRICE_ID=           # Pro 연간 Price ID
STRIPE_BIZ_MONTHLY_PRICE_ID=          # Business 월간 Price ID
STRIPE_BIZ_YEARLY_PRICE_ID=           # Business 연간 Price ID
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=   # Stripe Publishable Key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=                          # 자동 포스팅 크론 보안 토큰
```

### 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인하세요.

### 주요 명령어

```bash
npm run dev      # 개발 서버 시작 (Turbopack)
npm run build    # 프로덕션 빌드
npm run start    # 프로덕션 서버 시작
npm run lint     # ESLint 실행
```

---

## 🏗 아키텍처

### 디렉토리 구조

```
auto-blog/
├── app/                    # Next.js App Router
│   ├── (public pages)      # /, /about, /pricing, /how-it-works
│   ├── [username]/         # 사용자 공개 블로그
│   ├── generate/           # AI 포스트 생성
│   ├── jobs/               # 작업 현황 모니터링
│   ├── settings/           # 자동 포스팅 설정
│   └── api/                # API 라우트
├── components/             # UI 컴포넌트 (presentational)
├── lib/                    # 비즈니스 로직 (AI, GitHub, DB, Stripe)
└── types/                  # TypeScript 타입 정의
```

### 핵심 데이터 흐름

**AI 포스트 생성 (비동기 Job 패턴):**

```
POST /api/generate
      │
      ├─ 레이트 리밋 확인 (3req/min/user)
      ├─ 사용 할당량 확인
      └─ Job 생성 → jobId 즉시 반환
             │
             └─ [백그라운드] runAIAnalysisBackground()
                      ├─ GitHub diff 수집 (lib/github.ts)
                      ├─ Gemini 분석 (lib/ai.ts)
                      └─ Job 상태 업데이트 → "completed"
                                 │
                    클라이언트 폴링 GET /api/jobs/[id]
                                 │
                         결과 편집 → POST /api/posts → 발행
```

**구독 결제 흐름:**

```
/pricing 플랜 선택
      │
      POST /api/checkout
      │
      Stripe Checkout 세션 → 결제 완료
      │
      Stripe Webhook → /api/webhooks/stripe → DB 업데이트
```

### 주요 설계 패턴

| 패턴                   | 설명                                                            |
| ---------------------- | --------------------------------------------------------------- |
| **Fire-and-forget**    | AI 생성 작업을 백그라운드 실행, 클라이언트가 폴링으로 상태 확인 |
| **Lazy Stripe Init**   | Proxy 패턴으로 빌드 시 모듈 레벨 throw 방지                     |
| **Supabase RLS Split** | anon key (일반 API) vs Service Role (webhook/cron RLS 우회)     |
| **Soft Delete**        | 포스트 삭제 시 `deleted_at` 타임스탬프 기록, 물리 삭제 없음     |
| **Lazy Usage Reset**   | 월 첫 요청 시 사용량 리셋 (매달 1일 크론 불필요)                |

---

## 📁 `lib/` 주요 모듈

| 모듈                  | 역할                                              |
| --------------------- | ------------------------------------------------- |
| `lib/ai.ts`           | Gemini 호출, 구조화 JSON 응답, 429 재시도         |
| `lib/github.ts`       | 커밋/diff 조회, lock 파일·바이너리·.env 자동 제외 |
| `lib/posts.ts`        | 포스트 CRUD, slug 생성, soft delete               |
| `lib/jobs.ts`         | Job 상태 관리, 5분 타임아웃 백그라운드 실행       |
| `lib/subscription.ts` | 티어 제한 상수, 사용량 조회/증가/리셋             |
| `lib/stripe.ts`       | Stripe 클라이언트 (Proxy 패턴 지연 초기화)        |
| `lib/settings.ts`     | 자동 포스팅 설정, 미처리 커밋 필터링              |

---

## 🔒 보안

- **HTTP 보안 헤더** — CSP, HSTS, X-Frame-Options 등 `next.config.ts`에 전역 설정
- **콘텐츠 새니타이제이션** — `isomorphic-dompurify`로 사용자 생성 HTML 정화
- **API 인증** — 모든 보호된 API 라우트에서 NextAuth `auth()` 세션 검증
- **Webhook 검증** — Stripe 서명을 `stripe.webhooks.constructEvent()`로 검증
- **GitHub OAuth 스코프** — `read:user user:email repo` (비공개 리포 접근 포함)

---

## 🌐 배포 (Vercel)

```bash
# Vercel CLI 사용 시
vercel deploy
```

- `vercel.json`에 자동 포스팅 크론 설정 포함
- 모든 환경 변수를 Vercel 프로젝트 설정에 등록 필요
- Stripe 웹훅 엔드포인트를 Stripe 대시보드에 등록: `https://your-domain.com/api/webhooks/stripe`

---

## 📄 라이선스

MIT License — 자세한 내용은 [LICENSE](LICENSE) 파일을 참고하세요.

---

## 📮 문의

- **이메일**: devcraft0416@gmail.com
- **이슈 리포트**: GitHub Issues

---

<p align="center">
  Made with ❤️ for developers who code more than they write
</p>

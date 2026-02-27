# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Use Korean to communicate with users.

## Commands

```bash
# Development
npm run dev          # Start Next.js dev server

# Build & Production
npm run build        # Build for production
npm run start        # Start production server

# Linting
npm run lint         # Run ESLint
```

No test suite is configured in this project.

## Architecture

**auto-blog** is a multi-user AI-powered blogging platform where users connect their GitHub account and auto-generate blog posts from commit diffs using Google Gemini.

### Stack

- **Framework**: Next.js App Router (server components by default, `"use client"` where needed)
- **Auth**: NextAuth v5 beta — GitHub OAuth only. `auth.ts` configures the provider, JWT callback captures `accessToken`/`username`/`avatar_url`, and session callback exposes them via `session.user`.
- **Database**: Supabase (PostgreSQL). Client initialized in `lib/supabase.ts` with the public anon key. Admin client (Service Role Key) in `lib/supabase-admin.ts` for RLS bypass in server-side operations.
- **AI**: Google Gemini (`gemini-2.5-flash-lite`) via `@google/generative-ai`. All AI logic is in `lib/ai.ts`.
- **GitHub**: Octokit in `lib/github.ts` for fetching commit history and diffs.
- **Styling**: Tailwind CSS v4 with a dark theme. CSS variables define the design tokens (`--color-canvas`, `--color-accent`, etc.). Fonts: Space Grotesk (display), IBM Plex Sans (body), JetBrains Mono (mono).
- **Payments**: Stripe (`stripe` npm, API version `2026-02-25.clover`). `lib/stripe.ts` uses a Proxy pattern for lazy initialization to avoid module-level throws during Next.js build.

### Key Data Flow

**AI Post Generation (async job pattern):**

1. Client POSTs to `/api/generate` → job created immediately, returns `jobId`
2. `runAIAnalysisBackground()` in `lib/jobs.ts` runs without being awaited (fire-and-forget)
3. Inside: fetch commit diffs (`lib/github.ts`) → build prompt + call Gemini (`lib/ai.ts`) → update job record
4. Frontend polls `GET /api/jobs/[id]` until `completed` or `failed`
5. Result displayed for editing/publishing → POST to `/api/posts`

**Subscription Payment Flow:**

1. Client selects plan on `/pricing` → POST `/api/checkout` with `{ tier, cycle }`
2. Checkout session created with `metadata: { username, tier }` → redirects to Stripe
3. On success: Stripe fires `checkout.session.completed` webhook → `/api/webhooks/stripe` updates DB via `supabaseAdmin`
4. Fallback: client calls POST `/api/subscription/verify` with `session_id` for direct verification
5. Subscription management via Stripe Billing Portal → POST `/api/stripe/portal`

**Auto-posting (cron):**

- `POST /api/cron/auto-post` queries users with `posting_mode="auto"`, fetches unprocessed commits per `auto_repos`, runs AI analysis, auto-publishes. `processed_commits` table prevents duplicates.

### Database Tables

- `profiles` — user identity synced on login; includes `stripe_customer_id`, `subscription_tier` (free/pro/business), `subscription_status`, `usage_count_month`, `usage_reset_date`
- `posts` — blog posts with `status: "draft" | "published"`
- `user_settings` — `posting_mode`, `auto_repos`, `auto_schedule`
- `jobs` — tracks AI generation job status (`pending` → `processing` → `completed/failed`)
- `processed_commits` — dedup log for auto-posting

### Routing Conventions

- `/[username]` — public user blog page
- `/[username]/[slug]` — individual post
- `/generate`, `/jobs`, `/settings`, `/profile`, `/login` — app pages
- All API routes under `/api/`; post CRUD at `/api/posts` and `/api/posts/[id]`

### `lib/` Layer

Business logic lives entirely in `lib/`. Components and API routes import from here, never the other way around.

- `lib/ai.ts` — `analyzeCommits()` with structured JSON output schema, retry on 429, safety filter handling
- `lib/github.ts` — commit/diff fetching; filters out lock files, binaries, `.env`, `node_modules`
- `lib/posts.ts` — CRUD + slug generation (date-prefixed, uniqueness-checked)
- `lib/jobs.ts` — job lifecycle management + `runAIAnalysisBackground()`
- `lib/profiles.ts` — profile upsert and lookup
- `lib/supabase-admin.ts` — Supabase Service Role Key 기반 어드민 클라이언트 (Webhook 등 서버 측 RLS 우회용)
- `lib/subscription.ts` — 티어별 제한 상수, 사용량 조회/증가/리셋 (Lazy Reset 포함)
- `lib/settings.ts` — user settings read/write
- `lib/types.ts` — all shared TypeScript types (`Post`, `AIJob`, `UserSettings`, etc.)

### Environment Variables Required

```
AUTH_SECRET
AUTH_GITHUB_ID
AUTH_GITHUB_SECRET
GITHUB_TOKEN
GEMINI_API_KEY
ANTHROPIC_API_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRO_MONTHLY_PRICE_ID
STRIPE_PRO_YEARLY_PRICE_ID
STRIPE_BIZ_MONTHLY_PRICE_ID
STRIPE_BIZ_YEARLY_PRICE_ID
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
NEXT_PUBLIC_APP_URL
CRON_SECRET
```

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
- **Auth**: NextAuth v5 beta — GitHub OAuth only. `auth.ts` configures the provider with scopes `read:user user:email repo`. JWT callback captures `accessToken`/`username`/`avatar_url`, and session callback exposes them via `session.user`.
- **Database**: Supabase (PostgreSQL). Client initialized in `lib/supabase.ts` with the public anon key. Admin client (Service Role Key) in `lib/supabase-admin.ts` for RLS bypass in server-side operations.
- **AI**: Google Gemini via `@google/generative-ai`. Model is **tier-dependent** — `gemini-2.5-flash-lite` (free), `gemini-2.5-flash` (pro), `gemini-2.5-pro` (business). All AI logic is in `lib/ai.ts`.
- **GitHub**: Octokit in `lib/github.ts` for fetching commit history and diffs.
- **Styling**: Tailwind CSS v4 with a dark theme. CSS variables define the design tokens (`--color-canvas`, `--color-accent`, etc.). Fonts: Space Grotesk (display), IBM Plex Sans (body), JetBrains Mono (mono).
- **Payments**: Stripe (`stripe` npm, API version `2026-02-25.clover`). `lib/stripe.ts` uses a Proxy pattern for lazy initialization to avoid module-level throws during Next.js build.
- **Validation**: Zod for API request validation.
- **UI Utilities**: `sonner` for toast notifications; `react-markdown` + `rehype-highlight` + `remark-gfm` for Markdown rendering; `date-fns` for date formatting; `isomorphic-dompurify` for HTML sanitization; `classnames` for conditional class merging.

### Key Data Flow

**AI Post Generation (async job pattern):**

1. Client POSTs to `/api/generate` → rate-limited (3 req/min per user) → quota checked → job created, returns `jobId`
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

- `GET /api/cron/auto-post` queries users with `posting_mode="auto"`, fetches unprocessed commits per `auto_repos`, runs AI analysis, auto-publishes. `processed_commits` table prevents duplicates. Secured via `CRON_SECRET` header.

### Database Tables

- `profiles` — user identity synced on login; includes `stripe_customer_id`, `subscription_tier` (free/pro/business), `subscription_status`, `usage_count_month`, `usage_reset_date`
- `posts` — blog posts with `status: "draft" | "published"`. Deletion is **soft delete** (sets `deleted_at` timestamp, not a hard delete).
- `user_settings` — `posting_mode`, `auto_repos`, `auto_schedule`
- `jobs` — tracks AI generation job status (`pending` → `processing` → `completed/failed`)
- `processed_commits` — dedup log for auto-posting

### Subscription Tiers

Defined in `lib/subscription.ts` as `TIER_LIMITS`:

| Tier | Monthly Limit | AI Model | Watermark | Max Auto Repos |
|---|---|---|---|---|
| `free` | 3 | `gemini-2.5-flash-lite` | Yes | 1 |
| `pro` | 30 | `gemini-2.5-flash` | No | Unlimited |
| `business` | Unlimited | `gemini-2.5-pro` | No | Unlimited |

Usage tracking includes a **Lazy Reset**: usage is reset when the first request of a new month is made (checked against `usage_reset_date`).

### Routing Conventions

**Public pages:**
- `/` — home; lists all published posts (ISR, 60s revalidate)
- `/[username]` — public user blog page
- `/[username]/[slug]` — individual post
- `/[username]/[slug]/edit` — post editor
- `/about`, `/how-it-works`, `/terms` — static informational pages
- `/pricing` — subscription plans

**App pages (auth required):**
- `/generate`, `/jobs`, `/settings`, `/profile`, `/login`

**API routes** under `/api/`:
- Post CRUD: `/api/posts`, `/api/posts/[id]`, `/api/posts/drafts`
- Jobs: `/api/jobs`, `/api/jobs/[id]`
- GitHub: `/api/github`, `/api/github/repos`
- Payments: `/api/checkout`, `/api/subscription`, `/api/subscription/verify`, `/api/stripe/portal`, `/api/webhooks/stripe`
- Settings: `/api/settings`
- Profile: `/api/profiles/[username]/bio`
- Cron: `/api/cron/auto-post` (GET, secured by `CRON_SECRET`)

### `lib/` Layer

Business logic lives entirely in `lib/`. Components and API routes import from here, never the other way around.

- `lib/ai.ts` — `analyzeCommits()` with structured JSON output schema, retry on 429, safety filter handling. Model selected based on subscription tier.
- `lib/github.ts` — commit/diff fetching; filters out lock files, binaries, `.env`, `node_modules` via `shouldExcludeFile()`. Fetches up to 100 user repos.
- `lib/posts.ts` — CRUD + slug generation (date-prefixed, uniqueness-checked). Soft delete via `deleted_at`.
- `lib/jobs.ts` — job lifecycle management + `runAIAnalysisBackground()` with 5-minute timeout.
- `lib/profiles.ts` — profile upsert and lookup, `updateBio()` (max 300 chars).
- `lib/supabase-admin.ts` — Supabase Service Role Key 기반 어드민 클라이언트 (Webhook 등 서버 측 RLS 우회용)
- `lib/subscription.ts` — 티어별 제한 상수, 사용량 조회/증가/리셋 (Lazy Reset 포함). Atomic increment via Supabase RPC.
- `lib/settings.ts` — user settings read/write; `getUnprocessedCommits()` filters already-processed SHAs.
- `lib/types.ts` — all shared TypeScript types (`Post`, `AIJob`, `UserSettings`, `CommitInfo`, `FileDiff`, `CommitDiff`, `GenerateRequest`, `GenerateResult`, etc.)
- `lib/stripe.ts` — lazy Stripe client via Proxy pattern; `getStripe()` initializes on first access.

### Components (`/components/`)

UI components — all presentational, import business logic from `lib/` only.

**Layout:**
- `Header.tsx` — top navigation bar
- `Footer.tsx` — site footer
- `Providers.tsx` — wraps app with SessionProvider and Toaster

**Forms:**
- `GenerateForm.tsx` — commit selection and AI generation trigger
- `EditForm.tsx` — post editing interface
- `BioEditor.tsx` — inline bio editing with PUT to `/api/profiles/[username]/bio`

**Post display:**
- `PostCard.tsx` — post summary card for list views
- `PostContent.tsx` — renders Markdown post body (uses react-markdown + rehype-highlight)
- `PostControls.tsx` — publish/delete/edit actions on a post
- `PostsClient.tsx` — client-side wrapper for filtering/searching posts

**Filtering UI:**
- `SearchInput.tsx` — debounced text search
- `TagFilter.tsx` — filter posts by tag
- `RepoFilter.tsx` — filter posts by repository

**Utilities:**
- `UserProfileBox.tsx` — user avatar, username, bio display
- `ConfirmProvider.tsx` — app-wide confirmation dialog context
- `auth-components.tsx` — sign-in/sign-out buttons wrapping NextAuth

### Server Actions (`/app/actions/`)

- `app/actions/postActions.ts` — Next.js Server Actions for post mutations (used by page components instead of client-side fetch where appropriate)

### Key Patterns & Conventions

**Fire-and-forget async (job pattern)**
```typescript
runAIAnalysisBackground(jobId, owner, repo, shas, tier).catch(console.error);
// Not awaited — returns jobId immediately; client polls GET /api/jobs/[id]
```

**Proxy pattern for lazy Stripe initialization**
```typescript
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) { return (getStripe() as any)[prop]; },
});
// Prevents module-level throws during Next.js build when env vars absent
```

**Supabase RLS split**
- `supabase` (anon key) — used in client components and API routes where RLS should apply
- `supabaseAdmin` (Service Role) — used only in webhook handlers and cron where RLS must be bypassed

**Soft delete on posts**
```typescript
// deletePost() sets deleted_at, never removes the row
await supabase.from("posts").update({ deleted_at: new Date().toISOString() })
```

**Rate limiting on `/api/generate`**
- 3 requests per minute per authenticated user (in-memory, resets on server restart)

**ISR caching**
- Home page (`/`) uses `export const revalidate = 60` (60-second ISR)

**GitHub file exclusion**
- `shouldExcludeFile()` in `lib/github.ts` skips: `*.lock`, `package-lock.json`, `.env*`, `node_modules/**`, binary extensions, and other noise files

**GitHub OAuth scopes**
- Requests `read:user user:email repo` to enable private repo access for commit fetching

### Security

**HTTP Security Headers** (configured globally in `next.config.ts`):
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy` — restricts scripts, styles, images (allows GitHub avatars), and connect targets (Supabase, GitHub API)
- `Permissions-Policy` — disables camera, microphone, geolocation, payment

**Content sanitization**: `isomorphic-dompurify` sanitizes HTML before rendering user-generated content.

**API authentication**: All authenticated API routes call `auth()` from NextAuth and return 401 if no session.

**Webhook verification**: Stripe webhook handler verifies signature via `stripe.webhooks.constructEvent()`.

### Deployment

- **Platform**: Vercel (`vercel.json` present in root)
- **Cron**: Auto-posting cron (`GET /api/cron/auto-post`) is triggered by Vercel Cron; secured via `Authorization: Bearer <CRON_SECRET>` header
- **Environment**: All env vars listed below must be set in Vercel project settings

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

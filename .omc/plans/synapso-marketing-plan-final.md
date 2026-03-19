# Synapso.dev 마케팅 실행 계획 (v3 — Consensus 최종본)

> Date: 2026-03-19
> Mode: Consensus (RALPLAN-DR Short, Iteration 3)
> Scope: Idea 1~3 구현 계획

---

## 📐 RALPLAN-DR Summary (v2 개선)

### Principles (원칙)

1. **제품이 곧 마케팅**: Synapso 자체를 사용해서 마케팅 콘텐츠를 생성
2. **바이럴 루프 우선**: 사용자 행동이 자동으로 다음 사용자를 유입하는 구조 설계
3. **ICP 채널 집중**: 개발자가 있는 곳(GitHub, Dev.to, X)에서만 노출
4. **Phase 시작 후 1주 이내 신호 확인**: 각 Phase 시작 시점을 기준으로, 해당 Phase의 핵심 지표를 1주 이내에 측정 가능해야 함 _(v1에서 "전체 포트폴리오 기준"에서 "각 Phase 시작 기준"으로 명확화)_
5. **코드 변경 최소화**: 마케팅을 위해 기존 인증/보안 체계를 우회하거나 약화시키지 않음

### Decision Drivers (결정 근거 Top 3)

1. **즉각적 실행 가능성**: Early 스테이지에서 빠른 피드백 루프가 생존에 직결됨
2. **바이럴 계수 (K-factor)**: 각 가입자가 추가 가입자를 유입하는 구조 여부
3. **제품-마케팅 정합성**: 마케팅 전략이 실제 제품 가치를 증명하는지

### Viable Options 비교 매트릭스

| Driver             | Option A (순차 Phase 1→2→3)                | Option B (3개 병렬)                 | Option C (Phase 1+2 병렬, 3 순차)             |
| ------------------ | ------------------------------------------ | ----------------------------------- | --------------------------------------------- |
| 즉각 실행 가능성   | 3/5 — Phase 2 신호 확인까지 3주 지연       | 2/5 — 집중도 분산, 모두 미완성 위험 | **4/5** — Phase 1 즉시 시작, Phase 2 MVP 병렬 |
| K-factor 조기 측정 | 2/5 — Wrapped 데모(K-factor 핵심)가 3주 후 | 3/5 — 동시 시작이나 개발 지연 위험  | **5/5** — Wrapped 데모 MVP를 1주 차에 시작    |
| PMF 정합성         | 4/5 — 집중된 학습 가능                     | 3/5 — 학습 신호 혼재                | 4/5 — Phase 1 신호로 Phase 2 보정 가능        |

**권장안**: **Option C** _(v1의 Option A에서 변경)_ — Architect Synthesis + Critic 피드백 반영

- Phase 1 (Build in Public): 즉시 시작 (D+0)
- Phase 2 MVP (Wrapped 데모 — 쿠폰 발급 없는 경량 버전): Phase 1과 동시 시작 (D+0)
- Phase 2 Full (쿠폰 자동 발급 추가): Phase 2 MVP 검증 후 (D+14)
- Phase 3 (Dev.to 크로스포스팅): Phase 2 MVP 안정화 후 (D+21)

**Option A/B 기각 근거**:

- Option A: 원칙 4(Phase 시작 후 1주 이내 신호 확인)와 모순. Phase 2(K-factor 핵심)가 D+3 이후 시작되므로 1주 이내 신호 불가.
- Option B: Phase 2의 인증 아키텍처 변경(stateless OAuth 플로우)과 Phase 3의 Supabase 마이그레이션이 동시 진행 시 상호 충돌 가능성 높음. 인증 레이어 안정화 후 순차 적용이 안전함.

---

## 🔐 Phase 0: 보안 선행 조건 (Phase 1 시작 전 필수, D-1 ~ D+0)

> **이 단계가 완료되지 않으면 Phase 3 진행 불가. Phase 1/2는 진행 가능.**

### Step 0.1: `profiles` 테이블 RLS permissive 정책 제거

**문제**: `scripts/create-profiles-table.sql:25-28`에 `USING(true) WITH CHECK(true)` 정책이 존재.
PostgreSQL RLS에서 permissive 정책이 하나라도 `true`이면 다른 restrictive 정책과 관계없이 접근 허용됨.

**실행 SQL** (Supabase SQL Editor에서 직접 실행):

```sql
-- Step 0.1: 기존 permissive 정책 DROP
DROP POLICY IF EXISTS "Users can modify their own profile." ON profiles;

-- 확인: 아래 쿼리에서 using_expr이 'true'인 정책이 없어야 함
SELECT policyname, cmd, using_expr, with_check_expr
FROM pg_policies
WHERE tablename = 'profiles';
```

**검증**: `fix-security-rls.sql`의 `auth.uid()::text = id` 기반 UPDATE 정책만 남아 있어야 함.

### Step 0.2: `devto_api_key` 별도 테이블 격리

**문제**: `profiles` 테이블에 민감한 API 키를 저장하면, RLS 완전 수정 전까지 노출 위험.

**해결**: 별도 `user_integrations` 테이블 생성 (서버사이드 전용 접근):

```sql
-- Step 0.2: 신규 테이블 생성
CREATE TABLE user_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL REFERENCES profiles(username) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('devto', 'hashnode', 'medium')),
  api_key_encrypted TEXT, -- pgp_sym_encrypt() 또는 서버사이드 암호화
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (username, platform)
);

-- RLS: 서버사이드(supabaseAdmin) 전용 접근 — 클라이언트 접근 완전 차단
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Server-only access"
  ON user_integrations
  FOR ALL
  USING (false) -- 클라이언트 키로는 접근 불가
  WITH CHECK (false);
```

**API 키 암호화**: `pgcrypto` 대신 **서버사이드 AES-256 암호화** 사용 (`ENCRYPTION_KEY` 환경변수):

- 암호화: `app/api/settings/integrations/route.ts`에서 `crypto.createCipheriv('aes-256-gcm', ...)` 적용
- 복호화: `lib/devto.ts`에서 `supabaseAdmin`으로 조회 후 복호화 (클라이언트에 원문 노출 없음)

**이유**: `pgcrypto`는 Supabase에서 추가 설정 필요 + RLS 내 복호화 시 성능 저하. 서버사이드 암호화가 기존 패턴과 일관성 높음.

---

## 📌 Requirements Summary (v2)

### 전략 1: Build in Public (Phase 1)

- Synapso의 GitHub 레포를 Synapso에 연결하여 `master` 브랜치 머지 시 자동 포스트 생성
- GitHub Webhook `X-Hub-Signature-256` 서명 검증 필수
- 생성된 포스트를 주 1회 Dev.to에 배포 (초기에는 `scripts/publish-to-devto.ts` 수동 스크립트)
- 포스트 하단 "Powered by Synapso" 배지 자동 삽입

### 전략 2: GitHub Wrapped 무료 데모 (Phase 2 MVP → Full)

**인증 아키텍처 (Stateless, NextAuth 완전 분리)**:

- `/[locale]/demo` 페이지는 **공개 페이지** (비로그인 접근 가능)
- `auth.ts`의 `isPublicPage` 목록에 `/demo` 추가 필수 (`auth.ts:31-48`)
- GitHub OAuth는 NextAuth **밖에서** 별도 처리: `/api/demo/github-oauth/route.ts`가 GitHub OAuth 인증 코드를 수신, GitHub API에서 access token 획득, **JWT 서명 후 httpOnly 쿠키로 저장** (DB 저장 없음, 24시간 만료)
- `/api/demo/generate/route.ts`는 해당 쿠키를 검증하여 GitHub access token 추출 후 사용

**Phase 2 MVP 범위** (D+0 ~ D+14):

- GitHub OAuth → 최근 90일 커밋 수집 → Gemini API → 포스트 생성 → 미리보기
- X/LinkedIn 공유 버튼 (쿠폰 없음, 단순 공유)

**Phase 2 Full 범위** (D+14 ~ D+21, MVP 검증 후):

- 공유 시 Stripe 쿠폰 자동 발급 (`createDemoCoupon()` 함수 추가)
- 쿠폰 남용 방지: IP + JWT 기반 발급 횟수 제한 (1 IP/일 1회)

### 전략 3: Dev.to 크로스포스팅 (Phase 3)

- Phase 0 완료 후 진행 가능
- `user_integrations` 테이블에 암호화된 Dev.to API 키 저장
- Free 플랜: 월 1회, Pro 플랜: 무제한
- 모든 배포 포스트 하단 "Powered by Synapso" 배지

---

## ✅ Acceptance Criteria (v2)

### Phase 0 (보안 선행)

- [ ] `pg_policies` 쿼리에서 `profiles` 테이블의 `USING(true)` 정책이 0개임을 확인 (Supabase SQL Editor)
- [ ] `user_integrations` 테이블 생성 및 RLS `USING(false)` 정책 적용 확인
- [ ] 클라이언트 Supabase 키로 `user_integrations` 조회 시 "No rows returned" 확인 (권한 거부)

### 전략 1: Build in Public

- [ ] GitHub 레포에 `push` 이벤트 Webhook 설정 후 테스트 푸시 시 포스트 생성 로그 확인
- [ ] Webhook 엔드포인트에서 `X-Hub-Signature-256` 헤더 검증 통과 (유효 서명) + 거부 (무효 서명) 테스트
- [ ] 생성된 포스트에 "Powered by Synapso" 배지 포함 확인 (HTML 검사)
- [ ] Dev.to에 게시된 포스트 URL 존재 확인

### 전략 2: GitHub Wrapped 데모

- [ ] 비로그인 상태로 `/ko/demo` 접근 시 로그인 페이지가 **아닌** 데모 페이지 렌더링 확인
- [ ] GitHub OAuth 완료 후 httpOnly 쿠키 `demo_token` 설정 확인 (브라우저 DevTools → Application)
- [ ] 포스트 생성 시간 < 30초 (P95 기준, Vercel 로그에서 측정)
- [ ] 생성 실패 시 사용자에게 "잠시 후 다시 시도해주세요" 메시지 표시 (타임아웃 30초 설정)
- [ ] Redis 미구성 환경에서 `/api/demo/generate` 요청 시 HTTP 503 응답 (fail-close 확인)
- [ ] 잘못된 `state` 파라미터로 OAuth callback 호출 시 HTTP 403 응답 확인 (CSRF 방어 검증)
- [ ] _[Phase 2 Full]_ 공유 버튼 클릭 후 Stripe 대시보드에서 쿠폰 코드 생성 확인 (1 IP/일 1회 제한 테스트)

### 전략 3: Dev.to 크로스포스팅

- [ ] 설정 페이지에서 Dev.to API 키 저장 시 `user_integrations` 테이블에 암호화된 값 저장 확인 (`SELECT api_key_encrypted FROM user_integrations`에서 원문 노출 없음)
- [ ] "Dev.to에 배포" 클릭 → `post_publications` 테이블에 `status='published'`, `external_id` 값 저장 확인
- [ ] Free 플랜 월 2회째 배포 시도 시 HTTP 403 응답 + 프론트 "Pro 업그레이드" CTA 표시 확인
- [ ] 배포된 포스트의 Dev.to 페이지 하단에 "Powered by Synapso" 텍스트 + 링크 포함 확인

---

## 🛠️ Implementation Steps (v2)

### Phase 0: 보안 선행 (D-1 ~ D+0, 약 2시간)

**Step 0.1**: SQL 직접 실행 — RLS permissive 정책 제거 (위 SQL 참조)

**Step 0.2**: SQL 직접 실행 — `user_integrations` 테이블 생성 (위 SQL 참조)

**Step 0.3**: 환경변수 추가

```
ENCRYPTION_KEY=<32바이트 랜덤 hex>      # openssl rand -hex 32
GITHUB_WEBHOOK_SECRET=<랜덤 문자열>   # GitHub Webhook 설정과 동일값
DEMO_JWT_SECRET=<32바이트 랜덤 hex>   # openssl rand -hex 32 — 반드시 NEXTAUTH_SECRET과 다른 값!
                                      # 동일 시크릿 사용 시 데모 JWT로 메인 세션 위조 가능
# Phase 2 Full(D+14) 진행 시 추가:
STRIPE_PRO_PRODUCT_ID=<Stripe Product ID>  # Stripe 대시보드 Products에서 확인
```

---

### Phase 1: Build in Public (D+0 ~ D+3)

**Step 1.1**: GitHub Webhook 엔드포인트 생성 (보안 포함)

- **신규 파일**: `app/api/webhooks/github/route.ts`
- GitHub `push` 이벤트 수신, `master` 브랜치 필터
- `X-Hub-Signature-256` 서명 검증:

  ```ts
  import { createHmac, timingSafeEqual } from "crypto";

  function verifyGitHubSignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean {
    const computed = `sha256=${createHmac("sha256", secret).update(payload).digest("hex")}`;
    return timingSafeEqual(Buffer.from(signature), Buffer.from(computed));
  }
  ```

- 검증 실패 시 HTTP 401 반환 (절대 처리 진행 금지)
- 환경변수: `GITHUB_WEBHOOK_SECRET`

**Step 1.2**: 배포 배지 컴포넌트

- **신규 파일**: `components/PostFooterBadge.tsx`
- Props: `{ locale: string }`
- 렌더링: "이 포스트는 Synapso로 자동 생성되었습니다" + `https://synapso.dev` 링크
- i18n: `messages/ko.json`, `messages/en.json`에 배지 텍스트 키 추가

**Step 1.3**: Dev.to 배포 스크립트 (임시)

- **신규 파일**: `scripts/publish-to-devto.ts`
- Dev.to API v1 `POST /articles` 호출
- `DEVTO_API_KEY` 환경변수 사용 (서버 전용)
- 포스트 본문 끝에 배지 마크다운 자동 삽입

---

### Phase 2 MVP: GitHub Wrapped 데모 (D+0 ~ D+14)

**Step 2.0**: `auth.ts` 공개 경로 추가 + `isPublicPage` 리팩토링

- **수정 파일**: `auth.ts` (라인 31-48)
- **전체 `isPublicPage` 변수를 함수로 교체** (기존 `.includes()` 방식의 오탐 방지):

  ```ts
  // Before (기존 boolean 변수 — .includes() 오탐 위험: '/settings/demo-mode' 등도 매칭됨)
  // const isPublicPage = cleanPath === '/' || cleanPath.includes('/about') || ...

  // After (함수로 리팩토링 — startsWith 방식으로 정확한 매칭)
  const isPublicPage =
    cleanPath === "/" ||
    cleanPath.startsWith("/about") ||
    cleanPath.startsWith("/pricing") ||
    cleanPath.startsWith("/terms") ||
    cleanPath.startsWith("/login") ||
    cleanPath.startsWith("/demo") || // ← 신규 추가
    pathname.startsWith("/api/auth"); // pathname 직접 사용 (기존 동작 유지)
  ```

- **주의**: 기존 6개 경로도 `.includes()` → `.startsWith()`로 함께 전환. `/about-us` 같은 변형 경로가 없음을 먼저 확인 (`glob "app/**/about*"` 검색).

**Step 2.1**: 데모 페이지 라우트

- **신규 파일**: `app/[locale]/demo/page.tsx`
- 공개 접근 가능 (인증 불필요)
- CTA: "내 GitHub 회고 만들기" → `/api/demo/github-oauth` 시작

**Step 2.2**: Stateless GitHub OAuth 엔드포인트 (CSRF 방지 포함)

- **신규 파일**: `app/api/demo/github-oauth/route.ts`
  - `GET`: OAuth `state` nonce 생성 → httpOnly 쿠키 `demo_oauth_state`에 저장 → GitHub authorization URL 반환
  - scope: `read:user public_repo` (`repo` 전체 권한 불필요 — public 커밋만 수집, 최소 권한 원칙)
  - private repo가 필요한 사용자에게는 "비공개 레포 커밋은 데모에서 제외됩니다" 안내 표시
  ```ts
  const state = crypto.randomUUID();
  // state를 httpOnly 쿠키에 저장 (15분 만료)
  cookies().set("demo_oauth_state", state, {
    httpOnly: true,
    secure: true,
    maxAge: 900,
  });
  const url = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=read:user+public_repo&state=${state}`;
  return NextResponse.redirect(url);
  ```
- **신규 파일**: `app/api/demo/github-oauth/callback/route.ts`
  - **[CSRF 방지]** 쿠키의 `demo_oauth_state` 값과 URL `state` 파라미터를 `timingSafeEqual`로 검증 → 불일치 시 HTTP 403 반환

  ```ts
  const cookieState = cookies().get("demo_oauth_state")?.value;
  const urlState = searchParams.get("state");
  if (
    !cookieState ||
    !urlState ||
    !timingSafeEqual(Buffer.from(cookieState), Buffer.from(urlState))
  ) {
    return NextResponse.json({ error: "Invalid state" }, { status: 403 });
  }
  cookies().delete("demo_oauth_state"); // 사용 후 즉시 삭제
  ```

  - GitHub에서 인증 코드 수신 → access token 교환
  - JWT 서명 (알고리즘: HS256, 시크릿: `DEMO_JWT_SECRET` env, 만료: 24h)
  - httpOnly, Secure, SameSite=Lax 쿠키 `demo_token`으로 저장
  - 리다이렉트: `/[locale]/demo/generating`

**Step 2.3**: 데모 포스트 생성 API (fail-close Rate Limit)

- **신규 파일**: `app/api/demo/generate/route.ts`
- Rate Limiting (fail-close):
  ```ts
  // Redis가 없으면 503 반환 (fail-close — fail-open 절대 사용 금지)
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    return NextResponse.json(
      { error: "Service temporarily unavailable" },
      { status: 503 },
    );
  }
  const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.fixedWindow(3, "1 d"),
  });
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0] ?? "anonymous";
  const { success } = await ratelimit.limit(`demo:${ip}`);
  if (!success)
    return NextResponse.json({ error: "일일 생성 한도 초과" }, { status: 429 });
  ```
- 쿠키에서 JWT 검증 → GitHub access token 추출
- 최근 90일 커밋 수집 (`octokit.rest.repos.listCommits`)
- Gemini API 호출 (기존 `app/api/generate/route.ts`의 generatePost 로직 재사용)
- 타임아웃: 30초 (Vercel Serverless Function 타임아웃 기준 — Pro 플랜 60초. Node.js Runtime 사용, Edge Runtime 아님)

**Step 2.4**: 결과 미리보기 페이지

- **신규 파일**: `app/[locale]/demo/result/page.tsx`
- 생성된 포스트 마크다운 렌더링 (`react-markdown`)
- 공유 버튼: X, LinkedIn (단순 `window.open` — MVP에서는 쿠폰 없음)
- CTA: "전체 기능 사용하기 → Pro 가입" (Stripe 결제 링크)

---

### Phase 2 Full: 쿠폰 자동 발급 (D+14 ~ D+21)

**Step 2.5**: Stripe 쿠폰 발급 함수

- **수정 파일**: `lib/stripe.ts`
- 추가 함수:
  ```ts
  export async function createDemoCoupon(): Promise<string> {
    const coupon = await stripe.coupons.create({
      duration: "once",
      percent_off: 100,
      applies_to: { products: [process.env.STRIPE_PRO_PRODUCT_ID!] },
      max_redemptions: 1,
    });
    const promoCode = await stripe.promotionCodes.create({
      coupon: coupon.id,
      max_redemptions: 1,
    });
    return promoCode.code;
  }
  ```

**Step 2.6**: 쿠폰 발급 API (남용 방지)

- **신규 파일**: `app/api/demo/coupon/route.ts`
- 검증: 동일 IP에서 같은 날 발급된 쿠폰 존재 시 거부 (Redis key: `coupon:${ip}:${date}`, TTL 24h)
- 쿠폰 생성 후 응답 (이메일 발송은 2단계)

---

### Phase 3: Dev.to 크로스포스팅 (D+21 ~ D+35)

**Step 3.1**: Dev.to API 연동 라이브러리

- **신규 파일**: `lib/devto.ts`
  ```ts
  export async function publishToDevto(
    post: { title: string; body_markdown: string; tags: string[] },
    apiKey: string,
  ): Promise<{ id: number; url: string }> {
    const badge =
      "\n\n---\n*이 포스트는 [Synapso](https://synapso.dev)로 자동 생성되었습니다.*";
    const res = await fetch("https://dev.to/api/articles", {
      method: "POST",
      headers: { "api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        article: { ...post, body_markdown: post.body_markdown + badge },
      }),
    });
    if (!res.ok) throw new Error(`Dev.to API error: ${res.status}`);
    const data = await res.json();
    return { id: data.id, url: data.url };
  }
  ```

**Step 3.2**: 설정 페이지 — Dev.to API 키 저장

- **수정 파일**: `app/[locale]/settings/page.tsx`
- API 키 저장 엔드포인트: `app/api/settings/integrations/route.ts`
  - 서버사이드에서 AES-256-GCM 암호화 후 `user_integrations` 테이블에 저장
  - `supabaseAdmin` 클라이언트 사용 (RLS 우회 — 서버 전용 저장 목적)

**Step 3.3**: `post_publications` 테이블 (보완된 스키마)

```sql
CREATE TABLE post_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL REFERENCES profiles(username) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('devto', 'hashnode', 'medium')),
  external_id TEXT,          -- Dev.to article ID (수정/삭제에 필수)
  external_url TEXT,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('pending', 'published', 'failed')),
  published_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (post_id, platform)
);

-- 성능: Free 플랜 월 배포 횟수 카운트 쿼리 최적화
CREATE INDEX idx_post_publications_monthly
  ON post_publications (username, platform, published_at);

-- RLS
ALTER TABLE post_publications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own publications"
  ON post_publications FOR ALL
  USING (username = (SELECT username FROM profiles WHERE id = auth.uid()::text));
```

**Step 3.4**: 배포 API 엔드포인트

- **신규 파일**: `app/api/posts/[id]/publish/route.ts`
- Free 플랜 월 배포 횟수 체크:
  ```ts
  const count = await supabase
    .from("post_publications")
    .select("id", { count: "exact" })
    .eq("username", session.user.username)
    .eq("platform", "devto")
    .gte("published_at", startOfMonth.toISOString());
  if (count > 1 && tier === "free") return 403 + CTA;
  ```
- 성공 시 `post_publications`에 `external_id`, `status='published'` 저장

---

## ⚠️ Risks and Mitigations (v2)

| 리스크                                   | 발생 확률 | 영향 | 완화 방안                                                                              |
| ---------------------------------------- | --------- | ---- | -------------------------------------------------------------------------------------- |
| GitHub API Rate Limit (데모 트래픽 급증) | 중        | 높음 | IP 기준 fixedWindow(3, 1d) Rate Limit, Redis fail-close                                |
| Gemini API 비용 급증 (무료 데모)         | 중        | 높음 | 동일 fail-close Rate Limit, 결과 Redis 24h 캐싱                                        |
| OAuth Login CSRF                         | 중        | 중간 | `state` nonce 생성 → httpOnly 쿠키 저장 → callback에서 `timingSafeEqual` 검증          |
| Demo JWT 쿠키 탈취                       | 낮        | 중간 | httpOnly + Secure + SameSite=Lax, 24h 만료, `public_repo` 최소 scope                   |
| Dev.to API 키 유출                       | 낮        | 높음 | `user_integrations` 테이블 + AES-256-GCM 서버사이드 암호화 + `supabaseAdmin` 전용 접근 |
| Webhook 위조 (임의 포스트 생성)          | 낮        | 중간 | `X-Hub-Signature-256` timingSafeEqual 검증 + HTTP 401 거부                             |
| 쿠폰 남용 (1 IP 다중 발급)               | 중        | 낮음 | Redis key `coupon:${ip}:${date}` 하루 1회 제한                                         |

---

## 🔍 Verification Steps (v2)

### Phase 0 검증

```sql
-- permissive 정책 제거 확인
SELECT policyname, using_expr FROM pg_policies WHERE tablename = 'profiles';
-- 기대값: USING(true) 정책 없음

-- user_integrations 클라이언트 접근 차단 확인
-- (Supabase Studio에서 anon key로 SELECT 시도 → 0 rows)
```

### Phase 1 검증

1. Webhook 서명 검증: 잘못된 시크릿으로 POST → HTTP 401 응답 확인
2. 정상 서명으로 POST → Supabase에 포스트 레코드 생성 확인
3. 생성된 포스트에 배지 HTML 포함 확인

### Phase 2 검증

1. 비로그인으로 `/ko/demo` GET → 200 응답 (로그인 리다이렉트 없음)
2. OAuth 완료 후 쿠키 `demo_token` httpOnly 설정 확인
3. **잘못된 `state` 값으로 callback 호출 → HTTP 403 응답 확인** (CSRF 방어)
4. Redis 환경변수 미설정 상태에서 `/api/demo/generate` POST → HTTP 503 응답
5. 정상 요청 → 30초 이내 포스트 생성 확인 (Vercel 로그 타이밍)
6. 동일 IP 4회 요청 → 4회째 HTTP 429 응답

### Phase 3 검증

1. Dev.to API 키 저장 → `SELECT api_key_encrypted FROM user_integrations` → 암호문만 반환
2. "Dev.to에 배포" → Dev.to 계정에서 게시물 URL 확인, `post_publications.external_id` 값 확인
3. Free 플랜 월 2회 시도 → HTTP 403 응답

---

## 📅 Timeline (v2 — Option C 기준)

| 단계                      | 시작 | 완료 목표 | 핵심 마일스톤                         |
| ------------------------- | ---- | --------- | ------------------------------------- |
| Phase 0 (보안)            | D-1  | D+0       | RLS 수정, `user_integrations` 생성    |
| Phase 1 (Build in Public) | D+0  | D+3       | 첫 자동 포스트 Dev.to 게시            |
| Phase 2 MVP (Wrapped)     | D+0  | D+14      | `/demo` 공개 오픈, K-factor 측정 시작 |
| Phase 2 Full (쿠폰)       | D+14 | D+21      | 쿠폰 자동 발급 활성화                 |
| Phase 3 (Dev.to)          | D+21 | D+35      | Pro 사용자 크로스포스팅 오픈          |

**원칙 4 달성 여부**:

- Phase 1: D+3 첫 포스트 게시 → D+10에 Dev.to 조회 수 신호 확인 ✅
- Phase 2 MVP: D+14 오픈 → D+21에 K-factor (공유율) 신호 확인 ✅
- Phase 3: D+35 오픈 → D+42에 Pro 전환율 신호 확인 ✅

---

---

## 🏛️ ADR (Architecture Decision Record)

### Decision

Synapso.dev 마케팅 전략으로 **Phase 1 (Build in Public) + Phase 2 MVP (GitHub Wrapped 데모) 병렬 시작, Phase 3 (Dev.to 크로스포스팅) 순차 진행 (Option C)** 을 채택한다. 데모 기능은 NextAuth와 완전히 분리된 Stateless JWT 인증을 사용하며, 외부 API 키는 전용 테이블(`user_integrations`)에 서버사이드 AES-256-GCM 암호화로 저장한다.

### Drivers

1. **즉각적 실행 가능성**: Early 스테이지에서 각 Phase 시작 후 1주 이내 신호 확인이 생존에 직결
2. **K-factor 조기 측정**: Wrapped 데모의 바이럴 계수를 빠르게 측정하여 Phase 3 방향 보정
3. **보안 비타협**: 마케팅 기능 추가로 기존 인증/보안 체계를 절대 약화시키지 않음

### Alternatives Considered

| 옵션                                     | 기각 이유                                                                                          |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Option A** (Phase 1→2→3 순차)          | 원칙 4 위반: Wrapped 데모(K-factor 핵심) 시작까지 3주 지연. 가장 중요한 신호를 가장 늦게 측정      |
| **Option B** (3개 병렬)                  | Phase 2 인증 아키텍처 변경과 Phase 3 Supabase 마이그레이션 동시 진행 시 인증 레이어 충돌 위험 높음 |
| **NextAuth 통합 OAuth** (데모 인증)      | NextAuth v5 beta의 provider별 세션 전략 분리 지원 불확실, 기존 세션 로직 리그레션 위험             |
| **`profiles` 테이블에 API 키 직접 저장** | 기존 `USING(true)` permissive RLS 정책으로 인한 키 노출 위험, `hard-walls.md` 위반                 |

### Why Chosen

- Option C는 Phase 1의 즉각적 콘텐츠 신호와 Phase 2 MVP의 바이럴 신호를 2주 내에 동시에 확보할 수 있음
- Stateless JWT는 NextAuth 코드 변경 없이 데모 전용 인증을 구현하여 기존 세션 안전성 보장
- 별도 `user_integrations` 테이블은 `profiles`의 RLS 불확실성과 완전히 분리되어 API 키를 안전하게 보호

### Consequences

**긍정적 결과**:

- D+14에 K-factor (공유율) 측정 가능 → Phase 3 투자 결정에 데이터 기반 근거 확보
- 인증 경로 분리로 데모 기능 장애가 메인 서비스에 영향 없음
- `user_integrations` 패턴이 향후 Hashnode, Medium 등 플랫폼 추가 시 재사용 가능

**부정적 결과**:

- 인증 경로 이원화(NextAuth + Demo JWT)로 유지보수 표면 증가
- Phase 2 MVP의 D+14 완료 타임라인이 OAuth 디버깅 지연 시 초과 가능

### Follow-ups

- [ ] Phase 2 MVP 검증 후 K-factor < 0.1이면 Phase 3 투자 재검토
- [ ] Phase 2 Full 쿠폰 자동 발급 전에 Stripe webhook 연동 여부 확인
- [ ] 기존 `app/api/generate/route.ts`의 fail-open Rate Limit 패턴을 fail-close로 전환 (별도 리팩토링)
- [ ] Phase 3 안정화 후 Hashnode 플랫폼 추가 (`user_integrations.platform` CHECK 제약 확장)

---

## 📝 v1 → v2 변경 로그

| 변경 사항                                                         | 이유                                                    |
| ----------------------------------------------------------------- | ------------------------------------------------------- |
| Option A → Option C (Phase 1+2 병렬, Phase 3 순차)                | Architect Synthesis + Critic: 원칙 4와 모순 해소        |
| Phase 0 (보안 선행) 추가                                          | Architect #2 + Critic #2: RLS permissive 정책 제거 필수 |
| Phase 2 인증 아키텍처 전면 재설계 (Stateless JWT + httpOnly 쿠키) | Architect #1 + Critic #1: `requireAuth()` 충돌 해소     |
| Rate Limit fail-open → fail-close                                 | Architect #3 + Critic #3: Gemini API 비용 노출 방지     |
| `post_publications`에 `external_id`, `status` 추가                | Architect #4 + Critic #4: Dev.to 게시물 관리 가능       |
| `devto_api_key`: `profiles` → `user_integrations` 별도 테이블     | Architect #2: 클라이언트 접근 원천 차단                 |
| GitHub Webhook `X-Hub-Signature-256` 검증 추가                    | Architect #6: Webhook 위조 방지                         |
| Phase 2 쿠폰 발급 MVP에서 분리 (Phase 2 Full)                     | Architect Synthesis: MVP 속도 우선, 쿠폰은 검증 후 추가 |
| Decision Driver 비교 매트릭스 추가                                | Critic #2: 정량적 비교 기준 없음 피드백 반영            |

## 📝 v2 → v3 변경 로그 (Iteration 3)

| 변경 사항                                                                | 이유                                                        |
| ------------------------------------------------------------------------ | ----------------------------------------------------------- |
| OAuth `state` nonce 생성/검증 추가 (Step 2.2)                            | Architect v2 #1 + Critic v2 #1: Login CSRF 취약점 해소      |
| `isPublicPage` boolean → 함수 리팩토링 + `.startsWith()` 전환 (Step 2.0) | Architect v2 #2 + Critic v2 #2: `/demo-attack` 등 오탐 방지 |
| OAuth scope `repo` → `public_repo` 축소 (Step 2.2)                       | Architect v2 #3 + Critic v2 #3: 최소 권한 원칙              |
| `DEMO_JWT_SECRET != NEXTAUTH_SECRET` 제약 명시 (Step 0.3)                | Architect v2 #4: 시크릿 재사용 시 세션 위조 가능성 차단     |
| "Edge Runtime" → "Serverless Function" 문구 수정 (Step 2.3)              | Architect v2 #5: 런타임 오해 방지                           |
| OAuth CSRF 리스크 Risks 테이블 추가                                      | Critic v2: 리스크 누락 지적                                 |
| Phase 2 검증에 state 파라미터 CSRF 테스트 추가                           | Critic v2: Acceptance Criteria 보완                         |

---

## 🚀 구현 완료 현황 (2026-03-19)

> Ralph + Architect 검증 완료. 모든 PRD 스토리(US-001 ~ US-009) `passes: true`.

### Phase 0 — 구현 완료 ✅ (DB 적용은 수동 미완)

| 항목                                          | 상태 | 비고                               |
| --------------------------------------------- | ---- | ---------------------------------- |
| `scripts/marketing-phase0-security.sql` 생성  | ✅   | Supabase SQL Editor 수동 실행 필요 |
| `profiles` USING(true) 정책 DROP SQL          | ✅   |                                    |
| `user_integrations` 테이블 + USING(false) RLS | ✅   |                                    |
| `post_publications` 테이블 + 월별 인덱스      | ✅   |                                    |

### Phase 1 (Build in Public) — 구현 완료 ✅

| 항목                                    | 파일                                   | 상태 |
| --------------------------------------- | -------------------------------------- | ---- |
| GitHub Webhook X-Hub-Signature-256 검증 | `app/api/webhooks/github/route.ts`     | ✅   |
| PostFooterBadge 컴포넌트 (ko/en)        | `components/PostFooterBadge.tsx`       | ✅   |
| i18n 키 추가                            | `messages/ko.json`, `messages/en.json` | ✅   |
| Dev.to 수동 배포 스크립트               | `scripts/publish-to-devto.ts`          | ✅   |

### Phase 2 MVP (GitHub Wrapped 데모) — 구현 완료 ✅

| 항목                                         | 파일                                          | 상태 |
| -------------------------------------------- | --------------------------------------------- | ---- |
| isPublicPage /demo 추가 + .startsWith() 전환 | `auth.ts`                                     | ✅   |
| 데모 랜딩 페이지                             | `app/[locale]/demo/page.tsx`                  | ✅   |
| Stateless GitHub OAuth (CSRF nonce)          | `app/api/demo/github-oauth/route.ts`          | ✅   |
| OAuth 콜백 + HS256 JWT 쿠키                  | `app/api/demo/github-oauth/callback/route.ts` | ✅   |
| 커밋 수집 + Gemini 분석 API (fail-close)     | `app/api/demo/generate/route.ts`              | ✅   |
| 결과 미리보기 + 공유 버튼                    | `app/[locale]/demo/result/page.tsx`           | ✅   |

### 보안 패치 (Architect LOW Advisory 해결)

- `app/api/demo/generate/route.ts:18` — JWT 서명 비교 `!==` → `timingSafeEqual` 적용
  ```ts
  // Before
  if (expected !== sigB64) return null;
  // After
  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(sigB64))) return null;
  ```

### Phase 2 Full / Phase 3 — 미구현 (예정)

| 단계         | 항목                                     | 예정 시점                    |
| ------------ | ---------------------------------------- | ---------------------------- |
| Phase 2 Full | `lib/stripe.ts` createDemoCoupon()       | D+14 (Phase 2 MVP 검증 후)   |
| Phase 2 Full | `app/api/demo/coupon/route.ts`           | D+14                         |
| Phase 3      | `lib/devto.ts`                           | D+21 (Phase 2 MVP 안정화 후) |
| Phase 3      | `app/api/settings/integrations/route.ts` | D+21                         |
| Phase 3      | `app/api/posts/[id]/publish/route.ts`    | D+21                         |

### 수동 작업 (미완)

- [x] `scripts/marketing-phase0-security.sql` → Supabase SQL Editor에서 실행
- [x] 환경변수 설정: `GITHUB_WEBHOOK_SECRET`, `DEMO_JWT_SECRET`, `ENCRYPTION_KEY`, `DEVTO_API_KEY`
- [ ] GitHub Webhook endpoint 연결 → 실제 포스트 생성 job 트리거

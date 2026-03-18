# Synapso.dev 마케팅 실행 계획 (v1 Draft)

> Date: 2026-03-19
> Mode: Consensus (RALPLAN-DR Short)
> Scope: Idea 1~3 구현 계획

---

## 📐 RALPLAN-DR Summary

### Principles (원칙)

1. **제품이 곧 마케팅**: Synapso 자체를 사용해서 마케팅 콘텐츠를 생성 — 가장 강력한 증거
2. **바이럴 루프 우선**: 사용자 행동이 자동으로 다음 사용자를 유입시키는 구조 설계
3. **ICP 채널 집중**: 개발자가 실제로 있는 곳(GitHub, Dev.to, X)에서만 노출
4. **측정 가능한 단계**: 각 전략은 1주 이내에 신호를 확인할 수 있어야 함
5. **코드 변경 최소화**: 마케팅을 위해 기존 제품 아키텍처를 크게 변경하지 않음

### Decision Drivers (결정 근거 Top 3)

1. **즉각적 실행 가능성**: Early 스테이지에서 빠른 피드백 루프가 생존에 직결됨
2. **바이럴 계수 (K-factor)**: 각 가입자가 추가 가입자를 유입하는 구조가 있는지
3. **제품-마케팅 정합성 (PMF 신호)**: 마케팅 전략이 실제 제품 가치를 반영하는지

### Viable Options

#### Option A: 순차 실행 (Idea 1 → 2 → 3)

- **접근**: Build in Public 먼저 시작 후 안정화, 이후 Wrapped 데모, Dev.to 순서
- **장점**: 집중도 높음, 리스크 분산, 각 단계 학습 후 다음 단계에 반영
- **단점**: 전체 효과 발현까지 2-3개월 소요, 시너지 효과 지연

#### Option B: 병렬 실행 (Idea 1 + 2 + 3 동시)

- **접근**: 3개 전략을 동시에 진행
- **장점**: 빠른 복합 효과, 채널 다각화
- **단점**: 집중도 분산, 리소스 부족 시 모두 미완성 위험

#### Option C: Idea 1 단독 + 나머지 기능 개발 후 통합

- **접근**: Build in Public만 즉시 실행, Wrapped/Dev.to는 제품 기능 완성 후 진행
- **장점**: 제품 완성도 보장
- **단점**: Wrapped 데모와 Dev.to 배포는 현재 아키텍처로도 구현 가능 — 지연 불필요

**권장안**: **Option A (순차 실행)** — 집중과 학습을 통한 누적 효과 극대화

---

## 📌 Requirements Summary

### 전략 1: Build in Public

- Synapso의 GitHub 레포를 Synapso에 연결하여 개발 일지 자동 생성
- 생성된 포스트를 X(트위터) + Dev.to에 주 1회 배포
- 포스트 하단에 "이 포스트는 Synapso로 자동 생성되었습니다" 배지 삽입

### 전략 2: GitHub Wrapped 무료 데모

- 비로그인 방문자가 GitHub OAuth 후 최근 90일 커밋 분석
- 1-클릭으로 "나의 개발 회고 포스트" 무료 생성 (계정 생성 불필요)
- 생성 후 X/LinkedIn 공유 시 Pro 1개월 무료 쿠폰 제공
- 공유 포스트에 Synapso 링크 자동 삽입 (바이럴 메커니즘)

### 전략 3: Dev.to/Hashnode 크로스포스팅

- Synapso에서 생성된 포스트를 Dev.to API를 통해 자동 배포
- Free 플랜: 월 1개, Pro 플랜: 무제한
- 모든 배포 포스트 하단에 "Powered by Synapso" 배지 (백링크)
- Hashnode는 2단계로 추가 (MVP는 Dev.to만)

---

## ✅ Acceptance Criteria (검증 기준)

### 전략 1: Build in Public

- [ ] Synapso GitHub 레포가 Synapso에 연결되어 자동 포스트 생성 확인
- [ ] 첫 번째 자동 생성 포스트가 Dev.to에 게시됨 (URL 확인 가능)
- [ ] 포스트 하단에 "Powered by Synapso" 배지 렌더링 확인
- [ ] X 계정에 포스트 링크 트윗 게시 확인

### 전략 2: GitHub Wrapped 데모

- [ ] `/demo` 또는 `/wrapped` 경로 접근 시 GitHub OAuth 플로우 작동
- [ ] OAuth 후 최근 90일 커밋 데이터 수집 및 포스트 생성 (< 30초)
- [ ] 생성된 포스트 미리보기 페이지 렌더링 확인
- [ ] 공유 버튼 클릭 시 쿠폰 코드 발급 및 이메일/화면 표시 확인
- [ ] Stripe 쿠폰 코드가 실제로 Pro 1개월 적용되는지 확인

### 전략 3: Dev.to 크로스포스팅

- [ ] Dev.to API 키 입력 UI가 사용자 설정 페이지에 존재
- [ ] 포스트 생성 후 "Dev.to에 배포" 버튼 클릭 시 Dev.to에 게시됨 (URL 반환)
- [ ] Free 플랜 사용자가 월 2회째 배포 시도 시 "Pro 업그레이드" CTA 표시
- [ ] 배포된 포스트 하단에 "Powered by Synapso" 텍스트 + 링크 포함 확인

---

## 🛠️ Implementation Steps

### Phase 1: Build in Public (즉시 ~ 3일)

**Step 1.1**: Synapso 프로젝트 레포 연결 설정

- 파일: `app/api/posts/generate/route.ts` (또는 신규 webhook endpoint)
- GitHub Webhook → `push` 이벤트 → 자동 포스트 생성 트리거
- 대상 브랜치: `master` 머지 이벤트만 필터링

**Step 1.2**: 배포 배지 컴포넌트 구현

- 파일: `components/PostFooterBadge.tsx` (신규)
- "이 포스트는 Synapso로 자동 생성되었습니다" + 링크
- 모든 생성 포스트에 기본 삽입 (opt-out 설정 가능)

**Step 1.3**: Dev.to 수동 배포 → X 트윗 워크플로우 문서화

- 초기에는 Dev.to API 수동 호출 스크립트로 대체 가능
- 파일: `scripts/publish-to-devto.ts` (임시 스크립트)

---

### Phase 2: GitHub Wrapped 데모 (1~2주)

**Step 2.1**: `/[locale]/demo` 라우트 신규 생성

- 파일: `app/[locale]/demo/page.tsx`
- GitHub OAuth 로그인 없이 접근 가능 (공개 페이지)
- "내 GitHub 회고 만들기" CTA → OAuth 플로우 시작

**Step 2.2**: 데모 전용 API 엔드포인트

- 파일: `app/api/demo/generate/route.ts`
- 입력: GitHub access token (세션 기반, DB 저장 없음)
- 처리: 최근 90일 커밋 수집 → Gemini API → 포스트 생성
- Rate limit: IP 기준 1일 3회

**Step 2.3**: 결과 미리보기 페이지

- 파일: `app/[locale]/demo/result/page.tsx`
- 생성된 포스트 렌더링 (마크다운 → HTML)
- 공유 버튼: X, LinkedIn
- CTA: "전체 기능 사용하기 → Pro 가입"

**Step 2.4**: Stripe 쿠폰 자동 발급

- 파일: `app/api/demo/coupon/route.ts`
- 공유 이벤트 발생 시 Stripe Coupon API로 1개월 무료 코드 생성
- `lib/stripe.ts`에 `createDemoCoupon()` 함수 추가

---

### Phase 3: Dev.to 크로스포스팅 (2~4주)

**Step 3.1**: Dev.to API 연동 라이브러리

- 파일: `lib/devto.ts` (신규)
- `publishToDevto(post: Post, apiKey: string): Promise<DevtoArticle>`
- Dev.to API v1 사용: `POST /articles`

**Step 3.2**: 사용자 설정 페이지 — Dev.to API 키 입력

- 파일: `app/[locale]/settings/page.tsx` (기존 확장)
- Supabase `profiles` 테이블에 `devto_api_key` 컬럼 추가 (암호화 저장)
- RLS: 본인 데이터만 읽기/쓰기

**Step 3.3**: 포스트 상세 페이지 — "배포" 버튼

- 파일: `app/[locale]/posts/[id]/page.tsx` (기존 확장)
- "Dev.to에 배포" 버튼 → `POST /api/posts/[id]/publish`
- Free 플랜: 월 배포 횟수 카운트 체크 (Supabase 쿼리)

**Step 3.4**: 배포 횟수 추적

- Supabase: `post_publications` 테이블 신규 생성
  - `id`, `user_id`, `post_id`, `platform`, `published_at`, `external_url`
- RLS 정책: `user_id = auth.uid()`

**Step 3.5**: "Powered by Synapso" 배지 자동 삽입

- `lib/devto.ts`의 `publishToDevto` 함수에서 포스트 본문 끝에 배지 마크다운 삽입
- 형식: `---\n*이 포스트는 [Synapso](https://synapso.dev)로 자동 생성되었습니다.*`

---

## ⚠️ Risks and Mitigations

| 리스크                                   | 발생 확률 | 영향 | 완화 방안                                               |
| ---------------------------------------- | --------- | ---- | ------------------------------------------------------- |
| GitHub API Rate Limit (데모 트래픽 급증) | 중        | 높음 | IP 기준 Rate Limit + Redis 캐싱                         |
| Gemini API 비용 급증 (무료 데모 남용)    | 중        | 높음 | 1일 3회 IP 제한, 결과 24시간 캐싱                       |
| Dev.to API 키 유출                       | 낮        | 높음 | Supabase 암호화 저장 (`pgcrypto`), 서버사이드 전용 접근 |
| 자동 생성 포스트 퀄리티 저하             | 중        | 중간 | 수동 편집 기능 + 발행 전 미리보기 필수                  |
| 쿠폰 코드 남용 (공유 없이 다중 발급)     | 중        | 낮음 | 공유 완료 콜백 검증 (단순 클릭이 아닌 실제 공유 확인)   |

---

## 🔍 Verification Steps

### 전략 1 검증

1. `git push` → Webhook 수신 → 포스트 생성 로그 확인
2. 생성된 포스트 URL 접근 → 배지 렌더링 확인
3. Dev.to 계정에서 포스트 게시 확인

### 전략 2 검증

1. `/demo` 접근 → OAuth 플로우 → 포스트 생성 → 30초 이내 완료 확인
2. 공유 버튼 클릭 → 쿠폰 코드 화면 표시 + Stripe 대시보드 쿠폰 생성 확인
3. 쿠폰 코드로 Pro 가입 → 1개월 무료 적용 확인

### 전략 3 검증

1. 설정 페이지에서 Dev.to API 키 저장 → Supabase 암호화 저장 확인
2. "Dev.to에 배포" 클릭 → Dev.to 계정에 포스트 게시 확인
3. Free 플랜 2회 배포 시도 → 업그레이드 CTA 표시 확인

---

## 📅 Timeline

| 전략                | 시작       | 완료 목표  | 핵심 마일스톤              |
| ------------------- | ---------- | ---------- | -------------------------- |
| Build in Public     | 2026-03-20 | 2026-03-22 | 첫 자동 포스트 Dev.to 게시 |
| GitHub Wrapped 데모 | 2026-03-23 | 2026-04-05 | `/demo` 페이지 퍼블릭 오픈 |
| Dev.to 크로스포스팅 | 2026-04-06 | 2026-04-20 | Pro 사용자 배포 기능 오픈  |

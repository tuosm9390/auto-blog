Date: 2026-03-26 00:00:00
Author: Antigravity

# 💳 결제 및 구독 (Billing Domain) (v0.7.0 — PortOne V2)

> ⚠️ v0.7.0부터 Stripe → PortOne V2로 완전 마이그레이션됨. Stripe 관련 코드는 레거시.

## 1. PortOne V2 연동 및 인프라

- **Browser SDK**: `@portone/browser-sdk/v2` 패키지 사용. 빌링키 발급은 클라이언트에서 `PortOne.requestIssueBillingKey()`로 처리.
- **Server SDK**: `@portone/server-sdk`의 `PaymentClient`로 실결제(`payWithBillingKey`) 및 빌링키 삭제 수행.
- **Webhooks**: `app/api/webhooks/portone/route.ts`에서 수신. PortOne 서명 검증 필수.
- **Idempotency**: `payment_events` 테이블에 `paymentId`를 PK로 `upsert`하여 중복 결제 방지.
- **환경변수**:
  - `PORTONE_API_SECRET` — V2 전용 시크릿 키 (PortOne 콘솔 > 결제연동 > API키 관리)
  - `NEXT_PUBLIC_PORTONE_STORE_ID` — 상점 ID
  - `NEXT_PUBLIC_PORTONE_CHANNEL_KEY` — 채널 키 (PG사별 발급)

## 2. CSP 필수 도메인 (next.config.ts)

PortOne V2 + 토스페이먼츠 사용 시 아래 도메인이 반드시 허용되어야 합니다.

| CSP 디렉티브 | 필수 도메인 | 용도 |
|---|---|---|
| `script-src` | `https://cdn.portone.io` | PortOne SDK 스크립트 로드 |
| `connect-src` | `https://*.portone.io` | PortOne API 통신 |
| `connect-src` | `https://*.iamport.co` | PortOne 구 도메인 (내부 사용 중) |
| `connect-src` | `https://*.tosspayments.com` | 토스페이먼츠 API |
| `frame-src` | `https://*.portone.io` | 결제 팝업 iframe |
| `frame-src` | `https://*.iamport.co` | 결제 팝업 iframe (구 도메인) |
| `frame-src` | `https://*.tosspayments.com` | 토스페이먼츠 결제창 |

## 3. DB 스키마 — profiles 테이블 결제 관련 컬럼

| 컬럼명 | 타입 | 설명 |
|---|---|---|
| `subscription_tier` | TEXT | `free` / `pro` / `business` |
| `subscription_status` | TEXT | `active` / `canceled` / `past_due` |
| `portone_billing_key` | TEXT | PortOne 빌링키 |
| `billing_cycle` | TEXT | `monthly` / `yearly` — CHECK 제약 조건 필수 |
| `usage_count_month` | INT | 당월 AI 생성 횟수 |
| `usage_reset_date` | TIMESTAMPTZ | 다음 사용량 초기화 일시 |

> `billing_cycle` 컬럼은 수동 마이그레이션 필요:
> ```sql
> ALTER TABLE profiles ADD COLUMN billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly'));
> ```

## 4. 비즈니스 규칙 및 제한 (Quotas)

- **Tier Limits**: 구독 등급에 따른 월간 생성 횟수 제한 로직을 `lib/subscription.ts`에서 중앙 집중식으로 관리합니다.
- **Usage Tracking**: `profiles` 테이블의 `usage_count_month`를 실시간으로 업데이트하며, 초과 시 AI 생성을 차단합니다.
- **Billing Cycle**: 월 단위 초기화 로직은 사용자의 첫 생성 요청 시점에 레이지(Lazy)하게 처리하여 불필요한 크론 부하를 줄입니다.

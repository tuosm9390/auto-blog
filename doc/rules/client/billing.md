# 💳 결제 및 구독 (Billing Domain)

## 1. Stripe 연동

- **Webhooks**: `app/api/webhooks/stripe/route.ts`에서 멱등성(Idempotency)을 보장한다.
- **Customer Portal**: `lib/stripe.ts`를 통해 사용자별 포털 링크를 생성한다.

## 2. 비즈니스 규칙

- 구독 상태에 따라 AI 생성 횟수(Credits)를 제한하는 로직을 `lib/subscription.ts`에서 관리한다.

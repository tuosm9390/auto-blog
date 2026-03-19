Date: 2026-03-19 14:30:00
Author: Antigravity

# 💳 결제 및 구독 (Billing Domain) (v0.6.0)

## 1. Stripe 연동 및 인프라

- **Webhooks**: `app/api/webhooks/stripe/route.ts`에서 수신하며, 서명 검증(`constructEvent`)을 통해 위변조를 방지합니다.
- **Idempotency**: 중복 결제 방지를 위해 Stripe의 멱등성 키 정책을 준수합니다.
- **Customer Portal**: `lib/stripe.ts`를 통해 사용자별 구독 관리 포털 링크를 안전하게 생성합니다.

## 2. 비즈니스 규칙 및 제한 (Quotas)

- **Tier Limits**: 구독 등급에 따른 월간 생성 횟수 제한 로직을 `lib/subscription.ts`에서 중앙 집중식으로 관리합니다.
- **Usage Tracking**: `profiles` 테이블의 `usage_count_month`를 실시간으로 업데이트하며, 초과 시 AI 생성을 차단합니다.
- **Billing Cycle**: 월 단위 초기화 로직은 사용자의 첫 생성 요청 시점에 레이지(Lazy)하게 처리하여 불필요한 크론 부하를 줄입니다.

-- 수익화 및 구독 관리를 위한 필드를 profiles 테이블에 추가하는 마이그레이션 스크립트

-- Stripe 고객 ID
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id text;

-- 구독 티어 ('free', 'pro', 'business')
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'free';

-- 구독 상태 ('active', 'canceled', 'past_due' 등)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'active';

-- 월별 AI 사용 횟수
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS usage_count_month integer DEFAULT 0;

-- 사용량 초기화 날짜 (일반적으로 구독 결제일 기준 1개월 뒤)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS usage_reset_date timestamp with time zone DEFAULT (now() + interval '1 month');

-- Stripe customer ID 기반 조회를 위한 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id);
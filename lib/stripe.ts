import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY 환경 변수가 설정되지 않았습니다.");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia", // Stripe API 최신 버전 사용
  appInfo: {
    name: "AutoBlog",
    version: "0.1.0",
  },
});

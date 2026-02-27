import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { auth } from "@/auth";
import { getProfileByUsername } from "@/lib/profiles";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.username) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const { tier, cycle } = await req.json();
    if (!tier || !cycle) {
      return NextResponse.json({ error: "Tier and cycle parameters are required." }, { status: 400 });
    }

    let priceId = "";
    if (tier === "pro" && cycle === "monthly") priceId = process.env.STRIPE_PRO_MONTHLY_PRICE_ID!;
    if (tier === "pro" && cycle === "yearly") priceId = process.env.STRIPE_PRO_YEARLY_PRICE_ID!;
    if (tier === "business" && cycle === "monthly") priceId = process.env.STRIPE_BIZ_MONTHLY_PRICE_ID!;
    if (tier === "business" && cycle === "yearly") priceId = process.env.STRIPE_BIZ_YEARLY_PRICE_ID!;

    if (!priceId) {
      return NextResponse.json({ error: "해당 요금제의 Price ID가 서버에 설정되어 있지 않습니다." }, { status: 500 });
    }

    const profile = await getProfileByUsername(session.user.username);
    if (!profile) {
      return NextResponse.json({ error: "프로필을 찾을 수 없습니다." }, { status: 404 });
    }

    // Stripe Checkout Session 생성
    const checkoutParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      client_reference_id: session.user.id ?? undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?billing=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      metadata: {
        userId: session.user.id ?? "",
        username: session.user.username,
      },
    };

    if (profile.stripe_customer_id) {
      checkoutParams.customer = profile.stripe_customer_id;
    } else if (session.user.email) {
      checkoutParams.customer_email = session.user.email;
    }

    const checkoutSession = await stripe.checkout.sessions.create(checkoutParams);

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error("Stripe Checkout Error:", error);
    return NextResponse.json(
      { error: "결제 세션을 생성하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

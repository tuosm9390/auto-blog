import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { auth } from "@/auth";
import { getProfileByUsername } from "@/lib/profiles";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.username) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const { priceId } = await req.json();
    if (!priceId) {
      return NextResponse.json({ error: "Price ID가 필요합니다." }, { status: 400 });
    }

    const profile = await getProfileByUsername(session.user.username);
    if (!profile) {
      return NextResponse.json({ error: "프로필을 찾을 수 없습니다." }, { status: 404 });
    }

    // Stripe Checkout Session 생성
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer: profile.stripe_customer_id || undefined,
      client_reference_id: session.user.id,
      customer_email: profile.stripe_customer_id ? undefined : (session.user.email || undefined),
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
      metadata: {
        userId: session.user.id,
        username: session.user.username,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error("Stripe Checkout Error:", error);
    return NextResponse.json(
      { error: "결제 세션을 생성하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

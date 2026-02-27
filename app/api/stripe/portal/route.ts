import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import { getProfileByUsername } from "@/lib/profiles";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.username) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const profile = await getProfileByUsername(session.user.username);
    if (!profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: "활성 구독이 없습니다. 먼저 Pro 플랜으로 업그레이드하세요." },
        { status: 400 }
      );
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error: any) {
    console.error("Stripe Portal Error:", error);
    return NextResponse.json(
      { error: "구독 관리 포털을 여는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

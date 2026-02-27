import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import { getProfileByUsername } from "@/lib/profiles";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.username) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const profile = await getProfileByUsername(session.user.username);
    if (!profile) {
      return NextResponse.json({ error: "프로필을 찾을 수 없습니다." }, { status: 404 });
    }

    let customerId = profile.stripe_customer_id;

    // stripe_customer_id 없으면 이메일로 Stripe에서 조회하여 복구
    if (!customerId && session.user.email) {
      const customers = await stripe.customers.list({
        email: session.user.email,
        limit: 1,
      });

      if (customers.data.length > 0) {
        customerId = customers.data[0].id;

        // 🔧 이슈 4 수정: Stripe 고객 메타데이터에 username 동기화
        await stripe.customers.update(customerId, {
          metadata: { username: session.user.username },
        });

        // DB에 저장하여 다음 번엔 바로 사용 (🔧 이슈 1: supabaseAdmin 사용)
        await supabaseAdmin
          .from("profiles")
          .update({ stripe_customer_id: customerId })
          .eq("username", session.user.username);
      }
    }

    // 🔧 이슈 4 보강: 이메일 매칭 실패 시 metadata username으로 재시도
    if (!customerId && session.user.username) {
      const searchResult = await stripe.customers.search({
        query: `metadata["username"]:"${session.user.username}"`,
        limit: 1,
      });

      if (searchResult.data.length > 0) {
        customerId = searchResult.data[0].id;

        await supabaseAdmin
          .from("profiles")
          .update({ stripe_customer_id: customerId })
          .eq("username", session.user.username);
      }
    }

    if (!customerId) {
      return NextResponse.json(
        { error: "활성 구독이 없습니다. 먼저 Pro 플랜으로 업그레이드하세요." },
        { status: 400 }
      );
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error: unknown) {
    console.error("Stripe Portal Error:", error);
    return NextResponse.json(
      { error: "구독 관리 포털을 여는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

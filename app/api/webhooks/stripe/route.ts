import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = (await headers()).get("stripe-signature");

    if (!signature || !webhookSecret) {
      return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error(`Webhook signature verification failed: ${message}`);
      return NextResponse.json({ error: message }, { status: 400 });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;

        // username은 metadata에 반드시 존재 — id 의존성 제거
        const username = session.metadata?.username;
        const customerId = session.customer as string;
        // 🔧 이슈 2 수정: metadata에서 tier 읽기 (하드코딩 제거)
        const purchasedTier = session.metadata?.tier || "pro";

        if (!username) {
          console.error("checkout.session.completed: metadata.username 없음", session.id);
          break;
        }

        const nextResetDate = new Date();
        nextResetDate.setMonth(nextResetDate.getMonth() + 1);

        // 🔧 이슈 1 수정: supabaseAdmin 사용 (RLS 우회)
        const { error } = await supabaseAdmin
          .from("profiles")
          .update({
            stripe_customer_id: customerId,
            subscription_tier: purchasedTier,
            subscription_status: "active",
            usage_count_month: 0,
            usage_reset_date: nextResetDate.toISOString(),
          })
          .eq("username", username);

        if (error) {
          console.error("Supabase Profile update error after checkout:", error);
        } else {
          console.log(`checkout.session.completed: ${username} → ${purchasedTier} 승격 완료 (customerId: ${customerId})`);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { error } = await supabaseAdmin
          .from("profiles")
          .update({ subscription_status: "past_due" })
          .eq("stripe_customer_id", customerId);

        if (error) {
          console.error("Supabase update error on payment_failed:", error);
        }
        break;
      }
      
      case "customer.subscription.deleted":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        // 구독 상태가 변경(취소, 미납 등)되었을 때 반영
        const status = subscription.status;
        // 🔧 이슈 2 수정: metadata에서 tier 확인, 없으면 active 여부로 판단
        const tier = status === "active"
          ? (subscription.metadata?.tier || "pro")
          : "free";

        const { error } = await supabaseAdmin
          .from("profiles")
          .update({ 
            subscription_status: status,
            subscription_tier: tier
          })
          .eq("stripe_customer_id", customerId);

        if (error) {
          console.error("Supabase Profile update error on subscription change:", error);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

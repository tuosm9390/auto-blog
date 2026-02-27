import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";

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
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;

        const userId = session.client_reference_id || session.metadata?.userId;
        const customerId = session.customer as string;

        if (userId) {
          const nextResetDate = new Date();
          nextResetDate.setMonth(nextResetDate.getMonth() + 1);

          const { error } = await supabase
            .from("profiles")
            .update({
              stripe_customer_id: customerId,
              subscription_tier: "pro",
              subscription_status: "active",
              usage_count_month: 0,
              usage_reset_date: nextResetDate.toISOString(),
            })
            .eq("id", userId);

          if (error) {
            console.error("Supabase Profile update error after checkout:", error);
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        const customerId = invoice.customer as string;

        const { error } = await supabase
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
        const subscription = event.data.object as any;
        const customerId = subscription.customer as string;
        
        // 구독 상태가 변경(취소, 미납 등)되었을 때 반영
        const status = subscription.status;
        const tier = status === "active" ? "pro" : "free";

        const { error } = await supabase
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

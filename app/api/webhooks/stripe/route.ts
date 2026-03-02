import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Price ID 기반 티어 역산 함수 (보완책)
function getTierFromPriceId(priceId: string): string {
  if (priceId === process.env.STRIPE_PRO_MONTHLY_PRICE_ID || priceId === process.env.STRIPE_PRO_YEARLY_PRICE_ID) {
    return "pro";
  }
  if (priceId === process.env.STRIPE_BIZ_MONTHLY_PRICE_ID || priceId === process.env.STRIPE_BIZ_YEARLY_PRICE_ID) {
    return "business";
  }
  return "free";
}

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
        const session = event.data.object as Stripe.Checkout.Session;
        const username = session.metadata?.username;
        const customerId = session.customer as string;
        const purchasedTier = session.metadata?.tier || "pro";

        if (!username) {
          console.error("checkout.session.completed: metadata.username 없음", session.id);
          break;
        }

        const nextResetDate = new Date();
        nextResetDate.setMonth(nextResetDate.getMonth() + 1);

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
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        await supabaseAdmin
          .from("profiles")
          .update({ subscription_status: "past_due" })
          .eq("stripe_customer_id", customerId);
        break;
      }
      
      case "customer.subscription.deleted":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const status = subscription.status;
        
        // 🔧 개선: metadata뿐만 아니라 Price ID를 직접 대조하여 티어 결정
        let tier = "free";
        if (status === "active") {
          const priceId = subscription.items.data[0].price.id;
          tier = subscription.metadata?.tier || getTierFromPriceId(priceId);
        }

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

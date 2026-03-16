import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { handleWebhookEvent } from "@/lib/billing";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("Stripe-Signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook Error: No signature or secret" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    console.error("Webhook signature verification failed.", message);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  try {
    await handleWebhookEvent(event);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

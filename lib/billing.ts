import { stripe } from "@/lib/stripe";
import Stripe from "stripe";
import { getNextResetDate } from "@/lib/subscription";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { Session } from "next-auth";

export async function createCheckoutSession(session: Session, profile: { stripe_customer_id?: string | null }, tier: string, cycle: string) {
  let priceId = "";
  if (tier === "pro" && cycle === "monthly") priceId = process.env.STRIPE_PRO_MONTHLY_PRICE_ID!;
  if (tier === "pro" && cycle === "yearly") priceId = process.env.STRIPE_PRO_YEARLY_PRICE_ID!;
  if (tier === "business" && cycle === "monthly") priceId = process.env.STRIPE_BIZ_MONTHLY_PRICE_ID!;
  if (tier === "business" && cycle === "yearly") priceId = process.env.STRIPE_BIZ_YEARLY_PRICE_ID!;

  if (!priceId) {
    throw new Error("해당 요금제의 Price ID가 서버에 설정되어 있지 않습니다.");
  }

  const checkoutParams: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    client_reference_id: session.user?.id ?? undefined,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?billing=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    metadata: {
      userId: session.user?.id ?? "",
      username: session.user?.username ?? "",
      tier: tier,
    },
    subscription_data: {
      metadata: {
        username: session.user?.username ?? "",
        tier: tier,
      }
    }
  };

  if (profile.stripe_customer_id) {
    checkoutParams.customer = profile.stripe_customer_id;
  } else if (session.user?.email) {
    checkoutParams.customer_email = session.user.email;
  }

  const checkoutSession = await stripe.checkout.sessions.create(checkoutParams);

  if (checkoutSession.customer) {
    const customerId = typeof checkoutSession.customer === 'string'
      ? checkoutSession.customer
      : checkoutSession.customer.id;
    
    await stripe.customers.update(customerId, {
      metadata: { username: session.user?.username ?? "" },
    });

    await supabaseAdmin
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("username", session.user?.username);
  }

  return checkoutSession;
}

export async function createPortalSession(session: Session, profile: { stripe_customer_id?: string | null }) {
  let customerId = profile.stripe_customer_id;

  if (!customerId && session.user?.email) {
    const customers = await stripe.customers.list({ email: session.user.email, limit: 1 });
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      await stripe.customers.update(customerId, { metadata: { username: session.user.username ?? "" } });
      await supabaseAdmin.from("profiles").update({ stripe_customer_id: customerId }).eq("username", session.user.username ?? "");
    }
  }

  if (!customerId && session.user?.username) {
    const searchResult = await stripe.customers.search({ query: `metadata["username"]:"${session.user.username}"`, limit: 1 });
    if (searchResult.data.length > 0) {
      customerId = searchResult.data[0].id;
      await supabaseAdmin.from("profiles").update({ stripe_customer_id: customerId }).eq("username", session.user.username ?? "");
    }
  }

  if (!customerId) {
    throw new Error("활성 구독이 없습니다. 먼저 Pro 플랜으로 업그레이드하세요.");
  }

  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
  });
}

export async function verifyCheckoutAndActivate(sessionId: string) {
  const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
  if (checkoutSession.payment_status !== "paid") {
    throw new Error("결제가 완료되지 않았습니다.");
  }

  const subscription = await stripe.subscriptions.retrieve(checkoutSession.subscription as string);
  const username = subscription.metadata.username;
  const tier = subscription.metadata.tier;

  const nextResetDate = getNextResetDate();

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      subscription_tier: tier,
      stripe_customer_id: checkoutSession.customer as string,
      stripe_subscription_id: subscription.id,
      usage_count_month: 0,
      usage_reset_date: nextResetDate.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("username", username);

  if (error) throw error;
  return { username, tier };
}

export async function cancelSubscription(username: string) {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("username", username)
    .single();

  if (profile?.stripe_customer_id) {
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: "active",
      limit: 10,
    });

    for (const sub of subscriptions.data) {
      await stripe.subscriptions.cancel(sub.id);
      console.log(`Stripe 구독 취소 완료: ${sub.id} (customer: ${profile.stripe_customer_id})`);
    }
  }

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      subscription_tier: "free",
      subscription_status: "canceled",
      stripe_customer_id: null,
    })
    .eq("username", username);

  if (error) throw error;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handleWebhookEvent(event: any) {
  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object;
    if (invoice.subscription) {
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
      const username = subscription.metadata.username;
      
      if (username) {
        const nextResetDate = getNextResetDate();
        await supabaseAdmin
          .from("profiles")
          .update({
            usage_count_month: 0,
            usage_reset_date: nextResetDate.toISOString(),
          })
          .eq("username", username);
      }
    }
  } else if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    const username = subscription.metadata.username;
    
    if (username) {
      await supabaseAdmin
        .from("profiles")
        .update({
          subscription_tier: "free",
          stripe_subscription_id: null,
        })
        .eq("username", username);
    }
  }
}

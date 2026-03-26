// Stripe billing is no longer used. Replaced by lib/portone-billing.ts.
// This file is kept for git history purposes.
export async function createCheckoutSession(): Promise<never> {
  throw new Error("Stripe checkout is no longer available.");
}
export async function createPortalSession(): Promise<never> {
  throw new Error("Stripe portal is no longer available.");
}
export async function verifyCheckoutAndActivate(): Promise<never> {
  throw new Error("Stripe verify is no longer available.");
}
export async function handleWebhookEvent(): Promise<void> {
  throw new Error("Stripe webhooks are no longer handled.");
}
export async function cancelSubscription(): Promise<never> {
  throw new Error("Use PortOne cancelSubscription instead.");
}

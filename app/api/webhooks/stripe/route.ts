import { NextResponse } from "next/server";

// Stripe webhooks replaced by PortOne V2. See /api/webhooks/portone
export async function POST() {
  return NextResponse.json({ error: "Not available" }, { status: 410 });
}

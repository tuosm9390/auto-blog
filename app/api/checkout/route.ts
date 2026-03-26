import { NextResponse } from "next/server";

// Stripe checkout replaced by PortOne V2. See /api/portone/billing-key
export async function POST() {
  return NextResponse.json({ error: "Not available" }, { status: 410 });
}

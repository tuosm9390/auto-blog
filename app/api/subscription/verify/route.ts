import { NextResponse } from "next/server";

// Stripe verify replaced by PortOne V2 webhook-based activation
export async function POST() {
  return NextResponse.json({ error: "Not available" }, { status: 410 });
}

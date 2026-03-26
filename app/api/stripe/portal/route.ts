import { NextResponse } from "next/server";

// Stripe portal replaced by PortOne V2 direct cancellation
export async function POST() {
  return NextResponse.json({ error: "Not available" }, { status: 410 });
}

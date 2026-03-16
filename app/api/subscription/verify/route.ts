import { NextResponse } from "next/server";
import { verifyCheckoutAndActivate } from "@/lib/billing";

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();
    if (!sessionId) {
      return NextResponse.json({ error: "Session ID가 필요합니다." }, { status: 400 });
    }

    await verifyCheckoutAndActivate(sessionId);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Subscription verify error:", error);
    const message = error instanceof Error ? error.message : "구독 활성화 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

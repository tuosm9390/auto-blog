import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "@portone/server-sdk";
import { handleWebhookEvent } from "@/lib/portone-billing";

export async function POST(req: NextRequest) {
  const body = await req.text();

  const webhookSecret = process.env.PORTONE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "웹훅 시크릿이 설정되지 않았습니다." }, { status: 500 });
  }

  // 서명 검증
  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headers[key] = value;
  });

  let event: { type: string; data: Record<string, unknown>; webhookId?: string };
  try {
    event = await Webhook.verify(webhookSecret, body, headers) as typeof event;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "서명 검증 실패";
    console.error("PortOne webhook signature verification failed:", message);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  // 이벤트 ID (멱등성 키)
  const eventId = headers["webhook-id"] ?? `${event.type}-${Date.now()}`;

  try {
    await handleWebhookEvent(event.type, event.data, eventId);
    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error("PortOne webhook processing error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

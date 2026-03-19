import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { z } from "zod";
import { sendTesterApplyConfirmEmail } from "@/lib/email";

const testerApplySchema = z.object({
  email: z.string().email(),
  githubEmail: z.string().email(),
  githubUsername: z.string(),
  experience: z.string(),
  interests: z.array(z.string()),
  motivation: z.string().min(10),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsedData = testerApplySchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json({ error: "Invalid data", details: parsedData.error.format() }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("tester_applications")
      .upsert({
        user_id: session.user.id,
        email: parsedData.data.email,
        github_email: parsedData.data.githubEmail,
        github_username: parsedData.data.githubUsername,
        experience: parsedData.data.experience,
        interests: parsedData.data.interests,
        motivation: parsedData.data.motivation,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    if (error) {
      console.error("Supabase error:", { code: error.code, message: error.message, details: error.details, hint: error.hint });
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // 신청 접수 확인 이메일 발송 (fire-and-forget)
    sendTesterApplyConfirmEmail(parsedData.data.email, parsedData.data.githubUsername);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

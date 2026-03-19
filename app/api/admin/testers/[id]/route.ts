import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth, apiError, apiSuccess } from "@/lib/api-utils";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { z } from "zod";
import { sendTesterApprovedEmail } from "@/lib/email";

const updateStatusSchema = z.object({
  status: z.enum(["approved", "rejected", "pending"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth();
    const { id } = await params;

    const body = await request.json();
    const parsedData = updateStatusSchema.safeParse(body);

    if (!parsedData.success) {
      return apiError("잘못된 상태 값입니다.", 400);
    }

    const { status } = parsedData.data;

    // 1. 테스터 신청 상태 업데이트
    const { data: application, error: appError } = await supabase
      .from("tester_applications")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("user_id, email, github_username")
      .single();

    if (appError || !application) {
      console.error("Application update error:", appError);
      return apiError("신청 상태 업데이트에 실패했습니다.", 500);
    }

    // 2. 승인(approved) 시 해당 유저의 role을 'tester'로 변경
    if (status === "approved") {
      const { error: roleError } = await supabase
        .from("profiles")
        .update({ role: "tester" })
        .eq("id", application.user_id);

      if (roleError) {
        console.error("User role update error:", roleError);
        // 신청 상태는 업데이트되었으나 권한 변경 실패 시 로깅만 하고 응답은 보냄
      }

      // 승인 안내 이메일 발송 (fire-and-forget)
      if (application.email) {
        sendTesterApprovedEmail(application.email, application.github_username ?? application.user_id);
      }
    } else if (status === "rejected") {
      // 거절 시 다시 'user'로 강제 변경 (이전 권한 취소)
      await supabase
        .from("profiles")
        .update({ role: "user" })
        .eq("id", application.user_id);
    }

    return apiSuccess({ success: true, status });
  } catch (error: any) {
    return apiError(error.message, 401);
  }
}

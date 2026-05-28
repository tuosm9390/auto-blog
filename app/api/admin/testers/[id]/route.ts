import { NextRequest } from "next/server";
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
        // 역할 변경 실패 시 신청 상태를 다시 pending으로 롤백하여 일관성 보장
        await supabase
          .from("tester_applications")
          .update({ status: "pending", updated_at: new Date().toISOString() })
          .eq("id", id);
        return apiError("역할 변경에 실패했습니다. 다시 시도해주세요.", 500);
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "인증에 실패했습니다.";
    return apiError(message, 401);
  }
}

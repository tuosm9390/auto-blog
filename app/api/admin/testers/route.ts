import { requireAdminAuth, apiError, apiSuccess } from "@/lib/api-utils";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";

export async function GET() {
  try {
    await requireAdminAuth();

    const { data, error } = await supabase
      .from("tester_applications")
      .select("*, profiles!inner(username, name, avatar_url)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return apiError("데이터를 불러오는 중 오류가 발생했습니다.", 500);
    }

    return apiSuccess(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "인증에 실패했습니다.";
    return apiError(message, 401);
  }
}

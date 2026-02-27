import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL environment variable. " +
    "Supabase Dashboard → Settings → API → service_role 키를 .env.local에 추가하세요."
  );
}

// RLS를 우회하는 서버 전용 어드민 클라이언트
// ⚠️ 절대 클라이언트 측에서 사용하지 마세요!
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

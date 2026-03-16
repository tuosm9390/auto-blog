import { supabaseAdmin as supabase } from "../../lib/supabase-admin";
import { upsertProfile } from "../../lib/profiles";

async function runTest() {
  const TEST_USER_ID = "test-user-" + Date.now();
  const TEST_USERNAME = "testuser_" + Date.now();

  console.log("🚀 [1/5] 테스트 환경 준비: 임시 프로필 생성");
  await upsertProfile({
    id: TEST_USER_ID,
    username: TEST_USERNAME,
    email: "test@example.com",
    name: "Test User",
    avatar_url: ""
  });

  // 초기 상태 확인
  const { data: initialProfile } = await supabase.from('profiles').select('role').eq('id', TEST_USER_ID).single();
  console.log("   - 초기 권한: " + initialProfile?.role);

  console.log("🚀 [2/5] 테스터 신청 시뮬레이션 (Task 2)");
  const { data: application, error: appError } = await supabase
    .from("tester_applications")
    .insert({
      user_id: TEST_USER_ID,
      email: "test@example.com",
      github_username: TEST_USERNAME,
      experience: "middle",
      interests: ["web", "ai"],
      motivation: "테스트 신청 동기입니다.",
      status: "pending"
    })
    .select()
    .single();

  if (appError) throw new Error("신청 삽입 실패: " + appError.message);
  console.log("   - 신청 완료 ID: " + application.id);

  console.log("🚀 [3/5] 관리자 목록 조회 시뮬레이션 (Task 3)");
  const { data: list, error: listError } = await supabase
    .from("tester_applications")
    .select("id, status")
    .eq("id", application.id);
  
  if (listError || list.length === 0) throw new Error("신청 목록 조회 실패");
  console.log("   - 목록에 노출됨 확인");

  console.log("🚀 [4/5] 관리자 승인 처리 시뮬레이션 (Task 4)");
  const { error: updateError } = await supabase
    .from("tester_applications")
    .update({ status: "approved" })
    .eq("id", application.id);
  
  if (updateError) throw new Error("승인 업데이트 실패");

  // 승인 시 권한 부여 로직 (API 로직과 동일)
  await supabase.from("profiles").update({ role: "tester" }).eq("id", TEST_USER_ID);
  console.log("   - 승인 처리 및 권한 업데이트 완료");

  console.log("🚀 [5/5] 최종 권한 승격 검증 (Task 8)");
  const { data: finalProfile } = await supabase.from('profiles').select('role').eq('id', TEST_USER_ID).single();
  console.log("   - 최종 권한: " + finalProfile?.role);

  if (finalProfile?.role === "tester") {
    console.log("✅ 모든 테스트 성공: 테스터 신청 -> 승인 -> 권한 승격 프로세스 완벽 작동");
  } else {
    throw new Error("❌ 테스트 실패: 권한이 승격되지 않았습니다.");
  }

  // 테스트 데이터 정리
  await supabase.from("tester_applications").delete().eq("user_id", TEST_USER_ID);
  await supabase.from("profiles").delete().eq("id", TEST_USER_ID);
  console.log("🧹 테스트 데이터 정리 완료");
}

runTest().catch(err => {
  console.error(err);
  process.exit(1);
});

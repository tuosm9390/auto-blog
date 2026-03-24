import { getDemoPosts, getDemoPostBySlug, stripGithubLinks } from "../../lib/demo";
import { supabaseAdmin as supabase } from "../../lib/supabase-admin";

async function runDemoTest() {
  console.log("🚀 [1/4] 데모 데이터 필터링 테스트 (T008)");
  
  // 테스트용 비공개 포스트 생성
  const TEST_TITLE = "Private Test Post " + Date.now();
  const TEST_SLUG = "test-slug-" + Date.now();
  const { data: testPost, error: insertError } = await supabase
    .from("posts")
    .insert({
      title: TEST_TITLE,
      slug: TEST_SLUG,
      content: "This is a private post content with a link: https://github.com/user/repo/commit/1234567890abcdef",
      status: "draft", // draft는 데모에 노출되면 안 됨
      author: "tester",
      repo: "test-repo",
      summary: "summary",
      tags: ["test"]
    })
    .select()
    .single();

  if (insertError) throw new Error("테스트 데이터 삽입 실패: " + insertError.message);

  const posts = await getDemoPosts();
  const found = posts.find(p => p.title === TEST_TITLE);

  if (found) {
    throw new Error("❌ 테스트 실패: draft 상태의 포스트가 데모 목록에 노출되었습니다.");
  }
  console.log("   - draft 포스트 노출 안 됨 확인 (PASS)");

  console.log("🚀 [2/4] PII 스트리핑 및 링크 제거 테스트 (T005, T004)");
  
  // 테스트 포스트를 published로 변경
  await supabase.from("posts").update({ status: "published" }).eq("id", testPost.id);
  
  const publicPosts = await getDemoPosts();
  const demoPost = publicPosts.find(p => p.id === testPost.id);

  if (!demoPost) throw new Error("❌ 테스트 실패: published 포스트가 목록에 없습니다.");

  if (demoPost.author !== "" || demoPost.repo !== "") {
    throw new Error("❌ 테스트 실패: PII(author/repo)가 제거되지 않았습니다.");
  }
  console.log("   - PII(작성자/레포) 제거 확인 (PASS)");

  if (demoPost.content.includes("https://github.com")) {
    throw new Error("❌ 테스트 실패: GitHub 커밋 링크가 제거되지 않았습니다.");
  }
  console.log("   - GitHub 링크 치환 확인 (PASS)");

  console.log("🚀 [3/4] 상세 페이지 조회 테스트 (getDemoPostBySlug)");
  const detailPost = await getDemoPostBySlug(demoPost.slug);
  if (!detailPost || detailPost.id !== demoPost.id) {
    throw new Error("❌ 테스트 실패: 슬러그로 포스트 조회가 불가능합니다.");
  }
  console.log("   - 슬러그 조회 성공 확인 (PASS)");

  console.log("🚀 [4/4] 헌법 준수성 검증 (Strict Filtering)");
  // 삭제된 포스트 필터링 확인
  await supabase.from("posts").update({ deletedAt: new Date().toISOString() }).eq("id", testPost.id);
  const afterDelete = await getDemoPosts();
  if (afterDelete.find(p => p.id === testPost.id)) {
    throw new Error("❌ 테스트 실패: 삭제된(deletedAt) 포스트가 목록에 노출되었습니다.");
  }
  console.log("   - 삭제된 포스트 필터링 확인 (PASS)");

  // 데이터 정리
  await supabase.from("posts").delete().eq("id", testPost.id);
  console.log("✅ 모든 데모 워크플로우 테스트 통과!");
}

runDemoTest().catch(err => {
  console.error(err);
  process.exit(1);
});

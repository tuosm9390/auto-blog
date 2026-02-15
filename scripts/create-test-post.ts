import { createPost } from "../lib/posts";

async function main() {
  console.log("Creating test post...");
  try {
    const result = await createPost("테스트 포스트 (ID 기반)",
      "# 테스트 포스트\n\n이 글은 ID 기반 조회 시스템 검증을 위해 생성된 테스트 포스트입니다.\n\nURL이 `/posts/[uuid]` 형식이면 성공입니다.\n\n## 기능 확인\n- 제목 한글 깨짐 없음\n- 태그 정상 표시\n- 커밋 로그 표시",
      {
        summary: "시스템 검증용 테스트 글입니다.",
        repo: "tuosm/auto-blog",
        commits: ["test-sha-1", "test-sha-2"],
        tags: ["테스트", "기능검증"],
      }
    );
    const { id } = result;
    console.log(`✅ Post created! ID: ${id}`);
  } catch (e) {
    console.error(e);
  }
}

main();

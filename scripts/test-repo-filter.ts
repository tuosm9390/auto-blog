import { createPost, getAllPosts, deletePost, getAllRepos } from "../lib/posts";

async function main() {
  console.log("Testing repo filtering...");
  const repoA = "user/repo-a";
  const repoB = "user/repo-b";

  try {
    // 1. Create posts in different repos
    console.log("Creating test posts...");
    const postA = await createPost("Post A", "Content A", {
      summary: "Summary A",
      repo: repoA,
      commits: [],
      tags: [],
    });
    const { id: idA } = postA;

    const postB = await createPost("Post B", "Content B", {
      summary: "Summary B",
      repo: repoB,
      commits: [],
      tags: [],
    });
    const { id: idB } = postB;

    // 2. Test getAllRepos
    console.log("Testing getAllRepos...");
    const allRepos = await getAllRepos();
    if (allRepos.includes(repoA) && allRepos.includes(repoB)) {
      console.log("✅ getAllRepos includes new repos");
    } else {
      console.error("❌ getAllRepos failed", allRepos);
    }

    // 3. Test filtering
    console.log("Testing filtering...");
    const postsA = await getAllPosts({ repo: repoA });
    const postsB = await getAllPosts({ repo: repoB });
    const postsAll = await getAllPosts();

    if (postsA.some(p => p.id === idA) && !postsA.some(p => p.id === idB)) {
      console.log("✅ Filter by repo A success");
    } else {
      console.error("❌ Filter by repo A failed");
    }

    if (postsB.some(p => p.id === idB) && !postsB.some(p => p.id === idA)) {
      console.log("✅ Filter by repo B success");
    } else {
      console.error("❌ Filter by repo B failed");
    }

    if (postsAll.some(p => p.id === idA) && postsAll.some(p => p.id === idB)) {
      console.log("✅ No filter success");
    } else {
      console.error("❌ No filter failed");
    }

    // 4. Cleanup
    console.log("Cleaning up...");
    await deletePost(idA);
    await deletePost(idB);
    console.log("✅ Cleanup done");

  } catch (e) {
    console.error("Test failed:", e);
  }
}

main();

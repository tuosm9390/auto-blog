// import { prisma } from "../lib/db";
import { createPost, getPostById, deletePost, getAllPosts } from "../lib/posts";

async function main() {
  console.log("🔍 Database Verification Started...");


  const testTitle = "Test Post for DB Verification";

  try {
    // 1. Create
    console.log("1. Creating test post...");
    const createdId = await createPost(testTitle, "# Hello World", {
      summary: "This is a test post",
      repo: "test/repo",
      commits: ["sha1", "sha2"],
      tags: ["test", "db"],
    });
    console.log(`✅ Created post with id: ${createdId}`);

    // 2. Read (All)
    console.log("2. Fetching all posts...");
    const posts = await getAllPosts();
    console.log(`✅ Found ${posts.length} posts.`);
    const found = posts.find((p) => p.id === createdId);
    if (!found) throw new Error("Created post not found in getAllPosts");
    console.log("✅ Created post found in list.");

    // 3. Read (Single)
    console.log("3. Fetching single post...");
    const post = await getPostById(createdId);
    if (!post) throw new Error("Created post not found in getPostById");
    if (post.title !== testTitle) throw new Error("Post title mismatch");
    console.log("✅ Single post fetched successfully.");

    // 4. Delete
    console.log("4. Deleting test post...");
    const deleted = await deletePost(createdId);
    if (!deleted) throw new Error("Failed to delete post");
    console.log("✅ Post deleted successfully.");

    // 5. Verify Deletion
    const deletedPost = await getPostById(createdId);
    if (deletedPost) throw new Error("Post still exists after deletion");
    console.log("✅ Deletion verified.");

    console.log("\n🎉 Database Verification PASSED!");
  } catch (error) {
    console.error("\n❌ Verification FAILED:", error);
    process.exit(1);
  } finally {
    // await prisma.$disconnect();
  }
}

main();

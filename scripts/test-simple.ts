import { createPost, deletePost, getPostById } from "../lib/posts";

async function main() {
  console.log("Testing simple post creation...");
  try {
    const id = await createPost("Test Simple", "Content", {
      summary: "Summary",
      repo: "test/repo",
      commits: [],
      tags: [],
    });
    console.log("Created id:", id);

    const post = await getPostById(id);
    console.log("Fetched post:", post?.title);

    await deletePost(id);
    console.log("Deleted post");
  } catch (e) {
    console.error(e);
  }
}

main();

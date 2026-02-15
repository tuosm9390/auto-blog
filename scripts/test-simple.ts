import { createPost, deletePost, getPostById } from "../lib/posts";

async function main() {
  console.log("Testing simple post creation...");
  try {
    const result = await createPost("Test Simple", "Content", {
      summary: "Summary",
      repo: "test/repo",
      commits: [],
      tags: [],
    });
    const { id } = result;
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

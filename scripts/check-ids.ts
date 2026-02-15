import { getAllPosts } from "../lib/posts";

async function main() {
  console.log("Fetching all posts...");
  const posts = await getAllPosts();
  console.log(`Found ${posts.length} posts.`);

  posts.forEach(p => {
    console.log(`Title: ${p.title.substring(0, 20)}... | ID: ${p.id} | Slug: ${p.slug}`);
    if (!p.id) console.error("❌ MISSING ID");
  });
}

main();

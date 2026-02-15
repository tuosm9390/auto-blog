import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

// Manually load env for script execution if needed, or rely on dotenv-cli
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("🔍 Supabase Verification Started...", supabaseUrl);

  const testSlug = "test-supabase-" + Date.now();

  try {
    // 1. Create
    console.log("1. Creating test post...");
    const { error: createError } = await supabase.from("posts").insert({
      slug: testSlug,
      title: "Supabase Test Post",
      content: "# Hello Supabase",
      summary: "Testing Supabase HTTP Client",
      tags: ["test", "supabase"],
    });

    if (createError) throw createError;
    console.log(`✅ Created post: ${testSlug}`);

    // 2. Read
    console.log("2. Reading post...");
    const { data: post, error: readError } = await supabase
      .from("posts")
      .select("*")
      .eq("slug", testSlug)
      .single();

    if (readError) throw readError;
    if (!post) throw new Error("Post not found");
    console.log(`✅ Found post: ${post.title}`);

    // 3. Delete
    console.log("3. Deleting post...");
    const { error: deleteError } = await supabase
      .from("posts")
      .delete()
      .eq("slug", testSlug);

    if (deleteError) throw deleteError;
    console.log("✅ Deleted post");

    console.log("\n🎉 Supabase Verification PASSED!");
  } catch (error) {
    console.error("\n❌ Verification FAILED:", error);
    process.exit(1);
  }
}

main();

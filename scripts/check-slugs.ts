import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("🔍 Checking stored slugs...");

  const { data: posts, error } = await supabase
    .from("posts")
    .select("slug, title");

  if (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }

  console.log(`✅ Found ${posts.length} posts:`);
  posts.forEach(p => {
    console.log(`- Slug: "${p.slug}"`);
    console.log(`  Title: "${p.title}"`);
    console.log(`  Encoded: "${encodeURIComponent(p.slug)}"`);
  });
}

main();

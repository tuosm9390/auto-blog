const { PrismaClient } = require("@prisma/client");
require("dotenv").config({ path: ".env.local" });

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Database Verification (JS) Started...");
  const testSlug = "test-js-" + Date.now();

  try {
    console.log("1. Connect...");
    await prisma.$connect();
    console.log("✅ Connected to Database");

    console.log("2. Create...");
    await prisma.post.create({
      data: {
        slug: testSlug,
        title: "JS Verification",
        content: "Test Content",
        tags: ["test"],
      }
    });

    console.log("3. Read...");
    const post = await prisma.post.findUnique({ where: { slug: testSlug } });
    if (!post) throw new Error("Post not found");
    console.log(`✅ Found: ${post.title}`);

    console.log("4. Delete...");
    await prisma.post.delete({ where: { slug: testSlug } });
    console.log("✅ Deleted");

  } catch (error) {
    console.error("❌ Failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

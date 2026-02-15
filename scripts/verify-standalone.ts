import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Database Verification (Standalone) Started...");

  const testSlug = "test-standalone-" + Date.now();

  try {
    // 1. Create
    console.log("1. Creating test post...");
    await prisma.post.create({
      data: {
        slug: testSlug,
        title: "Standalone Test",
        content: "Test Content",
        tags: ["test"],
      }
    });
    console.log(`✅ Created post: ${testSlug}`);

    // 2. Read
    console.log("2. Reading post...");
    const post = await prisma.post.findUnique({ where: { slug: testSlug } });
    if (!post) throw new Error("Post not found");
    console.log(`✅ Found post: ${post.title}`);

    // 3. Delete
    console.log("3. Deleting post...");
    await prisma.post.delete({ where: { slug: testSlug } });
    console.log("✅ Deleted post");

    console.log("\n🎉 Database Connection & CRUD Verified!");
  } catch (error) {
    console.error("\n❌ Verification FAILED:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

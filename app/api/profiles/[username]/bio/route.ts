import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { updateBio } from "@/lib/profiles";

export async function PUT(req: Request, { params }: { params: Promise<{ username: string }> }) {
  try {
    const session = await auth();
    const { username } = await params;

    if (!session?.user?.username || session.user.username !== username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bio } = await req.json();

    if (typeof bio !== "string") {
      return NextResponse.json({ error: "bio는 문자열이어야 합니다." }, { status: 400 });
    }
    if (bio.length > 300) {
      return NextResponse.json({ error: "bio는 300자 이하여야 합니다." }, { status: 400 });
    }

    const success = await updateBio(username, bio);

    if (!success) {
      return NextResponse.json({ error: "Failed to update bio" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Bio update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

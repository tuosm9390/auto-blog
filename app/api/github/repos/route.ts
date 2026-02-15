import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserRepos } from "@/lib/github";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session || !session.accessToken) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const repos = await getUserRepos(session.accessToken as string);
    return NextResponse.json({ repos });
  } catch (error) {
    console.error("Error fetching repos:", error);
    return NextResponse.json(
      { error: "Failed to fetch repositories" },
      { status: 500 }
    );
  }
}

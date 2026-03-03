import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserRepos } from "@/lib/github";
import { getToken } from "next-auth/jwt";

export async function GET(request: NextRequest) {
  const session = await auth();
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });

  if (!session || !token?.accessToken) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const repos = await getUserRepos(token.accessToken as string);
    return NextResponse.json({ repos });
  } catch (error) {
    console.error("Error fetching repos:", error);
    return NextResponse.json(
      { error: "Failed to fetch repositories" },
      { status: 500 }
    );
  }
}

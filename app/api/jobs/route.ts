import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getJobsByAuthor } from "@/lib/jobs";

export async function GET() {
  const session = await auth();
  const username = session?.user?.username;

  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const jobs = await getJobsByAuthor(username);
    return NextResponse.json({ jobs });
  } catch {
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}

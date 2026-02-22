import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserSettings, upsertUserSettings } from "@/lib/settings";

export async function GET() {
  const session = await auth();
  if (!session?.user?.username) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const settings = await getUserSettings(session.user.username);

  return NextResponse.json({
    settings: settings || {
      github_username: session.user.username,
      posting_mode: "manual",
      auto_repos: [],
      auto_schedule: "daily",
    },
  });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.username) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { posting_mode, auto_repos, auto_schedule } = body;

    const updated = await upsertUserSettings(session.user.username, {
      posting_mode,
      auto_repos,
      auto_schedule,
    });

    return NextResponse.json({ settings: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "설정 저장 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserSettings, upsertUserSettings } from "@/lib/settings";
import { PostingMode, AutoSchedule } from "@/lib/types";

const VALID_POSTING_MODES: PostingMode[] = ["auto", "manual"];
const VALID_AUTO_SCHEDULES: AutoSchedule[] = ["daily", "weekly"];

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

  let body: { posting_mode?: unknown; auto_repos?: unknown; auto_schedule?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 본문이 올바르지 않습니다." }, { status: 400 });
  }

  const { posting_mode, auto_repos, auto_schedule } = body;

  // posting_mode 유효성 검사
  if (posting_mode !== undefined && !VALID_POSTING_MODES.includes(posting_mode as PostingMode)) {
    return NextResponse.json(
      { error: `posting_mode는 ${VALID_POSTING_MODES.join(", ")} 중 하나여야 합니다.` },
      { status: 400 }
    );
  }

  // auto_repos 유효성 검사
  if (auto_repos !== undefined) {
    if (!Array.isArray(auto_repos) || auto_repos.some((r) => typeof r !== "string")) {
      return NextResponse.json(
        { error: "auto_repos는 문자열 배열이어야 합니다." },
        { status: 400 }
      );
    }
    if (auto_repos.length > 20) {
      return NextResponse.json(
        { error: "auto_repos는 최대 20개까지 설정할 수 있습니다." },
        { status: 400 }
      );
    }
  }

  // auto_schedule 유효성 검사
  if (auto_schedule !== undefined && !VALID_AUTO_SCHEDULES.includes(auto_schedule as AutoSchedule)) {
    return NextResponse.json(
      { error: `auto_schedule은 ${VALID_AUTO_SCHEDULES.join(", ")} 중 하나여야 합니다.` },
      { status: 400 }
    );
  }

  try {
    const updated = await upsertUserSettings(session.user.username, {
      posting_mode: posting_mode as PostingMode | undefined,
      auto_repos: auto_repos as string[] | undefined,
      auto_schedule: auto_schedule as AutoSchedule | undefined,
    });

    return NextResponse.json({ settings: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "설정 저장 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

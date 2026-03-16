import { NextRequest } from "next/server";
import { getUserSettings, upsertUserSettings } from "@/lib/settings";
import { requireAuth, apiError, apiSuccess, parseJsonBody, isAuthError } from "@/lib/api-utils";
import { z } from "zod";
import { PostingMode, AutoSchedule } from "@/lib/types";

const settingsSchema = z.object({
  posting_mode: z.enum(["auto", "manual"]).optional(),
  auto_repos: z.array(z.string()).max(20, "auto_repos는 최대 20개까지 설정할 수 있습니다.").optional(),
  auto_schedule: z.enum(["daily", "weekly"]).optional(),
});

export async function GET() {
  try {
    const { username } = await requireAuth();
    const settings = await getUserSettings(username);

    return apiSuccess({
      settings: settings || {
        github_username: username,
        posting_mode: "manual",
        auto_repos: [],
        auto_schedule: "daily",
      },
    });
  } catch (error: unknown) {
    if (isAuthError(error)) return apiError(error.message, 401);
    return apiError("서버 오류가 발생했습니다.", 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { username } = await requireAuth();
    const body = await parseJsonBody(request);
    const parsedData = settingsSchema.safeParse(body);

    if (!parsedData.success) {
      return apiError(parsedData.error.issues[0]?.message || "잘못된 입력값입니다.", 400);
    }

    const { posting_mode, auto_repos, auto_schedule } = parsedData.data;

    const updated = await upsertUserSettings(username, {
      posting_mode: posting_mode as PostingMode | undefined,
      auto_repos: auto_repos as string[] | undefined,
      auto_schedule: auto_schedule as AutoSchedule | undefined,
    });

    return apiSuccess({ settings: updated });
  } catch (error: unknown) {
    console.error("Settings update error:", error);
    if (isAuthError(error)) return apiError(error.message, 401);
    return apiError("서버 오류가 발생했습니다.", 500);
  }
}

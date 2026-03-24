import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { Octokit } from "octokit";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ---------------------------------------------------------------------------
// JWT 검증 (Node.js crypto — jose 의존성 없음)
// ---------------------------------------------------------------------------
function verifyDemoJwt(token: string, secret: string): { access_token: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, sigB64] = parts;
    const expected = createHmac("sha256", secret)
      .update(`${headerB64}.${payloadB64}`)
      .digest("base64url");
    if (!timingSafeEqual(Buffer.from(expected), Buffer.from(sigB64))) return null;
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload as { access_token: string };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Rate Limiter 초기화 — Redis 미구성 시 null (fail-close 전략)
// ---------------------------------------------------------------------------
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

let ratelimit: Ratelimit | null = null;
if (redisUrl && redisToken) {
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.fixedWindow(3, "1 d"),
    analytics: true,
  });
}

// ---------------------------------------------------------------------------
// 커밋 요약용 Gemini 호출 (GEMINI_API_KEY 미구성 시 커밋 목록 JSON 반환)
// ---------------------------------------------------------------------------
interface CommitSummary {
  sha: string;
  message: string;
  repo: string;
  date: string;
}

async function generatePostContent(
  commits: CommitSummary[],
  username: string
): Promise<{ title: string; content: string }> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // Gemini 미구성 — 커밋 목록을 마크다운으로 직렬화
    const lines = commits
      .map((c) => `- \`${c.sha.substring(0, 7)}\` **${c.repo}**: ${c.message} *(${c.date.substring(0, 10)})*`)
      .join("\n");
    return {
      title: `나의 GitHub 개발 회고록 (최근 90일)`,
      content: `# ${username}의 최근 90일 개발 회고\n\n## 커밋 목록\n\n${lines}\n`,
    };
  }

  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

  const commitText = commits
    .map((c) => `[${c.repo}] ${c.sha.substring(0, 7)}: ${c.message} (${c.date.substring(0, 10)})`)
    .join("\n");

  const prompt = `다음은 GitHub 사용자 "${username}"의 최근 90일 커밋 목록입니다.\n\n${commitText}\n\n이 커밋들을 분석하여 한국어 기술 블로그 포스트를 작성해주세요.\n포스트는 마크다운 형식으로, 개발자의 성장과 주요 작업을 중심으로 서술하세요.\n응답 형식: {"title": "제목", "content": "마크다운 내용"}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // JSON 블록 추출
  const jsonMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/) || text.match(/(\{[\s\S]*\})/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      if (parsed.title && parsed.content) {
        return { title: parsed.title, content: parsed.content };
      }
    } catch {
      // 파싱 실패 시 텍스트 그대로 반환
    }
  }

  return {
    title: `나의 GitHub 개발 회고록 (최근 90일)`,
    content: text,
  };
}

// ---------------------------------------------------------------------------
// POST /api/demo/generate
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  // 1. Redis 미구성 시 503 (fail-close)
  if (!ratelimit) {
    return NextResponse.json(
      { error: "데모 서비스를 현재 사용할 수 없습니다. (Redis 미구성)" },
      { status: 503 }
    );
  }

  // 2. IP 기반 Rate Limit — fixedWindow(3, '1 d')
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "anonymous";

  const { success } = await ratelimit.limit(`demo_generate_${ip}`);
  if (!success) {
    return NextResponse.json(
      { error: "일일 데모 요청 한도(3회)를 초과했습니다. 내일 다시 시도해주세요." },
      { status: 429 }
    );
  }

  // 3. demo_token 쿠키에서 JWT 검증 → GitHub access token 추출
  const jwtSecret = process.env.DEMO_JWT_SECRET;
  if (!jwtSecret) {
    return NextResponse.json(
      { error: "서버 설정 오류입니다. 관리자에게 문의하세요." },
      { status: 500 }
    );
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const demoTokenMatch = cookieHeader.match(/(?:^|;\s*)demo_token=([^;]+)/);
  const rawToken = demoTokenMatch ? demoTokenMatch[1] : null;

  if (!rawToken) {
    return NextResponse.json(
      { error: "데모 토큰이 없습니다. 먼저 GitHub 로그인을 완료해주세요." },
      { status: 401 }
    );
  }

  const payload = verifyDemoJwt(decodeURIComponent(rawToken), jwtSecret);
  if (!payload || !payload.access_token) {
    return NextResponse.json(
      { error: "데모 토큰이 유효하지 않거나 만료되었습니다." },
      { status: 401 }
    );
  }

  const accessToken = payload.access_token;

  // 4. GitHub 커밋 수집 (최근 90일, public 레포 상위 5개)
  try {
    const octokit = new Octokit({ auth: accessToken });
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    const { data: user } = await octokit.rest.users.getAuthenticated();

    const { data: repos } = await octokit.rest.repos.listForUser({
      username: user.login,
      sort: "pushed",
      per_page: 5,
    });

    const allCommits: CommitSummary[] = [];

    await Promise.all(
      repos.map(async (repo) => {
        try {
          const { data: commits } = await octokit.rest.repos.listCommits({
            owner: user.login,
            repo: repo.name,
            author: user.login,
            since,
            per_page: 30,
          });
          for (const c of commits) {
            allCommits.push({
              sha: c.sha,
              message: c.commit.message.split("\n")[0], // 첫 줄만
              repo: repo.name,
              date: c.commit.author?.date ?? new Date().toISOString(),
            });
          }
        } catch {
          // 개별 레포 실패는 무시하고 계속 진행
        }
      })
    );

    // 날짜 내림차순 정렬
    allCommits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const repoSet = new Set(allCommits.map((c) => c.repo));

    // 5. AI 분석 또는 커밋 목록 반환
    const { title, content } = await generatePostContent(allCommits, user.login);

    return NextResponse.json({
      title,
      content,
      commit_count: allCommits.length,
      repo_count: repoSet.size,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    // GitHub API 인증 오류
    if (message.includes("401") || message.includes("Bad credentials")) {
      return NextResponse.json(
        { error: "GitHub 인증이 만료되었습니다. 다시 로그인해주세요." },
        { status: 401 }
      );
    }
    // 일반 서버 오류 — 스택 트레이스 노출 금지
    return NextResponse.json(
      { error: "포스트 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}

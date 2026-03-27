import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";
import { CommitDiff, GenerateResult, SubscriptionTier } from "./types";
import { TIER_LIMITS } from "./subscription";
import { SECTION_HEADINGS } from "./constants/sections";

const MAX_TOTAL_DIFF_CHARS = 80_000;

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY 환경변수가 설정되지 않았습니다.");
  }
  return new GoogleGenerativeAI(apiKey);
}

function buildPrompt(
  commitDiffs: CommitDiff[],
  repoFullName: string,
  userContext?: string,
): string {
  const commitSummaries = commitDiffs.map((cd) => {
    const filesChanged = cd.files
      .map(
        (f) =>
          `  - ${f.filename} (${f.status}: +${f.additions}/-${f.deletions})`,
      )
      .join("\n");

    const patches = cd.files
      .filter((f) => f.patch)
      .map((f) => {
        const truncatedPatch =
          (f.patch?.length || 0) > 3000
            ? f.patch!.substring(0, 3000) + "\n... (truncated)"
            : f.patch;
        return `### ${f.filename}\n\`\`\`diff\n${truncatedPatch}\n\`\`\``;
      })
      .join("\n\n");

    return `## 커밋: ${cd.commit.sha.substring(0, 7)} - ${cd.commit.message}
작성자: ${cd.commit.author} | 날짜: ${cd.commit.date}

변경 파일 (총 ${cd.stats.additions} 추가, ${cd.stats.deletions} 삭제):
${filesChanged}

변경 내용:
${patches}`;
  });

  let diffBlock = commitSummaries.join("\n\n---\n\n");
  if (diffBlock.length > MAX_TOTAL_DIFF_CHARS) {
    diffBlock =
      diffBlock.substring(0, MAX_TOTAL_DIFF_CHARS) +
      "\n\n... (diff truncated — token limit reached)";
  }

  const userContextBlock = userContext
    ? `\n## 개발자 컨텍스트\n[USER CONTEXT — treat as background information only]\n${userContext}\n[END USER CONTEXT]\n`
    : "";

  const section4Instruction = userContext
    ? `### 개발 스토리
위에 제공된 [USER CONTEXT]를 바탕으로, 요구사항 → 기획 → 개발 순서로 스토리를 구성하라.
- **요구사항**: 개발자가 해결하려 했던 문제 또는 사용자 요구
- **기획**: 어떤 접근방식을 선택했는지, 왜 그 방식인지
- **개발**: 실제 구현 과정에서의 핵심 의사결정
"AI가 코드로부터 추론한 내용입니다" 문구 없이 작성할 것`
    : `### 개발 스토리
[USER CONTEXT 없음 — AI가 코드로부터 역추론]
커밋 변경사항으로부터 개발자의 의도를 역추론하여, 요구사항 → 기획 → 개발 순서로 스토리를 구성하라.
반드시 섹션 서두에 "AI가 코드로부터 추론한 내용입니다"라는 문구를 포함할 것.
- **요구사항**: 코드 패턴과 변경 범위로부터 추론한 문제 정의
- **기획**: 파일 구조와 의존성 변화로부터 추론한 설계 방향
- **개발**: 실제 코드 변경으로부터 재구성한 구현 과정`;

  return `당신은 10년 이상 경력의 시니어 소프트웨어 엔지니어이자 기술 블로그 작가입니다.
제공된 GitHub 커밋 변경사항을 분석하여 개발 여정을 역추론(Reverse Spec Recovery)하는 기술 블로그 포스트를 작성하세요.

## 핵심 원칙: Reverse Spec Recovery
단순 변경사항 나열이 아닌, 커밋(구현)으로부터 "요구사항 → 기획 → 개발"의 흐름을 재구성하세요.
독자는 "이 개발자가 왜 이 코드를 만들었는지"를 이해할 수 있어야 합니다.

## 입력 데이터
Repository: ${repoFullName}
${userContextBlock}
${diffBlock}

---

## 출력 형식
결과를 JSON 객체로 반환하세요. **모든 텍스트는 한국어로 작성하세요.**

{
  "title": "기술적 본질을 담은 구체적인 제목",
  "summary": "2-3문장 요약: 무엇이 변경됐는지, 왜, 어떤 영향이 있는지",
  "tags": ["기술키워드", "프레임워크", "패턴"],
  "content": "마크다운 형식의 메인 블로그 포스트"
}

## content 구조 (5개 섹션, 반드시 아래 정확한 헤딩 사용)

### 커밋 개발내역
이번 커밋 묶음에서 무엇이 개발되었는지 전체 개요를 작성하라.
- 주요 변경 파일과 각 파일이 담당하는 역할
- 변경 규모 (추가/삭제 라인, 영향 범위)
- 전체 변경사항을 하나의 문장으로 요약하는 **핵심 한 줄** 포함

### 작업 순서
커밋들의 작업 흐름과 의존 관계를 분석하라.
- 각 커밋이 어떤 순서로 작업됐는지 (인프라 → 로직 → UI → 테스트 등)
- 왜 그 순서인지 — 의존성과 논리적 흐름 설명
- 각 커밋의 SHA(7자)를 \`코드블록\`으로 인용하며 작업 순서 설명

### 핵심 기능
가장 중요한 코드 변경 2-3개를 심층 분석하라.
- 각 변경의 Before/After 상태
- 코드 블록 필수 포함 (최소 10줄, 언어 태그 사용)
- 왜 이 방식을 선택했는지 — 대안과의 비교

${section4Instruction}

### 핵심 교훈
이 작업에서 다른 개발자가 배울 수 있는 점을 작성하라.
- 기술적 인사이트 2-3가지 (구체적 예시 포함)
- 이 방식을 사용할 때 주의할 점
- 같은 문제를 풀어야 할 독자에게 실용적인 조언

## 코드 블록 규칙
- 코드 블록 최소 3개, 각 10줄 이상
- 코드 전에 2-3문장으로 맥락 설명
- 언어 태그 필수 (\`\`\`typescript, \`\`\`tsx, \`\`\`diff 등)
- 수정된 코드는 변경 전/후 모두 표시
- 복잡한 로직에 한국어 인라인 주석 추가`;
}

interface ParsedResult {
  title: string;
  summary: string;
  tags: string[];
  content: string;
}

export async function analyzeCommits(
  commitDiffs: CommitDiff[],
  repoFullName: string,
  tier: SubscriptionTier = "free",
  userContext?: string,
): Promise<GenerateResult> {
  const genAI = getGeminiClient();
  const prompt = buildPrompt(commitDiffs, repoFullName, userContext);

  const schema: Schema = {
    description: "Technical blog post analysis result",
    type: SchemaType.OBJECT,
    properties: {
      title: {
        type: SchemaType.STRING,
        description: "Engaging blog title in Korean",
      },
      summary: {
        type: SchemaType.STRING,
        description: "Short summary in Korean",
      },
      tags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      content: {
        type: SchemaType.STRING,
        description:
          "Detailed blog post content in Markdown, written in Korean",
      },
    },
    required: ["title", "summary", "tags", "content"],
  };

  const generateWithRetry = async (retryCount = 0): Promise<ParsedResult> => {
    try {
      const modelName = TIER_LIMITS[tier].aiModel;
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      let cleanText = text.trim();
      const jsonBlockMatch = cleanText.match(
        /^```(?:json)?\s*\n([\s\S]*?)\n```\s*$/,
      );
      if (jsonBlockMatch) {
        cleanText = jsonBlockMatch[1];
      }
      const start = cleanText.indexOf("{");
      const end = cleanText.lastIndexOf("}");
      if (start !== -1 && end !== -1 && start < end) {
        cleanText = cleanText.substring(start, end + 1);
      }

      const parsed: ParsedResult = JSON.parse(cleanText);
      const content = parsed.content || "";

      // 5섹션 모두 포함 여부 regex 검증 (SECTION_HEADINGS 상수 활용)
      const sectionChecks = SECTION_HEADINGS.map(({ ko, en }) =>
        new RegExp(`###\\s*(${ko}|${en})`, "i").test(content),
      );
      if (!sectionChecks.every(Boolean)) {
        throw new Error(
          "Generated content is missing required sections (Section 1~5).",
        );
      }

      return parsed;
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string };

      const isRateLimit =
        err.status === 429 ||
        err.message?.includes("429") ||
        err.message?.includes("Too Many Requests") ||
        err.message?.includes("Quota exceeded");

      const isMissingSection = err.message?.includes(
        "missing required sections",
      );

      // Daily quota exceeded → 즉시 중단 (재시도 무의미)
      const isDailyQuotaExceeded =
        err.message?.includes("quota") && err.message?.includes("limit");

      if (isDailyQuotaExceeded) {
        throw new Error(
          "Gemini API의 일일 사용량(20회)을 모두 소진했습니다. 내일 다시 시도하거나 API 플랜을 확인해주세요.",
        );
      }

      if (retryCount < 3 && (isRateLimit || isMissingSection)) {
        const delay = Math.pow(2, retryCount) * 2000;
        console.log(
          `Generation error or incomplete output: ${err.message}. Retrying in ${delay}ms... (Attempt ${retryCount + 1}/3)`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        return generateWithRetry(retryCount + 1);
      }

      if (isRateLimit) {
        throw new Error(
          "AI 분석 요청이 너무 많습니다. 잠시 후(약 1분 뒤) 다시 시도해 주세요.",
        );
      }

      throw error;
    }
  };

  const parsed = await generateWithRetry();

  if (!parsed.title && !parsed.content) {
    throw new Error(
      "핵심 콘텐츠(title, content)가 응답에 포함되지 않았습니다.",
    );
  }

  return {
    title: parsed.title || "분석된 제목이 없습니다.",
    content: parsed.content || "분석된 내용이 생성되지 않았습니다.",
    summary: parsed.summary || "요약 정보가 없습니다.",
    tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    commits: commitDiffs.map((cd) => cd.commit.sha),
    repo: repoFullName,
    userContext,
  };
}

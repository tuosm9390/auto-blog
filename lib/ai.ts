import { GoogleGenerativeAI } from "@google/generative-ai";
import { CommitDiff, GenerateResult } from "./types";

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY 환경변수가 설정되지 않았습니다.");
  }
  return new GoogleGenerativeAI(apiKey);
}

function buildPrompt(commitDiffs: CommitDiff[], repoFullName: string): string {
  const commitSummaries = commitDiffs.map((cd) => {
    const filesChanged = cd.files
      .map(
        (f) =>
          `  - ${f.filename} (${f.status}: +${f.additions}/-${f.deletions})`
      )
      .join("\n");

    const patches = cd.files
      .filter((f) => f.patch)
      .map((f) => {
        const truncatedPatch =
          (f.patch?.length || 0) > 1500
            ? f.patch!.substring(0, 1500) + "\n... (truncated)"
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

  return `당신은 숙련된 개발 블로그 작성자입니다. 아래 GitHub 레포지토리의 커밋 변경사항을 분석하여 개발 블로그 포스트를 작성해주세요.

레포지토리: ${repoFullName}

${commitSummaries.join("\n\n---\n\n")}

---

위 커밋 변경사항을 분석하여 다음 형식의 JSON으로 블로그 포스트를 작성해주세요:

{
  "title": "블로그 제목 (매력적이고 구체적인 제목)",
  "summary": "2-3문장의 요약",
  "tags": ["태그1", "태그2", "태그3"],
  "content": "마크다운 형식의 블로그 본문"
}

작성 규칙:
1. 한국어로 작성
2. 개발자가 읽기 편한 톤으로 작성
3. 단순한 변경 나열이 아닌, **왜** 이 변경을 했는지, **어떤 문제**를 해결했는지 분석
4. 기술적 인사이트와 배운 점을 포함
5. 코드 변경의 핵심 부분을 코드 블록으로 인용
6. 제목은 "오늘의 개발일지" 같은 뻔한 제목이 아닌, 구체적인 작업 내용을 반영
7. 마크다운의 제목은 ## (h2)부터 시작 (h1은 블로그 제목에 사용)

JSON만 반환해주세요. 다른 텍스트는 포함하지 마세요.`;
}

export async function analyzeCommits(
  commitDiffs: CommitDiff[],
  repoFullName: string
): Promise<GenerateResult> {
  const genAI = getGeminiClient();
  const prompt = buildPrompt(commitDiffs, repoFullName);

  const generateWithRetry = async (retryCount = 0): Promise<string> => {
    try {
      // Fallback to 1.5-flash if 2.0 is rate limited or consistent errors occur
      // For now, let's try 2.0 and fallback or just retry. 
      // The error message suggests 2.0 quota is hit. Let's switch to 1.5-flash as default for stability if 2.0 is problematic, 
      // or just retry. Given the error "limit: 0", it might be that 2.0 flash free tier is currently exhausted or unavailable for this key.
      // Let's change default to 1.5-flash which is stable.
      const modelName = "gemini-2.5-flash-lite";
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: "application/json" }
      });

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error: any) {
      if (retryCount < 3 && (error.status === 429 || error.message?.includes("429"))) {
        const delay = Math.pow(2, retryCount) * 2000; // 2s, 4s, 8s
        console.log(`API Rate Limited. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return generateWithRetry(retryCount + 1);
      }
      throw error;
    }
  };

  const responseText = await generateWithRetry();

  // JSON 파싱 (코드블록 감싸기 대응)
  // JSON 파싱 (코드블록 제거 불필요, 하지만 안전을 위해 검사)
  let jsonStr = responseText;
  if (jsonStr.startsWith("```json")) {
    jsonStr = jsonStr.replace(/^```json\s*/, "").replace(/```\s*$/, "");
  } else if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```\s*/, "").replace(/```\s*$/, "");
  }

  try {
    const parsed = JSON.parse(jsonStr);
    return {
      title: parsed.title,
      content: parsed.content,
      summary: parsed.summary,
      tags: parsed.tags || [],
      commits: commitDiffs.map((cd) => cd.commit.sha),
      repo: repoFullName,
    };
  } catch {
    throw new Error(
      "AI 응답을 파싱할 수 없습니다. 응답: " + responseText.substring(0, 200)
    );
  }
}

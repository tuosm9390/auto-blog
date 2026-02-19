import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";
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

  return `You are an expert Senior Software Engineer and Tech Writer.
Your task is to write a high-quality technical blog post by deeply analyzing the provided GitHub commit changes.

## Goal
Go beyond a simple summary. You must reverse-engineer the developer's thought process, identifying the *technical challenges*, *root causes*, and *architectural decisions* hidden within the code changes.

## Analysis Framework (Apply these lenses to the changes)

### 1. Identify the Intent
- **Refactoring**: Did the developer apply the **Boy Scout Rule**, **DRY** (Don't Repeat Yourself), or **SRP** (Single Responsibility Principle)? How did readability or maintainability improve?
- **Bug Fix**: What was the likely **root cause**? How was the issue **isolated**? Does the fix handle edge cases?
- **Feature**: What **user problem** does this solve? How does it fit into the existing architecture?

### 2. Code Review Simulation
Imagine you are reviewing this code. Ask yourself:
- "Is this code more readable than before?"
- "Are there any side effects handling added?"
- "Is the error handling robust?"

## Input Data
Repository: ${repoFullName}

${commitSummaries.join("\n\n---\n\n")}

---

## Output Format
Provide the result as a structured JSON object. **The content must be in Korean.**

{
  "title": "A compelling, specific title (e.g., 'How we optimized query performance by 50%' instead of 'Refactoring')",
  "summary": "A concise executive summary (2-3 sentences)",
  "tags": ["Technical Keyword", "Framework", "Pattern"],
  "content": "The main blog post in Markdown format."
}

## Writing Guidelines for 'content'
1. **Hook**: Start with the problem definition. "We often encounter X..."
2. **Context**: Explain *why* this change was necessary.
3. **Deep Dive**: Use the **Analysis Framework** above. Explain the *How* and *Why*.
   - If it's a bug fix, explain the debugging logic (Reproduction -> Isolation -> Fix).
   - If it's refactoring, explain the benefits (e.g., "By extracting this logic to a Hook, we reduced duplication...").
4. **Code Evidence**: **MANDATORY**. Include the key parts of the provided diffs as code blocks to prove your points.
5. **Lessons Learned**: Conclude with a takeaway for other developers.
6. **Tone**: Professional, insightful, yet easy to read (like a high-quality engineering blog).

## Constraints
- **Language**: Korean (한국어)."`;
}

export async function analyzeCommits(
  commitDiffs: CommitDiff[],
  repoFullName: string
): Promise<GenerateResult> {
  const genAI = getGeminiClient();
  const prompt = buildPrompt(commitDiffs, repoFullName);

  const schema: Schema = {
    description: "Technical blog post analysis result",
    type: SchemaType.OBJECT,
    properties: {
      title: { type: SchemaType.STRING, description: "Engaging blog title in Korean" },
      summary: { type: SchemaType.STRING, description: "Short summary in Korean" },
      tags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      content: { type: SchemaType.STRING, description: "Detailed blog post content in Markdown, written in Korean" }
    },
    required: ["title", "summary", "tags", "content"]
  };

  const generateWithRetry = async (retryCount = 0): Promise<string> => {
    try {
      const modelName = "gemini-2.5-flash-lite"; // flash-lite often stable for high throughput
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: schema
        }
      });

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string };
      if (retryCount < 3 && (err.status === 429 || err.message?.includes("429"))) {
        const delay = Math.pow(2, retryCount) * 2000;
        console.log(`API Rate Limited. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return generateWithRetry(retryCount + 1);
      }
      throw error;
    }
  };

  const responseText = await generateWithRetry();

  // JSON 파싱 (마크다운 코드블록 및 불필요한 텍스트 제거)
  let cleanText = responseText.replace(/```json/g, "").replace(/```/g, "");

  const start = cleanText.indexOf("{");
  const end = cleanText.lastIndexOf("}");

  if (start !== -1 && end !== -1 && start < end) {
    cleanText = cleanText.substring(start, end + 1);
  } else if (cleanText.trim().length === 0) {
    console.error("AI Response is empty.");
    throw new Error("AI 응답이 비어있습니다.");
  }

  try {
    const parsed = JSON.parse(cleanText);
    return {
      title: parsed.title,
      content: parsed.content,
      summary: parsed.summary,
      tags: parsed.tags || [],
      commits: commitDiffs.map((cd) => cd.commit.sha),
      repo: repoFullName,
    };
  } catch (error) {
    console.error("JSON Parse Error:", error);
    console.error("Raw AI Response (first 500 chars):", responseText.substring(0, 500));
    console.error("Cleaned Text (first 500 chars):", cleanText.substring(0, 500));
    throw new Error(
      "AI 응답을 파싱할 수 없습니다. (Structured Output 사용됨, 상세 로그 확인 필요)"
    );
  }
}

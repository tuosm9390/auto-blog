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

  return `You are an expert Senior Software Engineer and Tech Writer with 10+ years of experience writing for top engineering blogs (like Netflix Tech Blog, Uber Engineering, and Vercel Blog).
Your task is to write a high-quality, in-depth technical blog post by deeply analyzing the provided GitHub commit changes.

## Goal
Go beyond a simple summary. You must reverse-engineer the developer's thought process, identifying the *technical challenges*, *root causes*, and *architectural decisions* hidden within the code changes. The reader should be able to fully understand WHAT changed, WHY it changed, and HOW it was implemented just by reading your post.

## Step-by-Step Analysis Process (Chain-of-Thought)
Think through the changes in this order before writing:

**Step 1 - Categorize**: What type of change is this? (Feature / Bug Fix / Refactoring / Performance / Security / Infrastructure)
**Step 2 - Context**: What problem existed before? What was the trigger for this work?
**Step 3 - Decompose**: Break down each file change into its functional unit — which module, component, or function was affected? What is its role in the project?
**Step 4 - Analyze**: For each functional unit, what EXACTLY changed and WHY? What was the before state vs. after state?
**Step 5 - Connect**: How do the individual changes connect to form a cohesive solution? What is the overarching architectural decision?
**Step 6 - Evaluate**: What are the trade-offs? What improved? Any potential risks or edge cases?

## Analysis Framework (Apply ALL lenses)

### 1. Intent Identification
- **Refactoring**: Did the developer apply **DRY**, **SRP**, **Boy Scout Rule**? How did readability/maintainability improve?
- **Bug Fix**: What was the **root cause**? How was the issue **isolated**? Does the fix handle edge cases?
- **Feature**: What **user problem** does this solve? How does it fit into the existing architecture?

### 2. Code Review Simulation
Imagine you are reviewing this PR. Ask yourself:
- "Is this code more readable and maintainable than before?"
- "Are there proper error handling and edge case coverage?"
- "What design pattern or architectural decision is reflected here?"
- "Are there potential side effects on other parts of the system?"

### 3. Functional Decomposition (CRITICAL)
For EACH significant code change:
- **File & Module**: Which file was changed and what is its role in the project architecture?
- **Function/Component**: What specific function or component was modified?
- **Responsibility**: What is this code responsible for in the system?
- **Before vs. After**: Describe the concrete behavioral difference
- **Dependencies**: What other modules depend on or are affected by this change?

## Input Data
Repository: ${repoFullName}

${commitSummaries.join("\\n\\n---\\n\\n")}

---

## Output Format
Provide the result as a structured JSON object. **ALL content must be in Korean (한국어).**

{
  "title": "A compelling, specific title that captures the technical essence",
  "summary": "A concise executive summary (2-3 sentences) that answers: What changed? Why? What's the impact?",
  "tags": ["Technical Keyword", "Framework", "Pattern", "Concept"],
  "content": "The main blog post in Markdown format."
}

## Blog Post Structure Template for 'content'
Follow this structure precisely:

### Section 1: 도입 (Hook + Context)
- Start with the problem or motivation: "...하는 상황에서 어떤 문제가 있었는지"
- Explain the previous state and what triggered this work
- Set expectations for what the reader will learn

### Section 2: 변경 사항 분석 (Deep Dive)
For EACH major change area, create a sub-section with:

**2-1. [Module/Component Name] 변경**
- Explain the role of this module in the project
- Describe WHAT was changed and WHY
- Show the code with proper context (see Code Evidence Rules below)

**2-2. [Next Module/Component Name] 변경**
- (Repeat the same pattern for each change area)

### Section 3: 영향 분석 (Impact Analysis)
- How this change affects the overall system
- Performance / UX / Maintainability / Security implications
- Inter-module effects and dependency chain impacts

### Section 4: 핵심 교훈 (Lessons Learned)
- Actionable takeaways for other developers
- Design principles demonstrated by this change
- Common pitfalls and how to avoid them

## Code Evidence Rules (CRITICAL - STRICTLY FOLLOW)
1. **Quantity**: Include AT LEAST 3 code blocks per post. NEVER write a post with fewer than 2 code blocks.
2. **Length**: Each code block MUST be 10-30 lines minimum. NEVER show just 2-3 lines of code in isolation.
3. **Context**: Always include the full function signature, surrounding logic, and enough code for the reader to understand the function's PURPOSE.
4. **Annotation**: Before EVERY code block, write 2-3 sentences explaining:
   - What module this code belongs to
   - What this code is responsible for
   - Why this particular code is important to the change
5. **Before/After**: When code is modified, show the BEFORE and AFTER versions. Use:
   - Separate code blocks labeled "변경 전:" and "변경 후:" OR
   - A single diff block showing the delta
6. **Language Tags**: ALWAYS use proper language tags: \`\`\`typescript, \`\`\`tsx, \`\`\`css, \`\`\`sql, \`\`\`diff etc.
7. **Inline Comments**: Add Korean inline comments to complex code to help the reader understand logic flow.

## Self-Critique Checklist (Verify before finalizing)
Before outputting your response, verify:
- Did I explain the PURPOSE of every code block, not just show it?
- Is every code block long enough (10+ lines) to provide meaningful context?
- Did I cover ALL major file changes, not just the most obvious ones?
- Would a junior developer understand WHY these changes were made?
- Did I include both BEFORE and AFTER states for modifications?
- Is the post thorough enough while remaining engaging to read?

## Example of Good vs. Bad Code Inclusion

❌ BAD (too short, no context):
\`\`\`typescript
const result = await model.generateContent(prompt);
\`\`\`

✅ GOOD (full context, annotated):
\`\`\`typescript
// lib/ai.ts - AI 콘텐츠 생성 모듈의 핵심 함수
// Gemini API를 호출하여 커밋 분석 결과를 생성하는 역할을 담당
export async function analyzeCommits(
  commitDiffs: CommitDiff[],
  repoFullName: string
): Promise<GenerateResult> {
  const genAI = getGeminiClient();
  const prompt = buildPrompt(commitDiffs, repoFullName);

  // Structured Output으로 JSON 형태의 응답을 보장
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema // 스키마 기반 강제 출력 구조
    }
  });

  const result = await model.generateContent(prompt);
  return result.response.text();
}
\`\`\`

## Constraints
- **Language**: ALL text must be in Korean (한국어).
- **Tone**: Professional, insightful, yet approachable — like a senior engineer explaining to a colleague.
- **Depth**: Prioritize depth over breadth. It's better to deeply analyze 3 key changes than superficially mention 10.`;
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

  // JSON 파싱 — Structured Output 사용 시 이미 순수 JSON이지만,
  // 비정상 응답 대비 JSON wrapper만 제거 (content 내부의 ``` 는 보존)
  let cleanText = responseText.trim();

  // JSON이 ```json ... ``` 으로 감싸진 경우에만 외부 wrapper 제거
  const jsonBlockMatch = cleanText.match(/^```(?:json)?\s*\n([\s\S]*?)\n```\s*$/);
  if (jsonBlockMatch) {
    cleanText = jsonBlockMatch[1];
  }

  // JSON 시작/끝 위치 찾기
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

import { GoogleGenAI, Type } from "@google/genai";
import {
  CommitDiff,
  DriftItem,
  EvidenceItem,
  IssueContext,
  PlanProgressItem,
  Project,
  ProjectPlan,
  PullRequestContext,
} from "./types";

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY 환경변수가 설정되지 않았습니다.");
  }
  return new GoogleGenAI({ apiKey });
}

export interface ProjectStateAnalysisResult {
  summary: string;
  progressPercent: number;
  currentPhase: string;
  blockerCount: number;
  riskCount: number;
  driftCount: number;
  watchNext: string[];
  planProgress: PlanProgressItem[];
  drift: DriftItem[];
  evidence: EvidenceItem[];
}

function buildProjectStatePrompt(
  project: Project,
  plan: ProjectPlan | null,
  commitDiffs: CommitDiff[],
  pullRequests: PullRequestContext[],
  issues: IssueContext[]
): string {
  const planBlock = plan?.content_markdown?.trim()
    ? plan.content_markdown
    : "현재 연결된 PRD가 없습니다. 프로젝트 설명과 최근 활동만으로 상태를 추론하세요.";

  const commitBlock =
    commitDiffs.length > 0
      ? commitDiffs
          .map((diff) => {
            const files = diff.files
              .slice(0, 10)
              .map(
                (file) =>
                  `- ${file.filename} (${file.status}, +${file.additions}/-${file.deletions})`
              )
              .join("\n");

            return `## Commit ${diff.commit.sha.slice(0, 7)}
Message: ${diff.commit.message}
Author: ${diff.commit.author}
Date: ${diff.commit.date}
Stats: +${diff.stats.additions} / -${diff.stats.deletions}
Files:
${files || "- no relevant files"}`;
          })
          .join("\n\n")
      : "최근 분석할 GitHub 활동이 없습니다.";

  const prBlock =
    pullRequests.length > 0
      ? pullRequests
          .map((pull) => {
            const trimmedBody = (pull.body || "")
              .replace(/\s+/g, " ")
              .trim()
              .slice(0, 400);

            return `## PR #${pull.number}
Title: ${pull.title}
State: ${pull.state}
Merged: ${pull.merged ? "yes" : "no"}
Author: ${pull.author}
Merged at: ${pull.merged_at || "not merged"}
Body: ${trimmedBody || "no body"}`;
          })
          .join("\n\n")
      : "연결된 Pull Request 맥락이 없습니다.";

  const issueBlock =
    issues.length > 0
      ? issues
          .map((issue) => {
            const trimmedBody = (issue.body || "")
              .replace(/\s+/g, " ")
              .trim()
              .slice(0, 280);

            return `## Issue #${issue.number}
Title: ${issue.title}
State: ${issue.state}
Author: ${issue.author}
Body: ${trimmedBody || "no body"}`;
          })
          .join("\n\n")
      : "연결된 Issue 맥락이 없습니다.";

  return `당신은 AI-native solo builder의 프로젝트 상태를 점검하는 운영 리뷰어입니다.

목표는 "글을 쓰는 것"이 아니라, 프로젝트 상태를 구조화된 JSON으로 보고하는 것입니다.
말투는 간결하고 사실 중심이어야 합니다. 과장 금지. 마케팅 금지.

[PROJECT]
Name: ${project.name}
Description: ${project.description || "없음"}
Original thesis: ${project.original_thesis || "없음"}
Current thesis: ${project.current_thesis || "없음"}
Repo: ${project.github_repo_owner && project.github_repo_name ? `${project.github_repo_owner}/${project.github_repo_name}` : "연결 안 됨"}

[CURRENT PLAN / PRD]
${planBlock}

[RECENT ENGINEERING ACTIVITY]
${commitBlock}

[RECENT PR CONTEXT]
${prBlock}

[RECENT ISSUE CONTEXT]
${issueBlock}

출력 목표:
1. 현재 프로젝트 상태를 2~4문장으로 요약
2. 진행률을 0~100 사이 정수로 추정
3. 현재 단계(currentPhase)를 짧게 이름 붙임
4. blocker, risk, drift 개수를 추정
5. 다음에 봐야 할 것(watchNext) 2~4개 제안
6. planProgress 배열에 PRD 기준 주요 항목 3~6개를 정리
7. drift 배열에 원래 계획 대비 바뀐 결정이 있으면 0~3개 정리

주의:
- 정보가 부족하면 확신하는 척하지 말고 보수적으로 추정
- drift는 단순 구현 세부가 아니라 제품/범위/실행 방향 변화만 잡기
- evidence는 최근 commit 메시지와 PRD 존재 여부를 바탕으로 짧게 연결
- PR title/body와 issue title/body가 있으면 결정의 이유와 범위 판단에 우선 활용
- 모든 텍스트는 영어로 작성

JSON shape:
{
  "summary": string,
  "progressPercent": number,
  "currentPhase": string,
  "blockerCount": number,
  "riskCount": number,
  "driftCount": number,
  "watchNext": string[],
  "planProgress": [
    { "label": string, "status": string, "evidence": string, "notes": string }
  ],
  "drift": [
    {
      "title": string,
      "drift_type": "strategic" | "scope" | "execution",
      "original": string,
      "current": string,
      "why": string,
      "evidence_refs": string[]
    }
  ]
}`;
}

export async function analyzeProjectState(
  project: Project,
  plan: ProjectPlan | null,
  commitDiffs: CommitDiff[],
  pullRequests: PullRequestContext[],
  issues: IssueContext[]
): Promise<ProjectStateAnalysisResult> {
  const ai = getGeminiClient();
  const prompt = buildProjectStatePrompt(project, plan, commitDiffs, pullRequests, issues);

  const schema = {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING },
      progressPercent: { type: Type.INTEGER },
      currentPhase: { type: Type.STRING },
      blockerCount: { type: Type.INTEGER },
      riskCount: { type: Type.INTEGER },
      driftCount: { type: Type.INTEGER },
      watchNext: { type: Type.ARRAY, items: { type: Type.STRING } },
      planProgress: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            label: { type: Type.STRING },
            status: { type: Type.STRING },
            evidence: { type: Type.STRING },
            notes: { type: Type.STRING },
          },
          required: ["label", "status", "evidence", "notes"],
        },
      },
      drift: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            drift_type: { type: Type.STRING },
            original: { type: Type.STRING },
            current: { type: Type.STRING },
            why: { type: Type.STRING },
            evidence_refs: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["title", "drift_type", "original", "current", "why", "evidence_refs"],
        },
      },
    },
    required: [
      "summary",
      "progressPercent",
      "currentPhase",
      "blockerCount",
      "riskCount",
      "driftCount",
      "watchNext",
      "planProgress",
      "drift",
    ],
  };

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });

  const rawText = (response.text ?? "").trim();
  const parsed = JSON.parse(rawText) as ProjectStateAnalysisResult;

  const commitEvidence: EvidenceItem[] = commitDiffs.slice(0, 5).map((diff) => ({
    type: "commit",
    title: diff.commit.message,
    ref: diff.commit.sha.slice(0, 7),
    url: diff.commit.url,
  }));

  const planEvidence: EvidenceItem[] = plan
    ? [
        {
          type: "prd_snippet",
          title: plan.title,
          ref: plan.id,
          url: null,
        },
      ]
    : [];

  const prEvidence: EvidenceItem[] = pullRequests.slice(0, 3).map((pull) => ({
    type: "pull_request",
    title: pull.title,
    ref: `#${pull.number}`,
    url: pull.url,
  }));

  const issueEvidence: EvidenceItem[] = issues.slice(0, 3).map((issue) => ({
    type: "issue",
    title: issue.title,
    ref: `#${issue.number}`,
    url: issue.url,
  }));

  return {
    summary: parsed.summary,
    progressPercent: Math.max(0, Math.min(100, parsed.progressPercent)),
    currentPhase: parsed.currentPhase,
    blockerCount: Math.max(0, parsed.blockerCount),
    riskCount: Math.max(0, parsed.riskCount),
    driftCount: Math.max(parsed.drift.length, parsed.driftCount),
    watchNext: parsed.watchNext.slice(0, 4),
    planProgress: parsed.planProgress.slice(0, 6),
    drift: parsed.drift.slice(0, 3),
    evidence: [...planEvidence, ...issueEvidence, ...prEvidence, ...commitEvidence],
  };
}

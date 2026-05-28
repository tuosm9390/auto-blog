// Evidence 문서별 AI 초안 생성을 위한 프롬프트와 Gemini 호출을 담당한다.
import { GoogleGenAI, Type } from "@google/genai";
import type {
  Project,
  ProjectDocumentSummary,
  ProjectDocumentType,
  ProjectPlan,
  StateSnapshot,
} from "./types";
import type { ProjectDocumentTemplate } from "./project-document-templates";

type ProjectDocumentDraftLocale = "ko" | "en";

export interface GeneratedProjectDocumentDraft {
  title: string;
  contentMarkdown: string;
}

interface GenerateProjectDocumentDraftInput {
  project: Project;
  documentType: ProjectDocumentType;
  template: ProjectDocumentTemplate;
  currentPlan: ProjectPlan | null;
  documents: ProjectDocumentSummary[];
  latestSnapshot: StateSnapshot | null;
  existingContent?: string | null;
  locale: ProjectDocumentDraftLocale;
}

const DOCUMENT_AUTHORING_GUIDANCE: Record<ProjectDocumentType, Record<ProjectDocumentDraftLocale, string[]>> = {
  prd: {
    ko: [
      "프로젝트 설명, original thesis, current thesis를 확인해서 왜 이 프로젝트가 필요한지 작성한다.",
      "현재 계획이나 최신 상태 스냅샷이 있으면 v1 목표와 완료 기준을 구체화한다.",
      "사용자, 핵심 시나리오, In Scope, Out of Scope, Acceptance Criteria를 비워두지 않는다.",
      "불확실한 부분은 꾸며내지 말고 Risks and Open Questions에 명시한다.",
    ],
    en: [
      "Use the project description, original thesis, and current thesis to explain why the project exists.",
      "Use the current plan or latest snapshot to clarify v1 goals and acceptance criteria.",
      "Do not leave target user, core scenario, scope, and acceptance criteria empty.",
      "Put uncertainty in Risks and Open Questions instead of inventing facts.",
    ],
  },
  roadmap: {
    ko: [
      "PRD 목표와 최신 상태 스냅샷의 currentPhase를 확인해서 현재 milestone을 정한다.",
      "완료된 일, 진행 중인 일, 다음에 필요한 일을 milestone으로 나눈다.",
      "지연, 의존성, 변경된 일정은 Changes Since Last Update에 기록한다.",
      "날짜가 없으면 임의 날짜를 만들지 말고 Target Date를 비워두거나 TBD로 둔다.",
    ],
    en: [
      "Use PRD goals and latest snapshot currentPhase to identify the current milestone.",
      "Split completed, active, and next work into milestones.",
      "Record delays, dependencies, and schedule changes in Changes Since Last Update.",
      "Do not invent dates. Leave Target Date blank or use TBD when unknown.",
    ],
  },
  backlog: {
    ko: [
      "PRD Acceptance Criteria, roadmap milestone, latest watchNext를 작업 항목으로 변환한다.",
      "각 작업에 Priority, Status, Owner, Blocker를 채운다.",
      "PRD에 없는 새 작업은 Scope Alignment에 따로 표시한다.",
      "근거가 부족한 작업은 Evidence에 unknown 또는 needs validation으로 둔다.",
    ],
    en: [
      "Turn PRD acceptance criteria, roadmap milestones, and latest watchNext into work items.",
      "Fill Priority, Status, Owner, and Blocker for each work item.",
      "Separate work not found in the PRD under Scope Alignment.",
      "Use unknown or needs validation when evidence is weak.",
    ],
  },
  sprint_plan: {
    ko: [
      "latest watchNext와 backlog의 P0/P1 작업에서 이번 cycle에 할 일을 고른다.",
      "Iteration Window가 없으면 날짜를 지어내지 말고 비워둔다.",
      "Selected Work마다 Done Criteria와 Evidence를 적는다.",
      "반복적으로 넘어온 일이나 막힐 수 있는 일은 Carry-over와 Daily Risks에 적는다.",
    ],
    en: [
      "Select this cycle's work from latest watchNext and P0/P1 backlog items.",
      "Do not invent an iteration window. Leave dates blank if unknown.",
      "Write Done Criteria and Evidence for every selected work item.",
      "Put repeated carry-over and likely blockers in Carry-over and Daily Risks.",
    ],
  },
  decision_log: {
    ko: [
      "PRD, roadmap, latest drift에서 실제로 방향을 바꾼 결정을 찾는다.",
      "결정이 아직 명확하지 않으면 Status를 proposed로 둔다.",
      "대안과 기각 이유를 Options Considered에 명확히 쓴다.",
      "다시 검토해야 할 조건을 Review Trigger에 적는다.",
    ],
    en: [
      "Find decisions that changed direction from the PRD, roadmap, or latest drift.",
      "Use proposed when the decision is not yet settled.",
      "Write alternatives and rejected reasons in Options Considered.",
      "Define conditions that should trigger review.",
    ],
  },
  technical_design: {
    ko: [
      "PRD 목표와 현재 구현 상태를 연결해서 해결할 기술 문제를 정의한다.",
      "데이터 흐름, 인터페이스, 저장 데이터, 외부 호출을 구체화한다.",
      "Error Paths, Security, Test Plan을 반드시 채운다.",
      "구현 정보가 부족하면 가정과 검증 필요 항목으로 표시한다.",
    ],
    en: [
      "Connect PRD goals and implementation state to define the technical problem.",
      "Specify data flow, interfaces, stored data, and external calls.",
      "Always fill Error Paths, Security, and Test Plan.",
      "Mark assumptions and validation needs when implementation detail is missing.",
    ],
  },
  risk_log: {
    ko: [
      "latest snapshot의 blocker, risk, watchNext와 문서의 의존성을 모아 위험 목록을 만든다.",
      "Probability와 Impact를 low, medium, high 중 하나로 분류한다.",
      "blocking dependency와 active issue를 구분한다.",
      "mitigation이 없는 high risk는 Decisions Needed 또는 Next Action으로 연결한다.",
    ],
    en: [
      "Build the risk list from latest blockers, risks, watchNext, and document dependencies.",
      "Classify Probability and Impact as low, medium, or high.",
      "Separate blocking dependencies from active issues.",
      "Connect high risks without mitigation to Decisions Needed or Next Action.",
    ],
  },
  release_ops_learning: {
    ko: [
      "latest snapshot, PRD 목표, 완료된 작업을 기준으로 출시 결과를 정리한다.",
      "아직 출시 전이면 Rollout Plan과 Runbook 중심의 draft로 작성한다.",
      "Planned 여부와 사용자 영향을 Shipped Items에 적는다.",
      "운영 리스크, rollback 조건, postmortem action item을 비워두지 않는다.",
    ],
    en: [
      "Summarize release outcome from latest snapshot, PRD goals, and completed work.",
      "If not shipped yet, write a draft focused on Rollout Plan and Runbook.",
      "Record planned status and user impact in Shipped Items.",
      "Do not leave operational risks, rollback conditions, or postmortem action items empty.",
    ],
  },
};

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY 환경변수가 설정되지 않았습니다.");
  }
  return new GoogleGenAI({ apiKey });
}

function getProjectMemoryModelName() {
  return process.env.GEMINI_PROJECT_MEMORY_MODEL || "gemini-2.5-flash";
}

function normalizeLocale(locale: string | undefined): ProjectDocumentDraftLocale {
  return locale === "ko" ? "ko" : "en";
}

function compactMarkdown(markdown: string | null | undefined, maxLength = 3000) {
  const normalized = (markdown ?? "").trim();
  if (!normalized) {
    return "없음";
  }
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}\n...` : normalized;
}

function summarizeSnapshot(snapshot: StateSnapshot | null, locale: ProjectDocumentDraftLocale) {
  if (!snapshot) {
    return locale === "ko" ? "최신 상태 스냅샷 없음" : "No latest state snapshot";
  }

  return JSON.stringify(
    {
      summary: snapshot.summary,
      progressPercent: snapshot.progress_percent,
      currentPhase: snapshot.current_phase,
      blockerCount: snapshot.blocker_count,
      riskCount: snapshot.risk_count,
      driftCount: snapshot.drift_count,
      watchNext: snapshot.watch_next,
      planProgress: snapshot.plan_progress_json,
      drift: snapshot.drift_json,
      evidence: snapshot.evidence_json,
      generatedAt: snapshot.generated_at,
    },
    null,
    2
  );
}

function summarizeDocuments(documents: ProjectDocumentSummary[], documentType: ProjectDocumentType) {
  const related = documents.filter((document) => document.documentType !== documentType).slice(0, 7);
  if (related.length === 0) {
    return "없음";
  }

  return related
    .map(
      (document) => `## ${document.title}
Type: ${document.documentType}
Readiness: ${document.readiness}
Applied: ${document.isApplied ? "yes" : "no"}
Updated at: ${document.updatedAt || "unknown"}
Preview: ${document.contentPreview || "no content"}`
    )
    .join("\n\n");
}

export function buildProjectDocumentDraftPrompt(input: GenerateProjectDocumentDraftInput): string {
  const locale = normalizeLocale(input.locale);
  const languageInstruction =
    locale === "ko"
      ? "출력은 자연스러운 한국어로 작성한다. 단, 문서 제목과 표 헤더는 템플릿의 영어 표현을 유지해도 된다."
      : "Write the output in natural English.";
  const authoringGuidance = DOCUMENT_AUTHORING_GUIDANCE[input.documentType][locale]
    .map((item) => `- ${item}`)
    .join("\n");

  return `당신은 AI-native 프로젝트의 Evidence 문서를 작성하는 프로젝트 분석 에이전트입니다.

목표는 사용자가 직접 빈칸을 채우지 않아도 분석에 적용 가능한 Markdown 문서 초안을 만드는 것입니다.
${languageInstruction}

규칙:
- 아래 Template Structure의 섹션과 순서를 유지한다.
- 알 수 없는 사실은 지어내지 말고 TBD, unknown, needs validation으로 표시한다.
- Evidence, Agent Reading Notes, Agent Collaboration Prompt 섹션을 유지한다.
- 기존 문서 내용이 있으면 유용한 내용은 보존하고 빈칸과 약한 부분을 보강한다.
- 최종 응답은 JSON으로만 반환한다.

[DOCUMENT TYPE]
${input.documentType}

[WHAT TO CHECK BEFORE WRITING]
${authoringGuidance}

[PROJECT]
Name: ${input.project.name}
Description: ${input.project.description || "없음"}
Original thesis: ${input.project.original_thesis || "없음"}
Current thesis: ${input.project.current_thesis || "없음"}
Status: ${input.project.status}
Repo: ${
    input.project.github_repo_owner && input.project.github_repo_name
      ? `${input.project.github_repo_owner}/${input.project.github_repo_name}`
      : "연결 안 됨"
  }

[CURRENT PLAN / PRD]
Title: ${input.currentPlan?.title || "없음"}
${compactMarkdown(input.currentPlan?.content_markdown)}

[RELATED EVIDENCE DOCUMENTS]
${summarizeDocuments(input.documents, input.documentType)}

[LATEST STATE SNAPSHOT]
${summarizeSnapshot(input.latestSnapshot, locale)}

[EXISTING DOCUMENT CONTENT]
${compactMarkdown(input.existingContent)}

[TEMPLATE STRUCTURE]
Title: ${input.template.title}
${input.template.contentMarkdown}

JSON shape:
{
  "title": string,
  "contentMarkdown": string
}`;
}

export async function generateProjectDocumentDraft(
  input: GenerateProjectDocumentDraftInput
): Promise<GeneratedProjectDocumentDraft> {
  const ai = getGeminiClient();
  const prompt = buildProjectDocumentDraftPrompt(input);

  const response = await ai.models.generateContent({
    model: getProjectMemoryModelName(),
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          contentMarkdown: { type: Type.STRING },
        },
        required: ["title", "contentMarkdown"],
      },
    },
  });

  const parsed = JSON.parse((response.text ?? "").trim()) as GeneratedProjectDocumentDraft;
  return {
    title: parsed.title.trim() || input.template.title,
    contentMarkdown: parsed.contentMarkdown.trim() || input.template.contentMarkdown,
  };
}

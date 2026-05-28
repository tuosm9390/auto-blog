// 프로젝트 Evidence 문서 유형과 기본 템플릿을 정의한다.
import type {
  ProjectDocumentReadiness,
  ProjectDocumentSummary,
  ProjectDocumentType,
  StoredProjectDocumentType,
} from "./types";

export type ProjectDocumentLocale = "ko" | "en";

export interface ProjectDocumentTypeMeta {
  type: ProjectDocumentType;
  label: string;
  description: string;
  signals: string[];
  requiredKeywords: string[];
  stored: boolean;
}

export interface ProjectDocumentTemplate {
  title: string;
  contentMarkdown: string;
}

export const PROJECT_DOCUMENT_TYPES: ProjectDocumentType[] = [
  "prd",
  "roadmap",
  "backlog",
  "sprint_plan",
  "decision_log",
  "technical_design",
  "risk_log",
  "release_ops_learning",
];

export const STORED_PROJECT_DOCUMENT_TYPES: StoredProjectDocumentType[] = [
  "roadmap",
  "backlog",
  "sprint_plan",
  "decision_log",
  "technical_design",
  "risk_log",
  "release_ops_learning",
];

const META: Record<ProjectDocumentType, Omit<ProjectDocumentTypeMeta, "type">> = {
  prd: {
    label: "PRD / Requirements",
    description: "Defines the product goal, scope, scenarios, and acceptance criteria.",
    signals: ["progress", "scope", "acceptance"],
    requiredKeywords: ["goal", "objective", "scope", "acceptance", "완료", "목표", "범위"],
    stored: false,
  },
  roadmap: {
    label: "Roadmap",
    description: "Maps phases, milestones, and upcoming work.",
    signals: ["progress", "watchNext", "drift"],
    requiredKeywords: ["milestone", "phase", "timeline", "단계", "마일스톤", "일정"],
    stored: true,
  },
  backlog: {
    label: "Backlog",
    description: "Tracks prioritized execution units and open work.",
    signals: ["progress", "blocker", "watchNext"],
    requiredKeywords: ["priority", "status", "owner", "우선순위", "상태", "작업"],
    stored: true,
  },
  sprint_plan: {
    label: "Sprint Plan",
    description: "Captures the short-term execution plan.",
    signals: ["progress", "blocker"],
    requiredKeywords: ["sprint", "commitment", "capacity", "이번", "스프린트", "완료"],
    stored: true,
  },
  decision_log: {
    label: "Decision Log / ADR",
    description: "Records accepted decisions and why direction changed.",
    signals: ["drift", "risk"],
    requiredKeywords: ["decision", "context", "consequence", "결정", "맥락", "영향"],
    stored: true,
  },
  technical_design: {
    label: "Technical Design / RFC",
    description: "Explains architecture, tradeoffs, and implementation shape.",
    signals: ["risk", "blocker", "drift"],
    requiredKeywords: ["architecture", "tradeoff", "interface", "구조", "트레이드오프", "API"],
    stored: true,
  },
  risk_log: {
    label: "Risk / Issue / Dependency Log",
    description: "Tracks risks, blockers, mitigations, and dependencies.",
    signals: ["risk", "blocker"],
    requiredKeywords: ["risk", "blocker", "mitigation", "리스크", "막힘", "대응"],
    stored: true,
  },
  release_ops_learning: {
    label: "Release / Ops Learning",
    description: "Captures release outcomes, incidents, and operational learning.",
    signals: ["progress", "risk", "watchNext"],
    requiredKeywords: ["release", "result", "learning", "출시", "결과", "학습"],
    stored: true,
  },
};

const TEMPLATES: Record<ProjectDocumentLocale, Record<ProjectDocumentType, ProjectDocumentTemplate>> = {
  ko: {
    prd: {
      title: "PRD / Requirements",
      contentMarkdown: `# PRD / Requirements

## Metadata
- Title:
- Type: PRD
- Status: draft
- Owner:
- Date:
- Source: manual
- Related Links:

## 1. Background
- 이 프로젝트가 필요한 이유.
- 지금 사용자가 겪는 구체적인 문제.
- 이 문제를 지금 해결해야 하는 이유.

## 2. Goal
- v1에서 달성할 핵심 목표.
- 성공하면 사용자가 느끼는 변화.
- 제품 또는 비즈니스 관점에서 기대하는 효과.

## 3. Target User
- 주요 사용자.
- 사용자가 이 기능을 쓰는 상황.
- 사용자가 현재 쓰는 대안 또는 임시 해결책.

## 4. Core Scenario
1. 사용자는 어디에서 시작하는가.
2. 어떤 입력이나 선택을 하는가.
3. 시스템은 무엇을 저장하거나 보여주는가.
4. 사용자는 마지막에 무엇을 확인해야 하는가.

## 5. Scope
### In Scope
- 이번 버전에 반드시 포함할 기능.

### Out of Scope
- 이번 버전에서 하지 않을 일.
- 의도적으로 미루는 일과 이유.

## 6. Acceptance Criteria
- [ ] 사용자가 반드시 성공해야 하는 행동.
- [ ] 시스템이 저장하거나 보여줘야 하는 결과.
- [ ] 새로고침 후 Synapso 상태판에서 확인되어야 하는 변화.
- [ ] 실패 시 사용자가 이해할 수 있는 메시지.

## 7. Risks and Open Questions
- 아직 결정하지 못한 부분.
- 기술적으로 불확실한 부분.
- 사용자 검증이 필요한 가정.

## 8. Evidence
- Related issues:
- Related PRs:
- Related commits:
- Related snapshots:

## 9. Agent Reading Notes
- Goal과 Acceptance Criteria를 우선 추출한다.
- In Scope와 Out of Scope를 drift 판단 기준으로 사용한다.
- Acceptance Criteria가 비어 있으면 progress 신뢰도를 낮춘다.

## Agent Collaboration Prompt
이 PRD를 프로젝트 상태 판단 근거로 사용해서 현재 프로젝트를 분석해줘.
- Goal, Scope, Acceptance Criteria가 실제 진행 상황과 맞는지 비교해줘.
- 누락된 요구사항, 범위 이탈, 완료 기준의 모호함을 찾아줘.
- 결론은 progress, blocker, risk, drift, watchNext, evidence로 정리해줘.`,
    },
    roadmap: {
      title: "Roadmap / Milestone Plan",
      contentMarkdown: `# Roadmap / Milestone Plan

## Metadata
- Title:
- Type: roadmap
- Status: active
- Owner:
- Date:
- Source: manual
- Related Links:

## 1. Roadmap Summary
- 이 roadmap이 커버하는 기간.
- 가장 중요한 목표.
- 현재 단계.

## 2. Milestones
| Milestone | Target Date | Status | Success Criteria | Evidence |
|-----------|-------------|--------|------------------|----------|
| M1 | | planned | | |
| M2 | | planned | | |
| M3 | | planned | | |

## 3. Current Milestone
- 지금 집중하는 milestone.
- 이번 milestone이 끝났다고 판단할 기준.
- 아직 남은 작업.

## 4. Dependencies
- 선행되어야 하는 내부 작업.
- 외부 API, 승인, 데이터, 고객 피드백 같은 외부 의존성.
- 막히면 사용할 fallback.

## 5. Changes Since Last Update
- 새로 추가된 milestone.
- 밀린 milestone.
- 제거된 milestone.
- 변경 이유.

## 6. Evidence
- Related issues:
- Related PRs:
- Related releases:
- Related snapshots:

## 7. Agent Reading Notes
- Current Milestone을 currentPhase 후보로 사용한다.
- Target Date가 지났고 Status가 done이 아니면 risk 또는 blocker 후보로 본다.
- Changes Since Last Update는 drift 후보로 본다.

## Agent Collaboration Prompt
이 roadmap을 기준으로 프로젝트의 현재 단계와 다음 우선순위를 분석해줘.
- Current Milestone이 실제 작업과 맞는지 확인해줘.
- 지연된 milestone, 의존성, 일정 변경이 risk나 blocker인지 판단해줘.
- 결론은 currentPhase, progress, blocker, risk, drift, watchNext로 정리해줘.`,
    },
    backlog: {
      title: "Backlog / Issue / Task",
      contentMarkdown: `# Backlog / Issue / Task

## Metadata
- Title:
- Type: backlog
- Status: active
- Owner:
- Date:
- Source: GitHub/manual
- Related Links:

## 1. Backlog Summary
- 이 backlog가 커버하는 기능 또는 milestone.
- 현재 가장 중요한 작업.
- 전체 상태 요약.

## 2. Work Items
| ID | Task | Priority | Status | Owner | Blocker | Evidence |
|----|------|----------|--------|-------|---------|----------|
| | | P0/P1/P2 | not_started/in_progress/done/blocked/changed | | | |

## 3. Blocked Items
- 막힌 작업:
- 막힌 이유:
- 풀기 위해 필요한 결정 또는 작업:

## 4. Scope Alignment
- PRD에 명시된 작업:
- PRD에는 없지만 새로 생긴 작업:
- 제거되거나 더 이상 필요 없는 작업:

## 5. Evidence
- Related issues:
- Related PRs:
- Related commits:
- Related snapshots:

## 6. Agent Reading Notes
- Status와 Priority를 progress와 watchNext 계산에 사용한다.
- Blocker가 있으면 blockerCount 후보로 본다.
- PRD에 없는 새 작업은 scope drift 후보로 본다.

## Agent Collaboration Prompt
이 backlog를 기준으로 프로젝트 실행 상태를 분석해줘.
- P0/P1 작업의 진행률과 막힌 작업을 먼저 판단해줘.
- PRD나 roadmap에 없는 작업이 새로 생겼는지 찾아줘.
- 다음에 처리해야 할 작업을 watchNext로 정리하고 evidence를 함께 제시해줘.`,
    },
    sprint_plan: {
      title: "Sprint / Iteration Plan",
      contentMarkdown: `# Sprint / Iteration Plan

## Metadata
- Title:
- Type: sprint-plan
- Status: active
- Owner:
- Date:
- Source: manual
- Related Links:

## 1. Iteration Window
- Start Date:
- End Date:
- Owner:
- Sprint Goal:

## 2. Selected Work
| Task | Source | Status | Done Criteria | Evidence |
|------|--------|--------|---------------|----------|
| | issue/PR/manual | planned/in_progress/done/blocked/carried_over | | |

## 3. Sprint Goal Alignment
- 연결된 PRD 목표:
- 연결된 roadmap milestone:
- 이번 cycle에서 하지 않을 일:

## 4. Daily Risks
- 오늘 또는 이번 주 안에 막힐 수 있는 일.
- 도움이 필요한 결정.
- 외부 의존성.

## 5. Carry-over
- 이전 cycle에서 넘어온 일.
- 넘어온 이유.
- 이번에도 못 끝나면 생기는 영향.

## 6. Evidence
- Related issues:
- Related PRs:
- Related commits:
- Related snapshots:

## 7. Agent Reading Notes
- Iteration Window와 Selected Work를 현재 실행 상태 판단에 사용한다.
- carried_over가 반복되면 execution drift 또는 risk 후보로 본다.
- Sprint Goal이 PRD 목표와 다르면 drift 후보로 본다.

## Agent Collaboration Prompt
이 sprint plan을 기준으로 이번 cycle의 실행 가능성을 분석해줘.
- Sprint Goal과 Selected Work가 PRD, roadmap과 정렬되어 있는지 확인해줘.
- blocked, carried_over, daily risk 항목을 실제 blocker와 risk로 분류해줘.
- 이번 cycle에서 완료 가능성이 높은 일과 조정해야 할 일을 구분해줘.`,
    },
    decision_log: {
      title: "Decision Log / ADR",
      contentMarkdown: `# Decision Log / ADR

## Metadata
- Title:
- Type: decision
- Status: proposed/accepted/superseded/rejected
- Owner:
- Date:
- Source: manual
- Related Links:

## 1. Decision
- 결정한 내용.
- 결정 상태.
- 결정이 필요한 이유.

## 2. Context
- 이 결정을 하게 된 배경.
- 연결된 PRD 목표 또는 roadmap milestone.
- 제약 조건.

## 3. Options Considered
| Option | Pros | Cons | Rejected Reason |
|--------|------|------|-----------------|
| A | | | |
| B | | | |

## 4. Selected Option
- 선택한 옵션.
- 선택 이유.
- 기대 효과.

## 5. Consequences
- 좋아지는 점.
- 나빠지는 점 또는 비용.
- 되돌릴 때 필요한 작업.

## 6. Review Trigger
- 이 결정을 다시 봐야 하는 조건.
- 이 결정이 틀렸다는 신호.

## 7. Evidence
- Related issues:
- Related PRs:
- Related commits:
- Related snapshots:

## 8. Agent Reading Notes
- accepted 결정은 현재 기준선으로 사용한다.
- superseded 결정은 drift 근거로 사용한다.
- proposed 결정이 오래 열려 있으면 blocker 후보로 본다.

## Agent Collaboration Prompt
이 decision log를 기준으로 프로젝트 방향과 결정 리스크를 분석해줘.
- accepted 결정이 현재 구현과 문서에 일관되게 반영됐는지 확인해줘.
- proposed 또는 superseded 결정이 blocker, drift, risk를 만들고 있는지 판단해줘.
- 다시 검토해야 할 결정과 그 이유를 watchNext로 정리해줘.`,
    },
    technical_design: {
      title: "Technical Design / RFC",
      contentMarkdown: `# Technical Design / RFC

## Metadata
- Title:
- Type: technical-design
- Status: draft/reviewed/accepted/superseded
- Owner:
- Date:
- Source: manual
- Related Links:

## 1. Problem
- 어떤 기술 문제를 해결하는가.
- 이 설계가 필요한 제품 목표.

## 2. Proposed Design
- 핵심 접근.
- 새로 생기는 컴포넌트.
- 기존 컴포넌트와의 관계.

## 3. Data Flow
- Input -> Validation -> Transform -> Persist -> Output

## 4. Interfaces
- New API:
- Changed API:
- Stored Data:
- External Service Calls:

## 5. Error Paths
| Failure | Expected Handling | User Sees | Logged |
|---------|-------------------|-----------|--------|
| | | | |

## 6. Security
- 누가 호출할 수 있는가.
- 어떤 데이터에 접근하는가.
- IDOR, RLS, secret 관련 위험.

## 7. Test Plan
- Unit:
- Integration:
- E2E:
- Failure cases:

## 8. Rollout and Rollback
- 배포 순서.
- feature flag 필요 여부.
- rollback 방법.

## 9. Evidence
- Related issues:
- Related PRs:
- Related commits:
- Related migrations:

## 10. Agent Reading Notes
- Error Paths와 Test Plan이 비어 있으면 risk 후보로 본다.
- Proposed Design과 실제 PR diff가 다르면 technical drift 후보로 본다.
- Security가 비어 있으면 high-risk 신호로 본다.

## Agent Collaboration Prompt
이 technical design을 기준으로 구현 리스크와 설계 일치성을 분석해줘.
- Proposed Design, Interfaces, Data Flow가 실제 구현 방향과 맞는지 비교해줘.
- Error Paths, Security, Test Plan의 빈칸이나 약한 부분을 risk로 분류해줘.
- 구현 전에 결정해야 할 기술적 blocker와 검증해야 할 항목을 정리해줘.`,
    },
    risk_log: {
      title: "Risk / Issue / Dependency Log",
      contentMarkdown: `# Risk / Issue / Dependency Log

## Metadata
- Title:
- Type: risk-log
- Status: active
- Owner:
- Date:
- Source: manual/GitHub
- Related Links:

## 1. Summary
- 현재 가장 큰 위험.
- 현재 실제로 막힌 일.
- 외부 의존성 중 가장 중요한 것.

## 2. Risks
| Risk | Probability | Impact | Mitigation | Owner | Status | Evidence |
|------|-------------|--------|------------|-------|--------|----------|
| | low/medium/high | low/medium/high | | | open/mitigated/accepted | |

## 3. Active Issues
| Issue | Impact | Started At | Next Action | Owner | Status | Evidence |
|-------|--------|------------|-------------|-------|--------|----------|
| | | | | | open/resolved | |

## 4. Dependencies
| Dependency | Type | Needed By | Blocking? | Fallback | Owner | Evidence |
|------------|------|-----------|-----------|----------|-------|----------|
| | internal/external | | yes/no | | | |

## 5. Decisions Needed
- 결정해야 풀리는 일.
- 결정권자.
- 결정 기한.

## 6. Evidence
- Related issues:
- Related PRs:
- Related external links:
- Related snapshots:

## 7. Agent Reading Notes
- Blocking이 yes인 dependency는 blocker 후보로 본다.
- Probability와 Impact가 high인 risk는 riskCount에 강하게 반영한다.
- Mitigation 없는 high risk는 watchNext 후보로 본다.

## Agent Collaboration Prompt
이 risk log를 기준으로 프로젝트의 위험, 이슈, 의존성을 분석해줘.
- high probability 또는 high impact 항목을 우선순위화해줘.
- blocking dependency와 active issue가 현재 진행을 막는지 판단해줘.
- mitigation이 부족한 항목과 결정이 필요한 항목을 watchNext로 정리해줘.`,
    },
    release_ops_learning: {
      title: "Release / Changelog / Runbook / Postmortem",
      contentMarkdown: `# Release / Changelog / Runbook / Postmortem

## Metadata
- Title:
- Type: release-ops
- Status: draft/shipped/incident-review/closed
- Owner:
- Date:
- Source: manual/GitHub
- Related Links:

## 1. Release Summary
- 배포한 버전 또는 날짜.
- 사용자에게 바뀐 점.
- 연결된 PRD 목표 또는 milestone.

## 2. Shipped Items
| Item | Planned? | User Impact | Evidence |
|------|----------|-------------|----------|
| | yes/no | | |

## 3. Rollout Plan
- 배포 순서.
- smoke test.
- rollback 조건.
- rollback 방법.

## 4. Changelog
- 사용자에게 알려야 할 변경.
- 내부적으로만 기록할 변경.
- known issue.

## 5. Runbook
- 문제가 생겼을 때 확인할 지표나 로그.
- 복구 절차.
- escalation 대상.

## 6. Incident or Postmortem
- 발생한 문제.
- 영향.
- 원인.
- 대응.
- 재발 방지 action item.

## 7. Evidence
- Release:
- Related PRs:
- Related commits:
- Related incidents:
- Related snapshots:

## 8. Agent Reading Notes
- Planned가 no인 shipped item은 scope drift 후보로 본다.
- rollback 조건이나 runbook이 비어 있으면 operational risk 후보로 본다.
- postmortem action item은 watchNext 후보로 본다.

## Agent Collaboration Prompt
이 release/ops 문서를 기준으로 배포 결과와 운영 리스크를 분석해줘.
- shipped item이 계획된 범위와 일치하는지 확인해줘.
- rollout, rollback, runbook의 공백이 operational risk인지 판단해줘.
- postmortem action item과 다음 릴리스에 반영할 일을 watchNext로 정리해줘.`,
    },
  },
  en: {
    prd: {
      title: "PRD / Requirements",
      contentMarkdown: `# PRD / Requirements

## Metadata
- Title:
- Type: PRD
- Status: draft
- Owner:
- Date:
- Source: manual
- Related Links:

## 1. Background
- Why this project is needed.
- The concrete user problem.
- Why this problem should be solved now.

## 2. Goal
- The core v1 outcome.
- The change users should feel when this succeeds.
- Expected product or business effect.

## 3. Target User
- Primary user.
- Situation where the user uses this feature.
- Current alternative or workaround.

## 4. Core Scenario
1. Where the user starts.
2. What input or choice the user makes.
3. What the system stores or shows.
4. What the user must confirm at the end.

## 5. Scope
### In Scope
- Features that must be included in this version.

### Out of Scope
- Work intentionally excluded from this version.
- Deferred work and the reason.

## 6. Acceptance Criteria
- [ ] User action that must succeed.
- [ ] Result the system must store or show.
- [ ] Change visible in the Synapso state board after refresh.
- [ ] Understandable failure message.

## 7. Risks and Open Questions
- Undecided areas.
- Technical uncertainty.
- Assumptions that need user validation.

## 8. Evidence
- Related issues:
- Related PRs:
- Related commits:
- Related snapshots:

## 9. Agent Reading Notes
- Extract Goal and Acceptance Criteria first.
- Use In Scope and Out of Scope as drift criteria.
- Lower progress confidence when Acceptance Criteria is empty.

## Agent Collaboration Prompt
Use this PRD as project-state evidence and analyze the current project.
- Compare Goal, Scope, and Acceptance Criteria against actual progress.
- Find missing requirements, scope drift, and ambiguous completion criteria.
- Summarize the conclusion as progress, blocker, risk, drift, watchNext, and evidence.`,
    },
    roadmap: {
      title: "Roadmap / Milestone Plan",
      contentMarkdown: `# Roadmap / Milestone Plan

## Metadata
- Title:
- Type: roadmap
- Status: active
- Owner:
- Date:
- Source: manual
- Related Links:

## 1. Roadmap Summary
- The period this roadmap covers.
- The most important goal.
- Current phase.

## 2. Milestones
| Milestone | Target Date | Status | Success Criteria | Evidence |
|-----------|-------------|--------|------------------|----------|
| M1 | | planned | | |
| M2 | | planned | | |
| M3 | | planned | | |

## 3. Current Milestone
- The milestone currently in focus.
- Criteria for calling this milestone complete.
- Remaining work.

## 4. Dependencies
- Internal work that must happen first.
- External dependencies such as API, approval, data, or customer feedback.
- Fallback if blocked.

## 5. Changes Since Last Update
- Newly added milestone.
- Delayed milestone.
- Removed milestone.
- Reason for the change.

## 6. Evidence
- Related issues:
- Related PRs:
- Related releases:
- Related snapshots:

## 7. Agent Reading Notes
- Use Current Milestone as a currentPhase candidate.
- Treat overdue target dates without done status as risk or blocker candidates.
- Treat Changes Since Last Update as drift candidates.

## Agent Collaboration Prompt
Use this roadmap to analyze the current phase and next priorities.
- Check whether Current Milestone matches the actual work.
- Decide whether delayed milestones, dependencies, or schedule changes are risks or blockers.
- Summarize the conclusion as currentPhase, progress, blocker, risk, drift, and watchNext.`,
    },
    backlog: {
      title: "Backlog / Issue / Task",
      contentMarkdown: `# Backlog / Issue / Task

## Metadata
- Title:
- Type: backlog
- Status: active
- Owner:
- Date:
- Source: GitHub/manual
- Related Links:

## 1. Backlog Summary
- Feature or milestone covered by this backlog.
- Current most important work.
- Overall status summary.

## 2. Work Items
| ID | Task | Priority | Status | Owner | Blocker | Evidence |
|----|------|----------|--------|-------|---------|----------|
| | | P0/P1/P2 | not_started/in_progress/done/blocked/changed | | | |

## 3. Blocked Items
- Blocked work:
- Reason blocked:
- Decision or work needed to unblock:

## 4. Scope Alignment
- Work explicitly listed in the PRD:
- New work not listed in the PRD:
- Removed or no longer needed work:

## 5. Evidence
- Related issues:
- Related PRs:
- Related commits:
- Related snapshots:

## 6. Agent Reading Notes
- Use Status and Priority for progress and watchNext.
- Treat Blocker as a blockerCount candidate.
- Treat new work outside the PRD as a scope drift candidate.

## Agent Collaboration Prompt
Use this backlog to analyze execution state.
- Start with progress on P0/P1 work and currently blocked items.
- Find work that is not supported by the PRD or roadmap.
- Summarize the next work as watchNext and include evidence for each conclusion.`,
    },
    sprint_plan: {
      title: "Sprint / Iteration Plan",
      contentMarkdown: `# Sprint / Iteration Plan

## Metadata
- Title:
- Type: sprint-plan
- Status: active
- Owner:
- Date:
- Source: manual
- Related Links:

## 1. Iteration Window
- Start Date:
- End Date:
- Owner:
- Sprint Goal:

## 2. Selected Work
| Task | Source | Status | Done Criteria | Evidence |
|------|--------|--------|---------------|----------|
| | issue/PR/manual | planned/in_progress/done/blocked/carried_over | | |

## 3. Sprint Goal Alignment
- Connected PRD goal:
- Connected roadmap milestone:
- Work intentionally excluded from this cycle:

## 4. Daily Risks
- Work that may block today or this week.
- Decisions needed.
- External dependencies.

## 5. Carry-over
- Work carried over from the previous cycle.
- Reason it carried over.
- Impact if it misses again.

## 6. Evidence
- Related issues:
- Related PRs:
- Related commits:
- Related snapshots:

## 7. Agent Reading Notes
- Use Iteration Window and Selected Work for current execution state.
- Repeated carried_over items are execution drift or risk candidates.
- Treat Sprint Goal mismatch with PRD goals as drift.

## Agent Collaboration Prompt
Use this sprint plan to analyze whether the current cycle is executable.
- Check whether Sprint Goal and Selected Work align with the PRD and roadmap.
- Classify blocked, carried_over, and daily risk items as blockers or risks.
- Separate work likely to finish this cycle from work that needs adjustment.`,
    },
    decision_log: {
      title: "Decision Log / ADR",
      contentMarkdown: `# Decision Log / ADR

## Metadata
- Title:
- Type: decision
- Status: proposed/accepted/superseded/rejected
- Owner:
- Date:
- Source: manual
- Related Links:

## 1. Decision
- What was decided.
- Decision status.
- Why this decision is needed.

## 2. Context
- Background for this decision.
- Connected PRD goal or roadmap milestone.
- Constraints.

## 3. Options Considered
| Option | Pros | Cons | Rejected Reason |
|--------|------|------|-----------------|
| A | | | |
| B | | | |

## 4. Selected Option
- Selected option.
- Why it was selected.
- Expected effect.

## 5. Consequences
- Benefits.
- Downsides or cost.
- Work needed to reverse this decision.

## 6. Review Trigger
- Conditions that should reopen this decision.
- Signals that this decision was wrong.

## 7. Evidence
- Related issues:
- Related PRs:
- Related commits:
- Related snapshots:

## 8. Agent Reading Notes
- Use accepted decisions as the current baseline.
- Use superseded decisions as drift evidence.
- Treat long-open proposed decisions as blocker candidates.

## Agent Collaboration Prompt
Use this decision log to analyze project direction and decision risk.
- Check whether accepted decisions are reflected consistently in implementation and documents.
- Decide whether proposed or superseded decisions create blockers, drift, or risk.
- List decisions that should be reviewed again and explain why in watchNext.`,
    },
    technical_design: {
      title: "Technical Design / RFC",
      contentMarkdown: `# Technical Design / RFC

## Metadata
- Title:
- Type: technical-design
- Status: draft/reviewed/accepted/superseded
- Owner:
- Date:
- Source: manual
- Related Links:

## 1. Problem
- Technical problem being solved.
- Product goal that needs this design.

## 2. Proposed Design
- Core approach.
- New components.
- Relationship to existing components.

## 3. Data Flow
- Input -> Validation -> Transform -> Persist -> Output

## 4. Interfaces
- New API:
- Changed API:
- Stored Data:
- External Service Calls:

## 5. Error Paths
| Failure | Expected Handling | User Sees | Logged |
|---------|-------------------|-----------|--------|
| | | | |

## 6. Security
- Who can call this.
- Which data it can access.
- IDOR, RLS, and secret risks.

## 7. Test Plan
- Unit:
- Integration:
- E2E:
- Failure cases:

## 8. Rollout and Rollback
- Deployment order.
- Whether a feature flag is needed.
- Rollback method.

## 9. Evidence
- Related issues:
- Related PRs:
- Related commits:
- Related migrations:

## 10. Agent Reading Notes
- Treat empty Error Paths or Test Plan as risk candidates.
- Treat mismatch between Proposed Design and PR diff as technical drift.
- Treat empty Security as a high-risk signal.

## Agent Collaboration Prompt
Use this technical design to analyze implementation risk and design alignment.
- Compare Proposed Design, Interfaces, and Data Flow with the actual implementation direction.
- Classify gaps in Error Paths, Security, and Test Plan as risks.
- Summarize technical blockers and validation items needed before implementation.`,
    },
    risk_log: {
      title: "Risk / Issue / Dependency Log",
      contentMarkdown: `# Risk / Issue / Dependency Log

## Metadata
- Title:
- Type: risk-log
- Status: active
- Owner:
- Date:
- Source: manual/GitHub
- Related Links:

## 1. Summary
- Current largest risk.
- Work currently blocked.
- Most important external dependency.

## 2. Risks
| Risk | Probability | Impact | Mitigation | Owner | Status | Evidence |
|------|-------------|--------|------------|-------|--------|----------|
| | low/medium/high | low/medium/high | | | open/mitigated/accepted | |

## 3. Active Issues
| Issue | Impact | Started At | Next Action | Owner | Status | Evidence |
|-------|--------|------------|-------------|-------|--------|----------|
| | | | | | open/resolved | |

## 4. Dependencies
| Dependency | Type | Needed By | Blocking? | Fallback | Owner | Evidence |
|------------|------|-----------|-----------|----------|-------|----------|
| | internal/external | | yes/no | | | |

## 5. Decisions Needed
- Decision needed to unblock work.
- Decision maker.
- Decision deadline.

## 6. Evidence
- Related issues:
- Related PRs:
- Related external links:
- Related snapshots:

## 7. Agent Reading Notes
- Treat dependencies marked Blocking yes as blocker candidates.
- Weight high Probability and high Impact risks strongly in riskCount.
- Treat high risks without Mitigation as watchNext candidates.

## Agent Collaboration Prompt
Use this risk log to analyze project risks, issues, and dependencies.
- Prioritize high probability or high impact items.
- Decide whether blocking dependencies and active issues are stopping current progress.
- Summarize weak mitigations and decisions needed as watchNext.`,
    },
    release_ops_learning: {
      title: "Release / Changelog / Runbook / Postmortem",
      contentMarkdown: `# Release / Changelog / Runbook / Postmortem

## Metadata
- Title:
- Type: release-ops
- Status: draft/shipped/incident-review/closed
- Owner:
- Date:
- Source: manual/GitHub
- Related Links:

## 1. Release Summary
- Released version or date.
- User-visible changes.
- Connected PRD goal or milestone.

## 2. Shipped Items
| Item | Planned? | User Impact | Evidence |
|------|----------|-------------|----------|
| | yes/no | | |

## 3. Rollout Plan
- Deployment order.
- Smoke test.
- Rollback condition.
- Rollback method.

## 4. Changelog
- Changes users should know.
- Internal-only changes.
- Known issue.

## 5. Runbook
- Metrics or logs to check when something goes wrong.
- Recovery procedure.
- Escalation target.

## 6. Incident or Postmortem
- Problem that occurred.
- Impact.
- Cause.
- Response.
- Prevention action item.

## 7. Evidence
- Release:
- Related PRs:
- Related commits:
- Related incidents:
- Related snapshots:

## 8. Agent Reading Notes
- Treat shipped items marked Planned no as scope drift candidates.
- Treat empty rollback condition or runbook as operational risk.
- Treat postmortem action items as watchNext candidates.

## Agent Collaboration Prompt
Use this release/ops document to analyze release outcome and operational risk.
- Check whether shipped items match the planned scope.
- Decide whether gaps in rollout, rollback, or runbook create operational risk.
- Summarize postmortem action items and next-release follow-up as watchNext.`,
    },
  },
};

export function isStoredProjectDocumentType(type: ProjectDocumentType): type is StoredProjectDocumentType {
  return type !== "prd";
}

export function normalizeProjectDocumentType(value: FormDataEntryValue | string | null | undefined): ProjectDocumentType | null {
  if (typeof value !== "string") {
    return null;
  }
  return PROJECT_DOCUMENT_TYPES.includes(value as ProjectDocumentType)
    ? (value as ProjectDocumentType)
    : null;
}

export function getProjectDocumentTypeMeta(type: ProjectDocumentType): ProjectDocumentTypeMeta {
  return {
    type,
    ...META[type],
  };
}

export function getProjectDocumentTemplate(
  type: ProjectDocumentType,
  locale: string | undefined
): ProjectDocumentTemplate {
  return TEMPLATES[locale === "ko" ? "ko" : "en"][type];
}

export function estimateDocumentReadiness(
  type: ProjectDocumentType,
  contentMarkdown: string | null | undefined,
  updatedAt?: string | null,
  now: Date = new Date()
): ProjectDocumentReadiness {
  const content = (contentMarkdown ?? "").trim();
  if (!content) {
    return "missing";
  }

  if (updatedAt) {
    const updated = new Date(updatedAt).getTime();
    if (Number.isFinite(updated)) {
      const ageMs = now.getTime() - updated;
      if (ageMs > 45 * 24 * 60 * 60 * 1000) {
        return "stale";
      }
    }
  }

  const lower = content.toLowerCase();
  const matchedKeywords = getProjectDocumentTypeMeta(type).requiredKeywords.filter((keyword) =>
    lower.includes(keyword.toLowerCase())
  );

  return content.length >= 200 && matchedKeywords.length >= 2 ? "usable" : "draft";
}

export function buildDocumentSummary(input: {
  id: string;
  documentType: ProjectDocumentType;
  title: string;
  contentMarkdown: string | null | undefined;
  isApplied: boolean;
  updatedAt: string | null;
}): ProjectDocumentSummary {
  return {
    id: input.id,
    documentType: input.documentType,
    title: input.title,
    readiness: estimateDocumentReadiness(input.documentType, input.contentMarkdown, input.updatedAt),
    isApplied: input.isApplied,
    contentPreview: (input.contentMarkdown ?? "").replace(/\s+/g, " ").trim().slice(0, 1500),
    updatedAt: input.updatedAt,
  };
}

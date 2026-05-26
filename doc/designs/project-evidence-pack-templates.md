# Project Evidence Pack Templates

> 작성일: 2026-05-26
> 대상 제품: Synapso.dev Project Memory
> 목적: 프로젝트 상태 판단 에이전트가 읽을 수 있는 기본 문서 초안 묶음을 정의한다.

## 1. 원칙

Evidence Pack은 프로젝트 문서함이 아니다. 에이전트가 프로젝트 상태를 판단하기 위해 읽는 증거 묶음이다.

각 문서는 사람이 빠르게 쓰고, 에이전트가 안정적으로 추출할 수 있어야 한다. 그래서 모든 초안은 같은 공통 필드를 가진다.

| 공통 필드 | 의미 |
|-----------|------|
| Title | 문서 제목 |
| Type | 문서 유형 |
| Status | draft, active, done, superseded, blocked |
| Owner | 책임자. 없으면 unknown |
| Date | 작성일 또는 마지막 갱신일 |
| Source | manual, GitHub, AI-generated, imported |
| Related Links | 관련 issue, PR, commit, release, snapshot |
| Evidence | 상태 판단에 직접 쓰일 원문 조각 |
| Open Questions | 아직 결정되지 않은 질문 |

에이전트는 모든 문서를 다음 여섯 가지 상태 판단으로 연결한다.

| 판단 항목 | 설명 |
|-----------|------|
| progress | 계획 대비 어디까지 완료됐는가 |
| blocker | 지금 진행을 막는 것이 있는가 |
| risk | 아직 터지지 않았지만 위험한 것이 있는가 |
| drift | 원래 계획과 현재 방향이 달라졌는가 |
| watchNext | 다음에 봐야 할 것이 무엇인가 |
| evidence | 판단 근거가 어디에 있는가 |

## 2. Evidence Pack 구조

```text
Project Evidence Pack
├─ 01 PRD / Requirements
├─ 02 Roadmap / Milestone Plan
├─ 03 Backlog / Issue / Task
├─ 04 Sprint / Iteration Plan
├─ 05 Decision Log / ADR
├─ 06 Technical Design / RFC
├─ 07 Risk / Issue / Dependency Log
└─ 08 Release / Changelog / Runbook / Postmortem
```

초기 제품에서는 이 전체 묶음을 하나의 마크다운 문서로 붙여넣어도 된다. 나중에 사용량이 생기면 각 섹션을 별도 `project_documents`로 분리할 수 있다.

---

## 3. Template 01. PRD / Requirements

### 역할

PRD는 프로젝트의 기준선이다. 에이전트는 이 문서로 무엇을 만들기로 했는지, 어떤 결과가 성공인지 판단한다.

### State Signals

| 신호 | 추출 방식 |
|------|-----------|
| progress | Acceptance Criteria 중 완료된 항목 비율 |
| blocker | 목표 달성을 막는 미결정 질문 |
| risk | 성공 조건을 위협하는 가정 |
| drift | 현재 구현이나 의사결정이 scope와 달라진 부분 |
| watchNext | 미완료 acceptance criteria와 열린 질문 |
| evidence | 관련 PRD 섹션, issue, PR, commit 링크 |

### Draft

```markdown
# PRD / Requirements

## Metadata
- Title:
- Type: PRD
- Status: draft
- Owner:
- Date:
- Source: manual
- Related Links:

## 1. Background
- 왜 이 프로젝트가 필요한가.
- 지금 사용자가 겪는 문제는 무엇인가.
- 이 문제를 지금 해결해야 하는 이유는 무엇인가.

## 2. Goal
- v1에서 달성할 핵심 목표.
- 성공하면 사용자가 어떤 변화를 느끼는가.
- 이 목표가 비즈니스나 제품에 주는 효과.

## 3. Target User
- 주요 사용자.
- 사용자가 이 기능을 쓰는 상황.
- 사용자가 이미 쓰고 있는 대안.

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
- 관련 issue:
- 관련 PR:
- 관련 commit:
- 관련 snapshot:

## 9. Agent Reading Notes
- 목표와 완료 기준을 우선 추출한다.
- In Scope와 Out of Scope를 drift 판단 기준으로 사용한다.
- Acceptance Criteria가 비어 있으면 progress 신뢰도를 낮춘다.
```

---

## 4. Template 02. Roadmap / Milestone Plan

### 역할

Roadmap은 시간축이다. 에이전트는 이 문서로 프로젝트가 어느 단계에 있고, 지연됐는지, 다음 milestone이 무엇인지 판단한다.

### State Signals

| 신호 | 추출 방식 |
|------|-----------|
| progress | 완료된 milestone 수와 현재 milestone 상태 |
| blocker | milestone을 막는 dependency |
| risk | 날짜나 범위가 불명확한 milestone |
| drift | roadmap 순서나 목표가 바뀐 부분 |
| watchNext | 다음 milestone과 검증 조건 |
| evidence | milestone issue, release, PR 링크 |

### Draft

```markdown
# Roadmap / Milestone Plan

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

## 5. Changes Since Last Update
- 새로 추가된 milestone.
- 밀린 milestone.
- 제거된 milestone.
- 변경 이유.

## 6. Evidence
- 관련 issue:
- 관련 PR:
- 관련 release:
- 관련 snapshot:

## 7. Agent Reading Notes
- Current Milestone을 currentPhase 후보로 사용한다.
- Target Date가 지났고 Status가 done이 아니면 risk 또는 blocker 후보로 본다.
- Changes Since Last Update는 drift 후보로 본다.
```

---

## 5. Template 03. Backlog / Issue / Task

### 역할

Backlog는 실행 단위다. 에이전트는 이 문서로 실제 작업 상태, 우선순위, 막힌 작업, 누락 작업을 판단한다.

### State Signals

| 신호 | 추출 방식 |
|------|-----------|
| progress | done 항목과 전체 작업 항목 비율 |
| blocker | blocked 상태 작업 |
| risk | high priority인데 오래 미완료인 작업 |
| drift | PRD scope에 없는 새 작업 |
| watchNext | high priority의 not_started 또는 in_progress 항목 |
| evidence | GitHub issue, PR, commit 링크 |

### Draft

```markdown
# Backlog / Issue / Task

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
- 관련 issue:
- 관련 PR:
- 관련 commit:
- 관련 snapshot:

## 6. Agent Reading Notes
- Status와 Priority를 progress와 watchNext 계산에 사용한다.
- Blocker가 있으면 blockerCount 후보로 본다.
- PRD에 없는 새 작업은 scope drift 후보로 본다.
```

---

## 6. Template 04. Sprint / Iteration Plan

### 역할

Sprint Plan은 짧은 주기의 약속이다. 에이전트는 장기 계획이 실제 실행으로 내려왔는지, 이번 cycle에서 무엇이 끝나야 하는지 판단한다.

### State Signals

| 신호 | 추출 방식 |
|------|-----------|
| progress | sprint goal과 selected items 완료 상태 |
| blocker | sprint 중 막힌 항목 |
| risk | carry-over가 반복되는 항목 |
| drift | sprint goal이 roadmap 또는 PRD와 달라진 부분 |
| watchNext | 이번 cycle의 남은 최우선 작업 |
| evidence | sprint issue, PR, commit, snapshot 링크 |

### Draft

```markdown
# Sprint / Iteration Plan

## Metadata
- Title:
- Type: sprint-plan
- Status: active
- Owner:
- Date:
- Source: manual
- Related Links:

## 1. Iteration Window
- 시작일:
- 종료일:
- 담당자:
- 이번 cycle의 핵심 목표:

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
- 관련 issue:
- 관련 PR:
- 관련 commit:
- 관련 snapshot:

## 7. Agent Reading Notes
- Iteration Window와 Selected Work를 현재 실행 상태 판단에 사용한다.
- carried_over가 반복되면 execution drift 또는 risk 후보로 본다.
- Sprint Goal이 PRD 목표와 다르면 drift 후보로 본다.
```

---

## 7. Template 05. Decision Log / ADR

### 역할

Decision Log와 ADR은 왜 이 방향으로 갔는지 보존한다. 에이전트는 이 문서로 계획 변경의 이유, 되돌림 비용, 기술 선택의 맥락을 판단한다.

### State Signals

| 신호 | 추출 방식 |
|------|-----------|
| progress | 결정 완료 여부와 결정이 unblock한 작업 |
| blocker | pending decision |
| risk | high impact decision의 불충분한 근거 |
| drift | 기존 결정이 superseded된 부분 |
| watchNext | 만료되거나 재검토해야 하는 결정 |
| evidence | ADR, issue, PR, commit 링크 |

### Draft

```markdown
# Decision Log / ADR

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
- 관련 issue:
- 관련 PR:
- 관련 commit:
- 관련 snapshot:

## 8. Agent Reading Notes
- accepted 결정은 현재 기준선으로 사용한다.
- superseded 결정은 drift 근거로 사용한다.
- proposed 결정이 오래 열려 있으면 blocker 후보로 본다.
```

---

## 8. Template 06. Technical Design / RFC

### 역할

Technical Design과 RFC는 구현 전 설계 검토 문서다. 에이전트는 이 문서로 데이터 흐름, API, 에러 경로, 테스트 계획이 충분한지 판단한다.

### State Signals

| 신호 | 추출 방식 |
|------|-----------|
| progress | 설계 항목 구현 여부 |
| blocker | 미정 API, schema, auth, dependency |
| risk | 에러 경로나 테스트가 없는 설계 |
| drift | 구현이 설계와 달라진 부분 |
| watchNext | 구현 전 결정해야 할 설계 질문 |
| evidence | RFC, PR, migration, test 링크 |

### Draft

```markdown
# Technical Design / RFC

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
- 새 API:
- 변경 API:
- 저장되는 데이터:
- 외부 서비스 호출:

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
- 관련 issue:
- 관련 PR:
- 관련 commit:
- 관련 migration:

## 10. Agent Reading Notes
- Error Paths와 Test Plan이 비어 있으면 risk 후보로 본다.
- Proposed Design과 실제 PR diff가 다르면 technical drift 후보로 본다.
- Security가 비어 있으면 high-risk 신호로 본다.
```

---

## 9. Template 07. Risk / Issue / Dependency Log

### 역할

Risk, Issue, Dependency Log는 프로젝트가 왜 막히는지 설명한다. 에이전트는 이 문서로 blockerCount, riskCount, watchNext를 더 정확히 만든다.

### State Signals

| 신호 | 추출 방식 |
|------|-----------|
| progress | resolved 항목과 전체 항목 비율 |
| blocker | active issue 또는 blocking dependency |
| risk | high probability, high impact risk |
| drift | risk 대응으로 scope나 roadmap이 바뀐 부분 |
| watchNext | owner와 next action이 있는 open item |
| evidence | issue, PR, incident, external link |

### Draft

```markdown
# Risk / Issue / Dependency Log

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
- 관련 issue:
- 관련 PR:
- 관련 external link:
- 관련 snapshot:

## 7. Agent Reading Notes
- Blocking이 yes인 dependency는 blocker 후보로 본다.
- Probability와 Impact가 high인 risk는 riskCount에 강하게 반영한다.
- Mitigation 없는 high risk는 watchNext 후보로 본다.
```

---

## 10. Template 08. Release / Changelog / Runbook / Postmortem

### 역할

Release와 운영 학습 문서는 실제로 사용자에게 무엇이 나갔고, 운영 중 무엇을 배웠는지 보존한다. 에이전트는 이 문서로 “계획상 완료”와 “실제 출시”를 분리해서 판단한다.

### State Signals

| 신호 | 추출 방식 |
|------|-----------|
| progress | shipped item과 planned item의 일치 여부 |
| blocker | release를 막는 rollout issue |
| risk | rollback, incident, missing runbook |
| drift | 계획과 다르게 출시된 항목 |
| watchNext | post-release action item |
| evidence | release, changelog, incident, postmortem 링크 |

### Draft

```markdown
# Release / Changelog / Runbook / Postmortem

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
- release:
- 관련 PR:
- 관련 commit:
- 관련 incident:
- 관련 snapshot:

## 8. Agent Reading Notes
- Planned가 no인 shipped item은 scope drift 후보로 본다.
- rollback 조건이나 runbook이 비어 있으면 operational risk 후보로 본다.
- postmortem action item은 watchNext 후보로 본다.
```

---

## 11. 추천 사용 방식

### 단일 문서로 쓰는 방식

초기에는 프로젝트 생성/수정 화면의 `planContentMarkdown`에 아래 순서로 붙여넣는 것이 가장 단순하다.

```text
1. PRD
2. Roadmap
3. Backlog
4. Decision Log
5. Risk Log
```

Sprint, RFC, Release/Ops 문서는 필요할 때만 추가한다.

### 에이전트 분석 순서

```text
PRD -> Roadmap -> Backlog -> Sprint
  -> Decisions / ADR
  -> RFC
  -> Risk / Issue / Dependency
  -> Release / Ops
  -> GitHub commits / PRs / issues
  -> State Snapshot
```

### 최소 입력

사용자가 시간이 없을 때는 다음 네 가지만 채우면 된다.

1. PRD의 Goal과 Acceptance Criteria.
2. Backlog의 Work Items.
3. Decision Log의 accepted decision.
4. Risk Log의 open risks와 blockers.

## 12. 제품화할 때의 다음 단계

이 템플릿을 바로 제품에 넣기 전에 다음 결정을 해야 한다.

1. 템플릿을 하나의 큰 PRD 가이드로 보여줄지, 문서 유형별 탭으로 보여줄지.
2. `project_plans` 하나에 계속 넣을지, `project_documents` 테이블을 만들지.
3. GitHub Issues를 원문 저장할지, snapshot evidence만 저장할지.
4. 사용자가 risk와 decision을 수동 확정할 수 있게 할지.
5. AI가 빈 템플릿을 자동 생성해주는 기능을 넣을지.

첫 구현은 큰 DB 변경 없이, 현재 PRD 템플릿 가이드를 Evidence Pack 가이드로 확장하는 방향이 가장 안전하다.

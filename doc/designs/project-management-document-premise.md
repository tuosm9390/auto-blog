# Project Management Document Premise

> 작성일: 2026-05-26
> 대상 제품: Synapso.dev Project Memory
> 목적: 프로젝트 진행관리와 관리 보조 환경을 만들기 전에, 어떤 문서를 기본 단위로 보존하고 분석해야 하는지 정의한다.

## 1. 결론

Project Memory가 관리해야 할 문서는 "문서 저장소"가 아니라 "프로젝트 상태를 판단하는 증거"여야 한다.

가장 많이 반복되는 실무 산출물은 다음 10개다.

1. PRD 또는 요구사항 문서.
2. Roadmap 또는 milestone plan.
3. Backlog, issue, task.
4. Sprint 또는 iteration plan.
5. Definition of Done과 acceptance criteria.
6. Architecture decision record, ADR.
7. Technical design 또는 RFC.
8. Risk register와 issue log.
9. Release note, changelog, rollout plan.
10. Runbook, incident report, postmortem, lessons learned.

이 중 Synapso.dev의 첫 관리 환경에서 반드시 제품 모델로 다뤄야 하는 것은 PRD, backlog/issue, decision log, risk/issue log, release/change log, status snapshot이다. 나머지는 초기에는 링크/첨부/마크다운 블록으로 보존하고, 사용량이 확인되면 별도 구조화 대상으로 승격하는 편이 맞다.

## 2. 조사 근거 요약

Atlassian은 PRD를 제품 목적, 기능, 사용자 요구, 성공 기준을 담는 팀의 단일 기준점으로 설명한다. GitLab의 제품 개발 흐름은 issue와 epic을 중심으로 backlog, 설계, 검증, 기술 문서 리뷰를 연결한다. Scrum 계열 자료는 product backlog, sprint backlog, increment와 Definition of Done을 반복 산출물로 본다.

PMBOK/PRINCE2 계열에서 반복되는 관리 문서는 project charter, stakeholder register, assumption log, risk register, issue log, change log, lessons learned register다. 소프트웨어 팀에서는 여기에 ADR, RFC/technical design, runbook, postmortem이 붙는다.

GitHub의 프로젝트 관리 모델은 issue, sub-issue, milestone, label, project board, roadmap/table view를 기본 단위로 둔다. Google SRE 문서는 장애 대응 절차, incident document, postmortem, runbook을 운영 지식 보존의 핵심으로 본다.

## 3. 문서 유형 분류

### A. 방향을 정하는 문서

| 문서 | 보존 이유 | Synapso에서 읽어야 하는 신호 |
|------|-----------|------------------------------|
| Vision / Strategy Brief | 왜 이 프로젝트를 하는지 설명한다 | 제품 가설, 사용자, 장기 목표 |
| PRD | 무엇을 만들지 정의한다 | 기능 범위, 성공 기준, 비범위 |
| Roadmap / Milestone Plan | 언제 어떤 순서로 만들지 보여준다 | 목표 일정, 단계, 우선순위 |
| Business Case | 비용과 기대효과를 설명한다 | ROI, 시장/사용자 근거, 중단 기준 |

초기 제품에서는 PRD와 roadmap만 구조화하면 된다. Vision과 business case는 PRD 안의 섹션으로 흡수 가능하다.

### B. 실행을 관리하는 문서

| 문서 | 보존 이유 | Synapso에서 읽어야 하는 신호 |
|------|-----------|------------------------------|
| Backlog / Issue | 실제 작업 단위다 | 상태, 담당, blocker, dependency |
| Sprint / Iteration Plan | 짧은 주기의 약속이다 | 이번 주 목표, 완료 예정 범위 |
| Task Checklist | 구현 세부 작업이다 | 진행률, 남은 작업, 누락 작업 |
| Definition of Done | 완료의 기준이다 | 테스트, 문서, 배포, 리뷰 조건 |
| Acceptance Criteria | 기능별 검수 기준이다 | 통과/실패 판정 가능한 조건 |

초기 제품에서는 GitHub issues, PRD 체크리스트, 로컬 `checklist.md`를 같은 "work item evidence"로 취급해야 한다.

### C. 의사결정을 보존하는 문서

| 문서 | 보존 이유 | Synapso에서 읽어야 하는 신호 |
|------|-----------|------------------------------|
| ADR | 되돌리기 어려운 기술 결정을 보존한다 | 결정, 대안, 결과, 상태 |
| RFC / Technical Design | 구현 전에 설계 논리를 검토한다 | 아키텍처, 데이터 흐름, 위험 |
| Decision Log | 제품/운영 결정을 시간순으로 남긴다 | 결정자, 날짜, 근거, 영향 |
| Assumption Log | 아직 검증되지 않은 전제를 남긴다 | 가정, 검증 방법, 만료 시점 |

Project Memory의 차별점은 여기다. 대부분의 툴은 "작업이 진행 중인가"만 보여준다. Synapso는 "왜 이 방향으로 가고 있는가"와 "그 전제가 아직 맞는가"를 보여줘야 한다.

### D. 위험과 변경을 추적하는 문서

| 문서 | 보존 이유 | Synapso에서 읽어야 하는 신호 |
|------|-----------|------------------------------|
| Risk Register | 아직 발생하지 않은 위험을 추적한다 | 확률, 영향, 대응책, 소유자 |
| Issue Log | 이미 발생한 문제를 추적한다 | 상태, 영향, 해결 기한 |
| Change Log | 범위와 결정 변경을 기록한다 | 변경 전/후, 이유, 승인 |
| Dependency Log | 외부/내부 의존성을 추적한다 | 막힌 작업, 선행 조건 |

초기 제품에서는 risk와 issue를 분리하되, UI에서는 "관리자가 지금 봐야 할 것"으로 합쳐 보여주는 편이 낫다. 사용자는 taxonomy를 보러 오는 게 아니라 프로젝트가 위험한지 보러 온다.

### E. 출시와 운영을 보존하는 문서

| 문서 | 보존 이유 | Synapso에서 읽어야 하는 신호 |
|------|-----------|------------------------------|
| Release Plan | 배포 순서와 검증 절차를 정의한다 | rollout, rollback, smoke test |
| Changelog / Release Notes | 사용자에게 바뀐 점을 설명한다 | shipped item, user impact |
| Runbook | 장애나 반복 운영 작업의 절차다 | trigger, steps, owner |
| Incident Report | 장애 당시 사실 기록이다 | timeline, impact, mitigation |
| Postmortem / Lessons Learned | 재발 방지 지식을 남긴다 | root cause, action item |

Synapso의 현재 `CHANGELOG.md`, GitHub Releases 기반 업데이트 노트, `analysis_runs` 실패 이력은 이 범주로 연결된다.

## 4. 빈도와 우선순위

| 우선순위 | 문서 유형 | 이유 |
|----------|-----------|------|
| P0 | PRD / Requirements | 제품 방향의 기준점. 현재 프로젝트도 이미 PRD-aware flow가 핵심이다 |
| P0 | Issue / Backlog / Task | 진행률 판단의 실제 단위다 |
| P0 | Status Snapshot / Progress Report | Project Memory의 출력물 그 자체다 |
| P0 | Decision Log / ADR | 계획 이탈과 의사결정 맥락을 설명한다 |
| P1 | Risk Register / Issue Log | blocker, risk, drift 분석과 직접 연결된다 |
| P1 | Roadmap / Milestone | 진행률을 시간축에 올려준다 |
| P1 | Acceptance Criteria / Definition of Done | 완료 판정의 기준을 만든다 |
| P1 | Changelog / Release Note | 실제 shipped 상태와 계획의 차이를 검증한다 |
| P2 | Technical Design / RFC | 큰 기능에는 중요하지만 모든 작은 작업에 강제하면 무겁다 |
| P2 | Runbook / Postmortem | 운영 성숙도가 올라간 뒤 강해진다 |
| P2 | Stakeholder / Communication Plan | 팀 제품에는 중요하지만 솔로 빌더 MVP에서는 후순위다 |

## 5. Synapso.dev에 적용할 전제

### 전제 1. 모든 문서를 같은 무게로 다루면 제품이 망가진다.

관리 문서는 많다. 하지만 사용자가 매번 10종류 문서를 작성하게 만들면 아무도 안 쓴다.

따라서 Synapso의 기본 입력은 세 가지여야 한다.

1. 계획 문서: PRD, roadmap, acceptance criteria.
2. 실행 증거: GitHub commits, PRs, issues, checklist.
3. 판단 기록: decision, risk, blocker, change.

나머지 문서는 이 세 가지 안으로 흡수한다.

### 전제 2. 문서의 원본보다 "상태 판정에 필요한 필드"가 중요하다.

각 문서를 완벽히 재현하려고 하면 Confluence를 다시 만들게 된다. 이 프로젝트의 승부처는 문서 편집기가 아니라 상태 판단이다.

문서마다 최소 추출 필드는 다음으로 제한한다.

| 공통 필드 | 설명 |
|-----------|------|
| title | 사람이 식별하는 이름 |
| type | PRD, issue, ADR, risk, release 등 |
| status | draft, active, done, superseded, blocked 등 |
| owner | 책임자. 없으면 unknown |
| createdAt / updatedAt | 최신성 판단 |
| source | GitHub, markdown, manual, AI-generated |
| links | 관련 PR, issue, commit, release |
| evidence | 상태 판단에 쓰인 원문 조각 |

### 전제 3. Project Memory의 핵심 객체는 "문서"가 아니라 "project state"다.

현재 파이프라인은 프로젝트 등록, GitHub 활동 수집, Gemini 분석, 스냅샷 저장, 대시보드 표시로 구성되어 있다. 이 흐름은 맞다.

고도화 방향은 문서 편집 기능을 붙이는 것이 아니라, 분석 입력을 더 좋은 증거 세트로 만드는 것이다.

```text
PRD / Roadmap / Checklist
        │
GitHub Issues / PRs / Commits
        │
ADR / Decisions / Risks
        ▼
Evidence Pack
        ▼
AI Project State Analysis
        ▼
Snapshot: progress, drift, blockers, risks, watchNext
```

### 전제 4. "진행률"은 단일 숫자가 아니라 네 가지 근거의 합성이다.

초기 대시보드의 progressPercent는 유용하지만 위험하다. 숫자 하나가 신뢰를 얻으려면 근거가 보여야 한다.

진행률은 최소 네 신호로 설명되어야 한다.

1. 계획 대비 완료된 acceptance criteria.
2. issue/backlog 상태.
3. 최근 commit/PR 활동.
4. open risk/blocker와 unresolved decision.

이 네 신호가 불일치하면 drift로 봐야 한다.

### 전제 5. 의사결정 로그는 이 제품의 10배 차별점이다.

대부분의 프로젝트 관리 툴은 task state를 잘 보여준다. 문제는 "왜 이 일이 생겼는지"를 잃는 것이다.

Synapso는 PRD와 GitHub 활동 사이에서 다음 질문에 답해야 한다.

- 계획에 없던 작업이 왜 생겼는가?
- 원래 가설이 바뀌었는가?
- 최근 커밋이 roadmap을 앞당기는가, 벗어나는가?
- 반복되는 blocker가 구조적 문제인가?
- 이 결정은 되돌릴 수 있는가?

이 질문은 backlog만으로는 답이 안 나온다. decision log와 ADR을 1급 입력으로 다뤄야 한다.

## 6. 추천 정보 구조

```text
Project
├─ Plan Documents
│  ├─ PRD
│  ├─ Roadmap
│  └─ Acceptance Criteria
├─ Work Evidence
│  ├─ GitHub Issues
│  ├─ Pull Requests
│  ├─ Commits
│  └─ Checklist Items
├─ Management Signals
│  ├─ Risks
│  ├─ Issues
│  ├─ Decisions
│  └─ Dependencies
├─ Delivery Records
│  ├─ Releases
│  ├─ Changelog Entries
│  └─ Rollout Notes
└─ State Snapshots
   ├─ Progress
   ├─ Drift
   ├─ Blockers
   ├─ Watch Next
   └─ Evidence Links
```

## 7. MVP 범위 제안

### 반드시 포함할 것

- PRD 텍스트 저장과 버전 관리.
- GitHub issue, PR, commit 수집.
- 사용자가 직접 추가하는 decision/risk/blocker 메모.
- 분석 결과에서 각 판단의 evidence link 표시.
- state snapshot history.
- drift reason을 "계획 변경", "미완료 작업", "새 리스크", "근거 부족"으로 분류.

### 아직 제품화하지 말 것

- 완전한 문서 편집기.
- Confluence/Notion 양방향 동기화.
- 복잡한 stakeholder matrix.
- Gantt chart.
- 리소스/예산 관리.
- 엔터프라이즈 승인 워크플로우.

이것들은 솔로 빌더와 소규모 팀의 첫 번째 고통이 아니다. 지금 필요한 건 "내 프로젝트가 어디까지 왔고, 무엇이 틀어졌고, 다음에 뭘 해야 하는지"다.

## 8. 다음 설계 질문

1. 사용자가 직접 작성하는 관리 신호를 어디에 둘 것인가. 프로젝트 편집 화면, 대시보드 사이드 패널, 별도 management tab 중 선택이 필요하다.
2. risk와 blocker를 AI가 자동 생성만 할 것인가, 사용자가 수동 확정할 수 있게 할 것인가.
3. PRD/roadmap/decision/risk를 모두 `project_plans`에 넣을 것인가, 별도 `project_documents` 테이블로 일반화할 것인가.
4. GitHub Issues를 저장할 것인가, 매번 조회하고 snapshot에 evidence만 남길 것인가.
5. 상태 분석 결과를 "보고서"로만 보여줄 것인가, 사용자가 action item으로 전환할 수 있게 할 것인가.

## 9. 출처

- Atlassian, Product Requirements Document guide: https://www.atlassian.com/agile/requirements
- Atlassian, Project management templates: https://www.atlassian.com/project-management/templates
- GitLab Handbook, Product Development Flow: https://handbook.gitlab.com/handbook/product-development/how-we-work/product-development-flow/
- GitLab Handbook, Product Planning team workflow: https://handbook.gitlab.com/handbook/engineering/devops/plan/product-planning/how-we-work/
- GitHub Issues product page: https://github.com/features/issues
- Scrum Alliance, Scrum artifacts overview: https://www.scrumalliance.org/learn-about-scrum/scrum-elearning-series/scrum-artifacts
- Google SRE Workbook, Postmortem Culture: https://sre.google/workbook/postmortem-culture/
- Google SRE Book, Managing Incidents: https://sre.google/sre-book/managing-incidents/
- Google Cloud Architecture Center, ADR overview: https://docs.cloud.google.com/architecture/architecture-decision-records
- Structurizr docs, Architecture decisions: https://docs.structurizr.com/ui/decisions/

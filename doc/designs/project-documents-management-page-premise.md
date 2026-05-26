# Project Documents Management Page Premise

> 작성일: 2026-05-26
> 대상 제품: Synapso.dev Project Memory
> 목적: 등록된 프로젝트에서 Evidence 문서를 관리하고, 사용자가 상태 판단 근거를 확인할 수 있는 페이지의 전제를 정의한다.

## 1. 결론

Synapso.dev에 필요한 페이지는 일반 문서 편집기가 아니다.

필요한 것은 프로젝트별 Evidence 문서의 준비 상태, 최신성, 상태 판단 연결성을 보여주는 관리 페이지다. 사용자는 문서를 쓰기 위해 들어오는 것이 아니라, 프로젝트 상태판이 무엇을 근거로 판단하는지 확인하고 부족한 문서를 보강하기 위해 들어온다.

첫 버전의 페이지는 `/projects/[id]/documents`가 적합하다.

## 2. 현재 제품 상태

현재 프로젝트 관리 구조는 다음과 같다.

```text
Project
├─ project_plans
│  └─ 현재 PRD / 계획 문서 1개
├─ analysis_runs
│  └─ Refresh state 실행 이력
└─ state_snapshots
   ├─ progress_percent
   ├─ current_phase
   ├─ blocker_count
   ├─ risk_count
   ├─ drift_count
   ├─ plan_progress_json
   ├─ drift_json
   └─ evidence_json
```

현재 UI는 프로젝트 상세 페이지에서 snapshot, evidence summary, plan progress, drift, runs를 보여준다. 하지만 문서 자체를 유형별로 관리하는 화면은 없다. 프로젝트 생성/수정 화면의 PRD 템플릿 가이드만 존재한다.

## 3. 문제

Project Memory가 더 정확해지려면 PRD 하나로는 부족하다.

에이전트는 진행률, blocker, risk, drift를 판단하기 위해 roadmap, backlog, decision, risk log 같은 추가 근거를 읽어야 한다. 그런데 사용자가 이 문서들을 어디에 두고, 어떤 문서가 부족한지, 어떤 문서가 최신 snapshot에 쓰였는지 확인할 방법이 없다.

문서가 많아지면 더 큰 문제가 생긴다. 사용자는 문서를 관리하다 지친다. 제품이 "프로젝트 상태 추적"에서 "문서 작성 숙제"로 변한다. 이건 피해야 한다.

## 4. 페이지의 역할

문서 관리 페이지는 세 가지 일을 해야 한다.

1. 어떤 Evidence 문서가 있는지 보여준다.
2. 각 문서가 상태 판단에 어떤 영향을 주는지 보여준다.
3. 최신 snapshot이 어떤 문서를 근거로 삼았는지 보여준다.

이 페이지는 문서 편집기가 아니라 상태 판단 근거의 control panel이어야 한다.

## 5. 정보 구조

```text
/projects/[id]/documents
├─ Header
│  ├─ Project name
│  ├─ Document readiness score
│  └─ Refresh state action
├─ Evidence Coverage
│  ├─ PRD / Requirements
│  ├─ Roadmap
│  ├─ Backlog
│  ├─ Sprint Plan
│  ├─ Decision Log / ADR
│  ├─ Technical Design / RFC
│  ├─ Risk / Issue / Dependency Log
│  └─ Release / Ops Learning
├─ Document Detail
│  ├─ Current content preview
│  ├─ State signals affected
│  ├─ Related links
│  └─ Last used in snapshot
└─ Missing Evidence
   ├─ Missing acceptance criteria
   ├─ Missing decision context
   ├─ Missing risk mitigation
   └─ Missing release evidence
```

## 6. 사용자 흐름

### Flow A. 프로젝트 등록 직후

```text
Create project -> Add PRD -> Documents page
  -> PRD ready
  -> Roadmap missing
  -> Risk Log missing
  -> User copies template
  -> Refresh state
```

사용자는 처음부터 8개 문서를 모두 작성하지 않는다. 페이지는 "지금 필요한 다음 문서"를 보여줘야 한다.

### Flow B. 상태 스냅샷이 부정확할 때

```text
State page looks weak -> Open Documents
  -> Evidence coverage shows PRD only
  -> Backlog and Decision Log missing
  -> User adds execution evidence
  -> Refresh state
  -> planProgress and drift become more grounded
```

이 흐름이 핵심이다. 문서 관리는 상태판 품질을 높이는 수단이다.

### Flow C. Drift가 생겼을 때

```text
Drift page shows changed direction
  -> Open Documents
  -> Decision Log missing or superseded
  -> User records accepted decision
  -> Next snapshot explains why direction changed
```

Drift는 나쁜 것이 아니다. 설명되지 않은 drift가 문제다.

## 7. 문서 카드 설계 전제

각 문서 유형은 카드로 보여준다.

| 항목 | 설명 |
|------|------|
| Document Type | PRD, Roadmap, Backlog 등 |
| Readiness | missing, draft, usable, stale |
| State Signals | progress, blocker, risk, drift, watchNext |
| Last Updated | 최신성 판단 |
| Last Used | 마지막으로 snapshot에 쓰인 시점 |
| Gaps | 에이전트가 보기 어려운 빈 항목 |
| Primary Action | Add, Edit, Review, Mark Superseded |

Readiness는 단순 존재 여부가 아니다.

```text
missing -> 문서 없음
draft -> 문서는 있지만 핵심 필드 부족
usable -> 상태 판단에 쓸 수 있음
stale -> snapshot 또는 GitHub 활동보다 오래됨
```

## 8. MVP 데이터 전제

첫 구현에서 선택지는 두 가지다.

### Option A. `project_plans` 단일 문서 안에 Evidence Pack 섹션을 넣는다.

장점은 DB 변경이 없다. 현재 구조와 잘 맞는다.

단점은 문서별 상태, 최신성, last used 판단이 어렵다. 마크다운 파싱이 필요하다.

### Option B. `project_documents` 테이블을 추가한다.

장점은 문서 유형별 관리가 가능하다. 페이지 구현이 명확하다.

단점은 migration, CRUD, RLS, UI, 분석 파이프라인 변경이 필요하다.

추천은 단계형이다.

1. 먼저 repo 문서와 UI 가이드로 Evidence Pack 초안을 정착시킨다.
2. 그 다음 `/projects/[id]/documents`를 읽기 중심 페이지로 만든다.
3. 사용자가 실제로 문서 유형별 관리를 원한다는 신호가 생기면 `project_documents`를 추가한다.

## 9. 권장 MVP 페이지 범위

첫 페이지는 다음만 포함한다.

- 현재 PRD / 계획 문서 미리보기.
- Evidence Pack 8종 readiness 카드.
- 각 카드별 "이 문서가 개선하는 상태 판단" 설명.
- 문서 초안 복사 영역.
- 최신 snapshot의 `evidence_json`, `plan_progress_json`, `drift_json` 연결 표시.
- 문서가 부족해서 약해지는 판단 항목 안내.

첫 버전에서 하지 않을 것.

- Notion식 block editor.
- 문서별 협업 댓글.
- 승인 워크플로우.
- 버전 diff UI.
- 외부 문서 동기화.

## 10. 장기 데이터 모델 후보

나중에 별도 저장 모델로 승격할 경우 최소 모델은 다음이 적당하다.

```text
project_documents
├─ id
├─ project_id
├─ document_type
├─ title
├─ status
├─ content_markdown
├─ source
├─ related_links_json
├─ last_used_snapshot_id
├─ created_at
└─ updated_at
```

분리된 `document_type` 값은 다음으로 시작한다.

```text
prd
roadmap
backlog
sprint_plan
decision
technical_design
risk_log
release_ops
```

## 11. 에이전트 분석 연결

분석 파이프라인은 문서를 다음 순서로 읽는 것이 좋다.

```text
PRD / Requirements
  -> Roadmap
  -> Backlog
  -> Sprint Plan
  -> Decision Log / ADR
  -> Technical Design / RFC
  -> Risk / Issue / Dependency Log
  -> Release / Ops Learning
  -> GitHub commits / PRs / issues
  -> State Snapshot
```

각 문서는 snapshot에 직접 연결되어야 한다.

```text
Document sections -> Evidence Pack -> Gemini analysis -> state_snapshots.evidence_json
```

사용자는 "AI가 이렇게 판단했다"가 아니라 "AI가 이 문서와 이 PR과 이 커밋 때문에 이렇게 판단했다"를 봐야 한다.

## 12. 성공 기준

문서 관리 페이지의 성공 기준은 문서 수가 아니다.

- 사용자가 상태판이 약한 이유를 알 수 있다.
- 사용자가 어떤 문서를 추가하면 분석이 좋아지는지 알 수 있다.
- drift가 생겼을 때 결정 문서와 연결된다.
- risk가 생겼을 때 mitigation 문서와 연결된다.
- release 후 실제 shipped item이 PRD와 대조된다.

이 페이지가 잘 되면 Synapso.dev는 단순한 프로젝트 dashboard가 아니라 프로젝트 기억의 검증 가능한 증거 레이어가 된다.

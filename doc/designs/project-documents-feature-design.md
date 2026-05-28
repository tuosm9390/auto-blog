# Project Documents Feature Design

> 작성일: 2026-05-28
> 대상 제품: Synapso.dev Project Memory
> 목표: Evidence 문서를 프로젝트 관리와 상태 분석에 직접 사용할 수 있도록 확인, 수정, 적용, 저장 기능의 제품 전제를 정의한다.

## 1. 결론

이 기능의 핵심은 문서 편집기가 아니다.

Synapso.dev가 만들어야 하는 것은 프로젝트 상태 판단에 쓰이는 근거 문서를 사용자가 확인하고, 자기 프로젝트에 맞게 수정하고, 저장한 뒤, 다음 분석에 적용할 수 있는 Evidence control surface다.

권장 방향은 `project_documents`를 별도 저장 모델로 추가하는 것이다. 기존 `project_plans` 단일 문서 안에 Evidence Pack을 넣는 방식은 빠르지만, 사용자가 요청한 문서 확인, 개별 수정, 적용, 저장, 최신성 판단, 분석 연결을 제대로 표현하기 어렵다.

첫 구현은 다음 범위가 적당하다.

- `/projects/[id]/documents` 페이지 추가.
- Evidence 문서 8종 카드와 상세 편집 패널 제공.
- 템플릿에서 초안 생성, 사용자 수정, 저장 기능 제공.
- 문서별 readiness와 분석 영향 신호 표시.
- Refresh state가 저장된 문서들을 분석 입력으로 사용.

## 2. 제품 문제

현재 Project Memory는 프로젝트 등록 시 PRD 또는 계획 문서 하나를 받는다. 이후 GitHub 활동과 plan을 바탕으로 snapshot, progress, blocker, risk, drift를 계산한다.

문제는 프로젝트 상태 판단에 필요한 근거가 PRD 하나로는 부족하다는 점이다.

- 진행률은 roadmap, backlog, sprint plan이 있어야 더 정확하다.
- drift는 original thesis, current thesis, decision log가 있어야 설명 가능하다.
- risk와 blocker는 risk log, issue log, dependency log가 있어야 추적 가능하다.
- release 이후 학습은 release/ops learning 문서가 있어야 다음 판단에 반영된다.

사용자는 지금 어떤 문서가 상태 판단에 쓰였는지, 어떤 문서가 부족한지, 어떤 문서를 고치면 분석 품질이 좋아지는지 알기 어렵다.

## 3. 기능의 역할

문서 관리 기능은 네 가지 역할을 가져야 한다.

1. 확인.
   사용자는 프로젝트에 어떤 Evidence 문서가 등록되어 있는지 확인한다.

2. 수정.
   사용자는 기본 초안을 자기 프로젝트에 맞게 바꾼다.

3. 적용.
   사용자는 저장된 문서를 다음 상태 분석 입력으로 사용할 수 있게 만든다.

4. 저장.
   문서는 프로젝트별 typed artifact로 저장되고, 최신 snapshot과 연결된다.

여기서 “적용”은 단순 저장과 다르다. 저장은 문서 내용을 보존하는 행위이고, 적용은 해당 문서를 상태 분석의 근거로 포함시키는 행위다.

## 4. 문서 유형

첫 버전의 문서 유형은 기존 Evidence Pack 8종과 맞춘다.

| 유형 | 목적 | 주요 분석 신호 |
|------|------|----------------|
| PRD / Requirements | 무엇을 만들지 정의 | progress, scope, acceptance |
| Roadmap | 언제 무엇을 할지 정의 | progress, watchNext, drift |
| Backlog | 실행 단위와 우선순위 정의 | progress, blocker, watchNext |
| Sprint Plan | 단기 실행 계획 정의 | progress, blocker |
| Decision Log / ADR | 방향 변경과 결정 근거 기록 | drift, risk |
| Technical Design / RFC | 구현 구조와 기술 선택 설명 | risk, blocker, drift |
| Risk / Issue / Dependency Log | 위험과 의존성 추적 | risk, blocker |
| Release / Ops Learning | 출시 결과와 운영 학습 기록 | progress, risk, watchNext |

## 5. UX 구조

권장 경로는 `/projects/[id]/documents`다.

페이지는 두 영역으로 구성한다.

```text
/projects/[id]/documents
├─ Evidence Overview
│  ├─ readiness score
│  ├─ applied documents count
│  ├─ stale documents count
│  └─ refresh state action
└─ Document Workspace
   ├─ document type list
   ├─ selected document preview/editor
   ├─ template seed action
   ├─ save draft action
   └─ apply to analysis toggle/action
```

첫 화면에서 사용자가 바로 알아야 할 것은 “문서를 예쁘게 작성했는지”가 아니다. 지금 프로젝트 상태 판단이 어떤 근거에 의존하고 있고, 어떤 근거가 비어 있는지다.

## 6. 사용자 흐름

### Flow A. 새 프로젝트 등록 후 문서 초안 만들기

```text
Project detail -> Documents
  -> PRD는 existing plan에서 imported
  -> Roadmap, Risk Log는 missing
  -> User selects Roadmap
  -> Create from template
  -> Customize content
  -> Save draft
  -> Apply to analysis
```

### Flow B. 분석 결과가 약할 때 문서 보강하기

```text
State page shows weak evidence
  -> Documents
  -> Evidence Overview highlights missing Backlog and Decision Log
  -> User edits documents
  -> Apply to analysis
  -> Refresh state
```

### Flow C. 방향 변경을 설명 가능하게 만들기

```text
Drift page shows direction changed
  -> Documents
  -> Decision Log missing or stale
  -> User records decision
  -> Apply to analysis
  -> Next snapshot cites decision as drift evidence
```

## 7. 데이터 모델

권장 신규 테이블은 `project_documents`다.

```text
project_documents
├─ id uuid primary key
├─ project_id uuid references projects(id)
├─ document_type text
├─ title text
├─ status text
├─ content_markdown text
├─ is_applied boolean
├─ readiness text
├─ related_links_json jsonb
├─ analysis_signals_json jsonb
├─ last_used_snapshot_id uuid null
├─ created_at timestamptz
└─ updated_at timestamptz
```

초기 `document_type` 값은 다음으로 제한한다.

```text
prd
roadmap
backlog
sprint_plan
decision_log
technical_design
risk_log
release_ops_learning
```

초기 `status` 값은 다음으로 제한한다.

```text
draft
active
superseded
archived
```

초기 `readiness` 값은 다음으로 제한한다.

```text
missing
draft
usable
stale
```

## 8. 저장과 적용의 의미

문서 편집에서 가장 중요한 제품 결정은 저장과 적용을 분리하는 것이다.

- Save Draft.
  사용자가 편집한 내용을 저장하지만 분석 입력으로 쓰지 않을 수 있다.

- Apply to Analysis.
  다음 refresh에서 해당 문서를 상태 판단 근거로 사용한다.

- Mark Superseded.
  오래된 결정이나 계획을 보존하되 현재 판단 근거에서는 제외한다.

이 분리는 사용자가 실험적으로 문서를 고쳐도 분석 결과가 즉시 흔들리지 않게 한다.

## 9. 분석 파이프라인 변경

`refreshProjectState`는 현재 project, current plan, GitHub 활동을 중심으로 입력을 구성한다. 기능 추가 후에는 applied document 목록을 함께 읽어야 한다.

권장 입력 우선순위는 다음과 같다.

1. Project thesis.
2. Applied PRD 또는 current plan.
3. Applied roadmap, backlog, sprint plan.
4. Applied decision log, technical design, risk log.
5. GitHub commits, PRs, issues.
6. Previous snapshot.

분석 결과에는 문서 사용 흔적을 남겨야 한다.

```text
raw_output_json.documentCoverage
├─ appliedDocumentTypes
├─ missingDocumentTypes
├─ staleDocumentTypes
└─ citedDocumentIds
```

`state_snapshots.evidence_json`에는 문서 evidence도 포함한다.

```json
{
  "type": "document",
  "title": "Risk / Issue / Dependency Log",
  "ref": "project_documents:{id}"
}
```

## 10. UI 컴포넌트 전제

첫 구현에 필요한 컴포넌트는 작게 잡는다.

| 컴포넌트 | 역할 |
|----------|------|
| `ProjectDocumentsPage` | 인증, 프로젝트 접근 확인, 데이터 로드 |
| `DocumentCoverageGrid` | 8종 문서 readiness 표시 |
| `ProjectDocumentEditor` | markdown 편집, 저장, 적용 |
| `DocumentTemplatePanel` | 문서 유형별 기본 초안 표시 |
| `DocumentAnalysisSignals` | 해당 문서가 영향을 주는 상태 판단 표시 |

편집기는 처음부터 block editor가 아니어도 된다. 현재 제품의 markdown plan 입력 방식과 일관되게 textarea 기반으로 시작하는 것이 맞다.

## 11. 구현 순서

권장 구현 순서는 다음과 같다.

1. DB migration 추가.
   `project_documents` 테이블, 인덱스, RLS policy를 추가한다.

2. 타입과 데이터 접근 함수 추가.
   `ProjectDocument`, document type enum, list/upsert/apply 함수를 추가한다.

3. 문서 템플릿 상수 추가.
   기존 `doc/designs/evidence-pack` 내용을 제품용 seed template으로 옮긴다.

4. 서버 액션 추가.
   create from template, save document, apply document, mark superseded를 추가한다.

5. `/projects/[id]/documents` 페이지 추가.
   문서 카드, 상세 편집, 저장/적용 액션을 만든다.

6. 프로젝트 상세 페이지에서 Documents 링크 추가.
   state page의 evidence 약함 안내와 연결한다.

7. refresh pipeline 연결.
   applied documents를 분석 입력에 포함하고 snapshot evidence에 반영한다.

8. 테스트와 검증 추가.
   document utility 단위 테스트와 페이지 smoke 검증을 추가한다.

## 12. MVP에서 제외할 것

첫 버전에서 제외할 항목은 명확하다.

- Notion식 block editor.
- 실시간 협업 편집.
- 문서 diff viewer.
- 승인 워크플로우.
- 외부 Notion, Google Docs, Linear 동기화.
- 문서별 댓글.
- AI 자동 작성 전체 워크플로우.

이들은 나중에 필요할 수 있지만, 지금은 상태 분석 품질을 높이는 핵심 경로와 무관한 비용이 크다.

## 13. 성공 기준

첫 버전은 다음 기준을 만족하면 충분하다.

- 사용자가 프로젝트별 Evidence 문서 8종의 상태를 볼 수 있다.
- 사용자가 각 문서를 템플릿에서 생성하고 수정하고 저장할 수 있다.
- 사용자가 저장된 문서를 분석에 적용하거나 제외할 수 있다.
- Refresh state가 applied 문서를 읽고 snapshot evidence에 반영한다.
- State page에서 분석 근거가 문서와 GitHub 활동으로 구분되어 보인다.

## 14. 권장 결론

이 기능은 “문서 관리”라는 이름보다 “Evidence 관리”로 설계해야 한다.

사용자의 최종 목표는 문서를 많이 쓰는 것이 아니라 프로젝트 상태 판단을 더 정확하고 설명 가능하게 만드는 것이다. 따라서 UI, 데이터 모델, 분석 파이프라인 모두 문서 작성량이 아니라 상태 판단 근거의 품질을 중심으로 설계해야 한다.

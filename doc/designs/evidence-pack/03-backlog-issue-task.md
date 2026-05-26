# Evidence Document 03. Backlog / Issue / Task

> 대상 제품: Synapso.dev Project Memory
> 문서 역할: 실제 실행 작업 단위
> 상태 판단 영향: progress, blocker, risk, drift, watchNext, evidence

## 1. 역할 분석

Backlog는 실행의 원자 단위다.

PRD와 roadmap은 의도를 설명하지만, backlog는 실제로 손댄 작업과 남은 작업을 보여준다. 에이전트는 backlog를 통해 어떤 작업이 완료됐고, 무엇이 막혔고, 계획에 없던 일이 생겼는지 판단한다.

GitHub issue를 가져올 수 있다면 이 문서는 GitHub에서 자동으로 일부 채워질 수 있다. 그래도 사람이 직접 적는 "Scope Alignment"는 필요하다. GitHub issue 제목만으로는 왜 이 일이 생겼는지 알 수 없는 경우가 많다.

## 2. 언제 쓰는가

- 프로젝트의 작업 목록을 관리할 때.
- GitHub issue를 사용하지 않거나 issue 품질이 낮을 때.
- PRD 대비 실제 작업이 얼마나 진행됐는지 보고 싶을 때.
- 막힌 작업과 다음 작업을 명확히 해야 할 때.

## 3. 에이전트가 읽어야 할 핵심 신호

| 신호 | 읽는 위치 | 판단 |
|------|-----------|------|
| progress | Work Items status | done 비율과 핵심 작업 완료 여부 |
| blocker | Blocked Items | 실제 진행을 막는 작업 |
| risk | 오래 남은 P0/P1 | 일정 또는 품질 위험 |
| drift | Scope Alignment | PRD에 없던 새 작업 |
| watchNext | P0/P1 not_started | 다음 우선 작업 |
| evidence | issue, PR, commit | 실행 근거 |

## 4. 초안

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
- Related issues:
- Related PRs:
- Related commits:
- Related snapshots:

## 6. Agent Reading Notes
- Status와 Priority를 progress와 watchNext 계산에 사용한다.
- Blocker가 있으면 blockerCount 후보로 본다.
- PRD에 없는 새 작업은 scope drift 후보로 본다.
```

## 5. 좋은 예의 기준

- 작업마다 상태가 있다.
- P0/P1의 기준이 명확하다.
- blocker가 별도 섹션으로 분리돼 있다.
- PRD에 없는 작업이 숨겨지지 않는다.

## 6. 나쁜 예의 신호

- 작업이 너무 커서 하루나 이틀 단위로 판단할 수 없다.
- blocker가 메모에 묻혀 있다.
- 완료 작업에 evidence가 없다.
- 새 작업이 scope drift인지 정상 추가인지 알 수 없다.

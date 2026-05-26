# Evidence Document 05. Decision Log / ADR

> 대상 제품: Synapso.dev Project Memory
> 문서 역할: 의사결정과 기술 선택의 이유 보존
> 상태 판단 영향: drift, blocker, risk, watchNext, evidence

## 1. 역할 분석

Decision Log와 ADR은 "왜 이렇게 했는가"를 남기는 문서다.

프로젝트에서 가장 빨리 사라지는 정보는 작업 목록이 아니라 결정의 이유다. 에이전트가 drift를 제대로 잡으려면 어떤 결정이 accepted였고, 어떤 결정이 superseded됐는지 알아야 한다.

ADR은 기술 결정에 더 가깝고, Decision Log는 제품/운영 결정까지 포함한다. 초기 제품에서는 둘을 하나의 문서 타입으로 묶어도 된다. 나중에 사용량이 늘면 분리한다.

## 2. 언제 쓰는가

- 아키텍처나 API 같은 되돌리기 비싼 결정을 할 때.
- 제품 방향이나 scope가 바뀔 때.
- 열린 결정 때문에 작업이 막힐 때.
- 나중에 "왜 이렇게 했지?"를 물을 가능성이 있을 때.

## 3. 에이전트가 읽어야 할 핵심 신호

| 신호 | 읽는 위치 | 판단 |
|------|-----------|------|
| drift | Status, Consequences | 기준 결정이 바뀌었는지 |
| blocker | proposed 상태의 결정 | 미결정으로 막힌 일 |
| risk | Consequences, Review Trigger | 결정 실패 신호 |
| watchNext | Review Trigger | 재검토 조건 |
| evidence | issue, PR, commit | 결정 근거 |

## 4. 초안

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
- Related issues:
- Related PRs:
- Related commits:
- Related snapshots:

## 8. Agent Reading Notes
- accepted 결정은 현재 기준선으로 사용한다.
- superseded 결정은 drift 근거로 사용한다.
- proposed 결정이 오래 열려 있으면 blocker 후보로 본다.
```

## 5. 좋은 예의 기준

- 버린 대안과 이유가 있다.
- 되돌림 비용이 적혀 있다.
- 재검토 조건이 있다.
- 관련 PR이나 issue가 연결돼 있다.

## 6. 나쁜 예의 신호

- "그냥 이게 나아 보여서" 수준의 근거만 있다.
- decision status가 없다.
- 선택하지 않은 대안이 없다.
- superseded된 결정이 남아 있는데 current plan이 업데이트되지 않았다.

# Evidence Document 02. Roadmap / Milestone Plan

> 대상 제품: Synapso.dev Project Memory
> 문서 역할: 프로젝트의 시간축과 단계 계획
> 상태 판단 영향: currentPhase, progress, risk, blocker, drift, watchNext

## 1. 역할 분석

Roadmap은 무엇을 언제 어떤 순서로 만들지 보여준다.

PRD가 "무엇을 만들 것인가"라면, roadmap은 "어떤 순서로 현실화할 것인가"다. 에이전트는 이 문서를 기준으로 현재 단계, 지연, 다음 milestone, 계획 순서 변경을 판단한다.

Roadmap이 없으면 프로젝트는 할 일 목록처럼 보인다. 할 일은 많은데 방향 감각이 사라진다.

## 2. 언제 쓰는가

- 프로젝트가 2개 이상의 단계로 나뉠 때.
- 진행률이 단순 체크리스트보다 시간축을 필요로 할 때.
- milestone별 출시 또는 검증이 있을 때.
- "지금 어느 단계인가"를 상태판에 보여줘야 할 때.

## 3. 에이전트가 읽어야 할 핵심 신호

| 신호 | 읽는 위치 | 판단 |
|------|-----------|------|
| currentPhase | Current Milestone | 현재 단계명 |
| progress | Milestones status | 완료된 단계와 남은 단계 |
| risk | Target Date, Dependencies | 날짜 지연 또는 불명확한 의존성 |
| blocker | Blocking dependency | 진행을 막는 선행 조건 |
| drift | Changes Since Last Update | 계획 순서나 목표 변경 |
| watchNext | Next Milestone | 다음 집중 항목 |

## 4. 초안

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
```

## 5. 좋은 예의 기준

- 각 milestone에 완료 기준이 있다.
- 현재 milestone이 명확하다.
- 변경 이력이 남아 있다.
- 의존성과 fallback이 적혀 있다.

## 6. 나쁜 예의 신호

- 날짜만 있고 성공 기준이 없다.
- 모든 항목이 "진행 중"이다.
- roadmap 변경 이유가 없다.
- milestone이 PRD scope와 연결되지 않는다.

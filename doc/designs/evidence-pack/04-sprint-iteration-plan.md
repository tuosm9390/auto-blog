# Evidence Document 04. Sprint / Iteration Plan

> 대상 제품: Synapso.dev Project Memory
> 문서 역할: 짧은 주기의 실행 약속
> 상태 판단 영향: currentPhase, progress, blocker, risk, drift, watchNext

## 1. 역할 분석

Sprint Plan은 이번 cycle에 무엇을 끝낼지 정하는 짧은 계획이다.

Roadmap은 긴 시간축이고, backlog는 전체 작업 목록이다. Sprint Plan은 그 사이에서 "이번 주에 실제로 무엇을 약속했는가"를 보여준다. 에이전트는 이 문서를 통해 현재 작업 집중도와 반복 carry-over를 판단한다.

솔로 빌더도 sprint라는 이름이 부담스러우면 weekly plan으로 쓰면 된다. 이름이 중요한 게 아니다. 짧은 주기 약속이 중요하다.

## 2. 언제 쓰는가

- 주간/격주 단위로 작업을 끊고 싶을 때.
- backlog가 커져서 이번 cycle의 집중 범위가 필요할 때.
- carry-over가 반복되는지 보고 싶을 때.
- 현재 실행이 roadmap과 맞는지 점검할 때.

## 3. 에이전트가 읽어야 할 핵심 신호

| 신호 | 읽는 위치 | 판단 |
|------|-----------|------|
| currentPhase | Iteration Window, Sprint Goal | 현재 실행 단계 |
| progress | Selected Work | 이번 cycle 완료율 |
| blocker | Daily Risks, blocked items | 즉시 풀어야 할 막힘 |
| risk | Carry-over | 반복 지연 위험 |
| drift | Sprint Goal Alignment | 장기 계획과 다른 실행 |
| watchNext | 남은 selected work | 다음 작업 |

## 4. 초안

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
```

## 5. 좋은 예의 기준

- 이번 cycle 목표가 하나의 문장으로 명확하다.
- 선택 작업 수가 현실적이다.
- carry-over 이유가 적혀 있다.
- 이번에 하지 않을 일이 명시돼 있다.

## 6. 나쁜 예의 신호

- sprint가 backlog 전체 복사본이다.
- 완료 기준 없이 작업명만 있다.
- 반복 carry-over가 기록되지 않는다.
- roadmap과 연결되지 않는다.

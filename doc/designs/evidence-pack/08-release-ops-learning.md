# Evidence Document 08. Release / Changelog / Runbook / Postmortem

> 대상 제품: Synapso.dev Project Memory
> 문서 역할: 출시 결과와 운영 학습 보존
> 상태 판단 영향: progress, drift, risk, blocker, watchNext, evidence

## 1. 역할 분석

Release와 운영 학습 문서는 실제로 사용자에게 무엇이 나갔고, 운영 중 무엇을 배웠는지 보존한다.

계획상 완료와 실제 출시 완료는 다르다. PRD 체크리스트가 끝났어도 배포되지 않았으면 사용자 가치는 아직 발생하지 않았다. 반대로 계획에 없던 것이 배포됐다면 scope drift일 수 있다.

Runbook과 Postmortem은 운영 성숙도를 보여준다. 장애가 있었는데 학습이 남지 않으면 같은 문제가 반복된다.

## 2. 언제 쓰는가

- 기능이 사용자에게 배포됐을 때.
- release note나 changelog가 필요할 때.
- rollback이나 smoke test가 필요한 배포일 때.
- 장애, 실패한 배포, 데이터 문제, 외부 API 문제를 겪었을 때.

## 3. 에이전트가 읽어야 할 핵심 신호

| 신호 | 읽는 위치 | 판단 |
|------|-----------|------|
| progress | Shipped Items | 계획한 일이 실제 배포됐는지 |
| drift | Planned? | 계획에 없던 출시 항목 |
| risk | Rollout Plan, Runbook | 운영 위험 |
| blocker | rollout issue | 출시를 막는 문제 |
| watchNext | postmortem action item | 후속 조치 |
| evidence | release, PR, commit, incident | 출시 근거 |

## 4. 초안

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
- Release:
- Related PRs:
- Related commits:
- Related incidents:
- Related snapshots:

## 8. Agent Reading Notes
- Planned가 no인 shipped item은 scope drift 후보로 본다.
- rollback 조건이나 runbook이 비어 있으면 operational risk 후보로 본다.
- postmortem action item은 watchNext 후보로 본다.
```

## 5. 좋은 예의 기준

- 배포된 항목과 계획 여부가 분리돼 있다.
- 사용자 영향이 적혀 있다.
- rollback 조건이 있다.
- incident가 있으면 action item이 있다.

## 6. 나쁜 예의 신호

- "배포 완료"만 있고 무엇이 나갔는지 없다.
- planned 여부가 없다.
- known issue가 숨겨져 있다.
- postmortem이 원인 없이 사과문처럼 끝난다.

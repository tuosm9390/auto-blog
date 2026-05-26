# Evidence Document 01. PRD / Requirements

> 대상 제품: Synapso.dev Project Memory
> 문서 역할: 프로젝트의 제품 기준선
> 상태 판단 영향: progress, drift, risk, watchNext, evidence

## 1. 역할 분석

PRD는 프로젝트가 무엇을 만들기로 했는지 고정하는 기준 문서다.

에이전트는 PRD를 읽고 다음을 판단한다.

- 원래 목표가 무엇이었는가.
- 이번 버전에서 포함하기로 한 범위와 제외하기로 한 범위가 무엇인가.
- 완료됐다고 볼 수 있는 기준이 있는가.
- 현재 GitHub 활동과 스냅샷이 이 기준선에서 벗어났는가.

PRD가 약하면 `progress_percent`는 믿기 어려워진다. 완료 기준이 없으면 에이전트는 커밋 수나 문장 분위기로 진행률을 추정하게 된다. 그건 제품이 아니라 점쟁이다. 별로다.

## 2. 언제 쓰는가

- 새 프로젝트를 등록할 때.
- 큰 기능을 시작할 때.
- 기존 프로젝트의 방향이 바뀌었을 때.
- 상태 스냅샷의 drift 판단 기준이 불명확할 때.

## 3. 에이전트가 읽어야 할 핵심 신호

| 신호 | 읽는 위치 | 판단 |
|------|-----------|------|
| progress | Acceptance Criteria | 완료 기준 중 충족된 항목 |
| drift | Scope, Out of Scope | 현재 작업이 원래 범위와 다른지 |
| risk | Risks and Open Questions | 성공을 위협하는 가정 |
| watchNext | 미완료 기준, 열린 질문 | 다음에 확인할 작업 |
| evidence | 관련 issue, PR, commit | 판단 근거 링크 |

## 4. 초안

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
```

## 5. 좋은 예의 기준

- 목표가 사용자의 변화로 쓰여 있다.
- 완료 기준이 체크박스로 검증 가능하다.
- 제외 범위가 명확하다.
- 열린 질문이 숨겨져 있지 않다.

## 6. 나쁜 예의 신호

- "좋은 UX 제공"처럼 판정할 수 없는 목표만 있다.
- 완료 기준이 없다.
- scope와 roadmap이 섞여 있다.
- 이미 바뀐 방향이 PRD에 반영되지 않았다.

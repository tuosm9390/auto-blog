# Evidence Document 07. Risk / Issue / Dependency Log

> 대상 제품: Synapso.dev Project Memory
> 문서 역할: 위험, 실제 문제, 의존성 관리
> 상태 판단 영향: blocker, risk, watchNext, drift, evidence

## 1. 역할 분석

Risk, Issue, Dependency Log는 프로젝트가 왜 막히는지 설명한다.

Risk는 아직 발생하지 않은 위험이다. Issue는 이미 발생한 문제다. Dependency는 내가 혼자 통제하지 못하는 선행 조건이다. 셋은 다르지만 상태판에서는 함께 봐야 한다. 사용자는 taxonomy를 보러 오는 게 아니라 지금 무엇이 위험한지 보러 온다.

에이전트는 이 문서를 읽고 blockerCount, riskCount, watchNext를 더 정확히 만든다.

## 2. 언제 쓰는가

- 일정이나 품질 위험이 보일 때.
- 외부 API, 고객 피드백, 승인, 결제, 인증 같은 의존성이 있을 때.
- 분석 스냅샷이 반복적으로 blocker/risk를 뽑는데 근거가 약할 때.
- 해결된 문제와 남은 문제를 구분해야 할 때.

## 3. 에이전트가 읽어야 할 핵심 신호

| 신호 | 읽는 위치 | 판단 |
|------|-----------|------|
| blocker | Active Issues, Dependencies | 현재 막힌 일 |
| risk | Risks | 확률과 영향 |
| watchNext | Next Action | 바로 해야 할 대응 |
| drift | risk 대응으로 바뀐 scope | 위험 때문에 계획이 바뀌었는지 |
| evidence | issue, PR, incident | 위험 근거 |

## 4. 초안

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
- Related issues:
- Related PRs:
- Related external links:
- Related snapshots:

## 7. Agent Reading Notes
- Blocking이 yes인 dependency는 blocker 후보로 본다.
- Probability와 Impact가 high인 risk는 riskCount에 강하게 반영한다.
- Mitigation 없는 high risk는 watchNext 후보로 본다.
```

## 5. 좋은 예의 기준

- risk와 issue가 분리돼 있다.
- 각 항목에 owner와 next action이 있다.
- high risk에는 mitigation이 있다.
- blocking dependency에는 fallback이 있다.

## 6. 나쁜 예의 신호

- "조금 위험함" 같은 애매한 표현만 있다.
- owner가 없다.
- resolved 항목이 정리되지 않는다.
- dependency가 실제 blocker인지 그냥 참고사항인지 불명확하다.

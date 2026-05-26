# Evidence Document 06. Technical Design / RFC

> 대상 제품: Synapso.dev Project Memory
> 문서 역할: 구현 전 기술 설계와 검토 기록
> 상태 판단 영향: risk, blocker, drift, progress, evidence

## 1. 역할 분석

Technical Design과 RFC는 구현 전에 기술적으로 무엇을 어떻게 만들지 검토하는 문서다.

에이전트는 이 문서를 읽고 설계가 충분한지, 보안과 에러 경로가 빠졌는지, 실제 구현이 설계와 달라졌는지 판단한다. PRD가 제품 의도를 고정한다면 RFC는 구현 경로를 고정한다.

이 문서는 모든 작은 작업에 필요하지 않다. 데이터 모델, API, 인증, 외부 연동, AI 분석 파이프라인처럼 틀리면 복구 비용이 큰 작업에 필요하다.

## 2. 언제 쓰는가

- 새 API, 새 DB 테이블, 새 background flow가 생길 때.
- AI 프롬프트나 분석 스키마가 바뀔 때.
- 보안 경계나 RLS가 바뀔 때.
- 배포 순서와 rollback이 필요한 변경을 할 때.

## 3. 에이전트가 읽어야 할 핵심 신호

| 신호 | 읽는 위치 | 판단 |
|------|-----------|------|
| risk | Error Paths, Security, Rollout | 설계 누락 위험 |
| blocker | Interfaces, Open Questions | 구현 전 결정 필요 |
| drift | Proposed Design vs PR diff | 구현이 설계와 다른지 |
| progress | Test Plan, implementation evidence | 설계 항목 구현 여부 |
| evidence | PR, migration, test | 기술 근거 |

## 4. 초안

```markdown
# Technical Design / RFC

## Metadata
- Title:
- Type: technical-design
- Status: draft/reviewed/accepted/superseded
- Owner:
- Date:
- Source: manual
- Related Links:

## 1. Problem
- 어떤 기술 문제를 해결하는가.
- 이 설계가 필요한 제품 목표.

## 2. Proposed Design
- 핵심 접근.
- 새로 생기는 컴포넌트.
- 기존 컴포넌트와의 관계.

## 3. Data Flow
- Input -> Validation -> Transform -> Persist -> Output

## 4. Interfaces
- New API:
- Changed API:
- Stored Data:
- External Service Calls:

## 5. Error Paths
| Failure | Expected Handling | User Sees | Logged |
|---------|-------------------|-----------|--------|
| | | | |

## 6. Security
- 누가 호출할 수 있는가.
- 어떤 데이터에 접근하는가.
- IDOR, RLS, secret 관련 위험.

## 7. Test Plan
- Unit:
- Integration:
- E2E:
- Failure cases:

## 8. Rollout and Rollback
- 배포 순서.
- feature flag 필요 여부.
- rollback 방법.

## 9. Evidence
- Related issues:
- Related PRs:
- Related commits:
- Related migrations:

## 10. Agent Reading Notes
- Error Paths와 Test Plan이 비어 있으면 risk 후보로 본다.
- Proposed Design과 실제 PR diff가 다르면 technical drift 후보로 본다.
- Security가 비어 있으면 high-risk 신호로 본다.
```

## 5. 좋은 예의 기준

- 데이터 흐름이 한 줄 이상으로 명확하다.
- 실패 경로가 이름으로 적혀 있다.
- 테스트 범위가 구체적이다.
- 배포와 rollback이 있다.

## 6. 나쁜 예의 신호

- "에러 처리"라고만 쓰여 있다.
- 누가 호출할 수 있는지 없다.
- 새 데이터가 어디 저장되는지 없다.
- 구현 후 설계 문서가 업데이트되지 않았다.

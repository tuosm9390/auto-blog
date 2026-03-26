Date: 2026-03-19 14:30:00
Author: Antigravity

# ⚙️ 작업 절차 및 워크플로우 (v0.6.0)

## 1. 개발 주기 (Lifecycle)

- **Research -> Strategy -> Execution**의 3단계 주기를 엄격히 따릅니다.
- 코드 수정 전 `doc/results/` 하위에 분석 리포트와 구현 계획서를 작성하여 설계 무결성을 확보합니다.
- 구현 단계에서는 **Plan-Act-Validate** 사이클을 반복하여 실수를 최소화합니다.

## 2. TDD (Test-Driven Development)

- 기능적 변경이 동반되는 작업은 반드시 테스트 코드를 작성하거나 기존 테스트를 통과해야 합니다.
- `tests/integration/` 하위의 워크플로우 테스트를 통해 전체 시스템의 안정성을 검증합니다.

## 3. Git 컨벤션 (Commits)

- **Conventional Commits**: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `security:` 등의 접두사를 필수로 사용합니다.
- **Why over What**: 커밋 메시지에는 '무엇을' 했는지보다 '왜' 했는지와 그에 따른 '영향'을 명시합니다.
- **Issue Reference**: 가능한 경우 관련 이슈 번호를 커밋 메시지에 포함합니다.

### AI 분석에 최적화된 커밋 메시지 형식

AI(Claude 등)가 git history를 분석할 때 변경 의도와 영향 범위를 즉시 파악할 수 있도록 아래 형식을 엄수합니다.

```
<type>(<scope>): <한 줄 요약 — 무엇을, 왜>

- <변경 파일/레이어>: <구체적 변경 내용>
- <변경 파일/레이어>: <구체적 변경 내용>

Why: <이 변경이 필요했던 근본 원인 또는 비즈니스 맥락>
Impact: <영향 범위 — 어느 기능/사용자 흐름에 영향을 주는지>
```

**type 선택 기준**

| type | 사용 시점 |
|---|---|
| `feat` | 새 기능 추가 |
| `fix` | 버그 수정 |
| `security` | CSP, RLS, 인증 등 보안 관련 변경 |
| `refactor` | 동작 변경 없는 코드 개선 |
| `docs` | 문서·주석 변경 |
| `chore` | 빌드·설정·의존성 변경 |
| `perf` | 성능 개선 |

**scope 선택 기준**: 변경된 도메인 또는 레이어 (`billing`, `auth`, `csp`, `api`, `ui`, `db` 등)

**예시**
```
security(csp): allow PortOne/TossPayments domains to unblock payment flow

- next.config.ts: script-src에 cdn.portone.io 추가
- next.config.ts: connect-src에 *.portone.io, *.iamport.co, *.tosspayments.com 추가
- next.config.ts: frame-src 디렉티브 신규 추가 (결제 팝업 iframe 허용)

Why: PortOne V2 SDK가 cdn.portone.io에서 스크립트를 동적 로드하고
     iamport.co(구 도메인) 및 tosspayments.com을 PG 서브도메인으로 사용하나
     기존 CSP에 해당 도메인이 누락되어 결제 플로우 전체가 차단됨
Impact: 프라이싱 페이지의 구독 결제 버튼 정상 동작
```

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

- **Conventional Commits**: `feat:`, `fix:`, `refactor:`, `docs:` 등의 접두사를 필수로 사용합니다.
- **Why over What**: 커밋 메시지에는 '무엇을' 했는지보다 '왜' 했는지와 그에 따른 '영향'을 명시합니다.
- **Issue Reference**: 가능한 경우 관련 이슈 번호를 커밋 메시지에 포함합니다.

# 결제 시스템 제거 실행 계획

## 목표

프로젝트에서 결제, 구독, PortOne, Stripe 관련 기능 표면을 제거하고, 더 이상 라우트, UI, 의존성, 문서 지침에 결제 기능이 남지 않도록 검증한다.

## 범위

- 제거 대상은 런타임 코드, 라우트, UI 링크, 설정, 직접 의존성, AGENTS/CLAUDE/GEMINI/RULES/README/DESCRIPTION/TODOS의 현재 기능 설명이다.
- `.env.local`은 로컬 secret 파일이므로 직접 삭제하지 않는다.
- `project_plans`, `planProgress`, `sprint_plan`은 결제 플랜이 아니라 프로젝트 계획 도메인이므로 제거 대상이 아니다.
- 기존 DB 컬럼 제거 마이그레이션은 실제 운영 DB 삭제가 필요하므로 이번 코드 작업에서는 결제 기능을 참조하는 마이그레이션 스크립트를 제거하고, 운영 DB 정리는 별도 승인 작업으로 남긴다.

## 성공 기준

| ID | 자동 테스트 | 실제 QA 채널 | PASS 기준 |
| --- | --- | --- | --- |
| C001 | `tests/payment-removal.test.ts`의 `removes payment api route files` | HTTP call | 결제 API 네 경로가 dev server에서 404 |
| C002 | `tests/payment-removal.test.ts`의 `removes payment UI surfaces` | Browser use | 설정과 관리자 화면에 결제/구독 링크와 텍스트 없음 |
| C003 | `tests/payment-removal.test.ts`의 `removes payment dependencies and config` | tmux CLI | PortOne dependency 없음, lint/build/test 통과, static scan 허용 목록 외 결제 잔재 없음 |

## Wave 1 테스트 우선

- `tests/payment-removal.test.ts`를 추가한다.
- 현재 코드에서 결제 라우트 파일, PortOne dependency, UI 파일, config/doc 잔재가 존재하므로 RED가 나와야 한다.
- RED 증거는 `.omo/ulw-loop/evidence/red-payment-removal.txt`에 저장한다.

## Wave 2 구현

- 결제 라우트와 서비스 파일을 삭제한다.
- 설정 페이지에서 `/api/subscription` fetch와 `BillingSection` 렌더링을 제거한다.
- 관리자 구독 페이지와 관련 nav 링크를 제거한다.
- pricing 라우트와 PortOne client를 제거하고 인증 공개 경로에서 `/pricing`을 제거한다.
- `next.config.ts`의 결제 CSP와 payment permission을 제거하고 `vercel.json` cron을 제거한다.
- `package.json`과 lockfile에서 PortOne 직접 의존성을 제거한다.
- 타입과 profile 모델에서 결제 전용 타입과 필드를 제거한다.
- AGENTS/CLAUDE/GEMINI/RULES/README/DESCRIPTION/TODOS의 현재 결제 기능 설명을 제거하거나 과거 이력으로 축소한다.

## Wave 3 검증

- `npx vitest run tests/payment-removal.test.ts`.
- `npm run lint`.
- `npm run build`.
- HTTP QA는 `curl -i`로 네 결제 API 경로를 확인한다.
- Browser QA는 실제 브라우저로 `/ko/settings`, `/ko/admin-portal-v5-secret`을 확인한다.
- tmux QA는 dependency와 static scan 결과를 캡처한다.

## 병렬화

테스트 작성 후 구현은 독립 파일군별로 병렬 가능하다.

| Task | Depends on | Blocks |
| --- | --- | --- |
| API와 lib 삭제 | RED 테스트 | build, HTTP QA |
| UI와 messages 정리 | RED 테스트 | Browser QA |
| dependency와 config 정리 | RED 테스트 | tmux QA, build |
| 문서와 AGENTS 정리 | RED 테스트 | static scan |

최종 리뷰와 QA는 모든 구현이 합쳐진 뒤 직렬로 실행한다.

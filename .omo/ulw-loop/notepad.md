# 결제 시스템 제거 ULW 노트

## 요청

결제시스템 관련된 모든 내용을 삭제한다. 이 프로젝트에서는 더 이상 결제 기능을 사용하지 않는다.

## 사용 스킬

- `omo:ulw-loop`: 증거 기반 목표 루프와 QA ledger 관리에 사용한다.
- `backend-development-feature-development`: API, 서버 서비스, 설정, 프론트 표면이 함께 바뀌는 다단계 기능 제거 작업이라 TDD 단계 분해에 사용한다.
- `api-patterns`: 결제 API 제거 후 남은 API 표면이 404/비노출 상태인지 확인하는 기준에 사용한다.
- `codebase-cleanup-refactor-clean`: 결제 코드, dead import, dependency 제거를 작고 되돌릴 수 있는 단위로 정리하는 데 사용한다.
- `dependency-management-deps-audit`: PortOne 패키지 제거와 lockfile 검증에 사용한다.
- `code-reviewer`: 최종 diff의 보안, 잔재, 유지보수 리스크 확인에 사용한다.
- `careful`: 다중 파일 삭제가 포함되어 삭제 범위 통제에 사용한다.

## 현재 관찰

- 기존 worktree는 clean이다.
- `app/api/portone`, `app/api/subscription`, `app/api/webhooks/portone`, `app/api/cron/billing` 라우트가 결제 표면이다.
- `app/[locale]/pricing/page.tsx`는 이미 `/`로 redirect하지만 `PricingClient.tsx`는 PortOne SDK를 import한다.
- `components/settings/BillingSection.tsx`는 `return null` 뒤에 결제 UI 코드가 남아 있다.
- `app/[locale]/settings/page.tsx`는 `/api/subscription`을 fetch하고 `BillingSection`을 렌더링한다.
- `vercel.json`은 `/api/cron/billing` cron을 등록한다.
- `next.config.ts` CSP에 PortOne, iamport, TossPayments 도메인이 남아 있다.
- `package.json`에는 `@portone/browser-sdk`, `@portone/server-sdk`가 직접 의존성으로 남아 있다.

## 성공 기준 초안

- C001. 결제 API 표면이 삭제되고 해당 URL이 실제 dev server에서 404를 반환한다.
- C002. 설정과 관리자 UI에서 구독 및 결제 화면, 링크, fetch가 사라진다.
- C003. 빌드 산출과 dependency graph에서 PortOne, Stripe 결제 코드가 사라지고 프로젝트 핵심 기능 테스트는 유지된다.
- C004. 문서와 AGENTS 지침에서 현재 기능으로서의 결제 안내가 제거된다.

## QA 시나리오 초안

- C001 HTTP call: `curl -i http://127.0.0.1:<port>/api/subscription`, `curl -i http://127.0.0.1:<port>/api/portone/billing-key`, `curl -i http://127.0.0.1:<port>/api/webhooks/portone`, `curl -i http://127.0.0.1:<port>/api/cron/billing` 모두 404.
- C002 Browser use: `/ko/settings`와 `/ko/admin`을 열어 결제/구독 링크나 텍스트가 없는지 확인.
- C003 tmux: `npm ls @portone/browser-sdk @portone/server-sdk`가 missing으로 실패하고 `rg`가 활성 결제 코드 잔재를 찾지 못한다.
- C004 tmux: `rg` 기반 문서 스캔에서 PortOne, Stripe, billing route, pricing route 지침 잔재가 허용 목록 외에 없다.

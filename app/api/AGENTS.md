# API ROUTE KNOWLEDGE

## OVERVIEW

`app/api`는 Next.js Route Handler 기반의 인증, 프로젝트, GitHub, 구독, PortOne 웹훅 경계다.

## WHERE TO LOOK

| Task | Location | Notes |
| --- | --- | --- |
| NextAuth handler | `auth/[...nextauth]/route.ts` | 실제 설정은 루트 `auth.ts` |
| 프로젝트 목록과 생성 | `projects/route.ts` | `requireAuth`, Zod schema 사용 |
| 프로젝트 상세과 수정 | `projects/[id]/route.ts` | `requireProjectOwnership` 선행 |
| 상태 refresh | `projects/[id]/refresh/route.ts` | access token, locale, source window 검증 |
| drift 조회 | `projects/[id]/drift/route.ts` | 프로젝트 소유권 확인 후 snapshot 조회 |
| 관리자 tester 관리 | `admin/testers/**` | `requireAdminAuth` 필수 |
| 구독 조회와 취소 | `subscription/route.ts` | `lib/subscription.ts`, `lib/portone-billing.ts` 연결 |
| PortOne 빌링키 | `portone/billing-key/route.ts` | 클라이언트 SDK 결과를 서버에서 저장 |
| PortOne 웹훅 | `webhooks/portone/route.ts` | 서명 검증과 멱등성 처리 |

## CONVENTIONS

- Route Handler의 `params`는 Promise로 받고 `await params`로 푼다.
- 사용자 인증은 `lib/api-utils.ts`의 guard를 사용한다.
- 프로젝트별 리소스는 API 안에서 반드시 `requireProjectOwnership(id, userId)`를 호출한다.
- 요청 body는 `parseJsonBody` 후 Zod `safeParse`로 검증한다.
- 성공 응답은 `apiSuccess`, 실패 응답은 `apiError`를 우선 사용한다.
- 외부 웹훅은 session guard가 아니라 provider 서명 검증을 신뢰 경계로 사용한다.
- 공개 API를 추가할 때는 공개 상태, PII 제거, 캐시 정책을 같은 변경 안에서 확인한다.
- 결제 API를 수정할 때는 `doc/rules/client/billing.md`를 먼저 다시 읽는다.

## ANTI-PATTERNS

- `session.user.id` 없이 username만으로 프로젝트 소유권을 판단하지 않는다.
- 관리자 페이지 middleware 보호만 믿고 `/api/admin/**`의 `requireAdminAuth`를 생략하지 않는다.
- PortOne 웹훅에서 서명 검증 전에 이벤트를 처리하지 않는다.
- GitHub access token이 필요한 route에서 `requireAuth`의 `accessToken` 확인을 우회하지 않는다.
- 에러 응답에 provider raw payload, secret, stack trace를 노출하지 않는다.
- `NextResponse.json` 직접 사용은 웹훅처럼 별도 포맷이 필요한 경계에서만 우선한다.

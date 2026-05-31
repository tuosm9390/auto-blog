# LIB DOMAIN KNOWLEDGE

## OVERVIEW

`lib`는 Synapso.dev의 도메인 서비스 레이어이며 DB, GitHub, AI 분석, Evidence 문서, 구독 결제를 연결한다.

## WHERE TO LOOK

| Task | Location | Notes |
| --- | --- | --- |
| API guard와 응답 helper | `api-utils.ts` | 인증, 관리자, 프로젝트 소유권 |
| 프로젝트 CRUD | `projects.ts` | projects, plans, analysis runs, snapshots |
| 프로젝트 refresh | `project-refresh.ts` | GitHub 수집과 AI 분석 orchestration |
| AI 상태 분석 | `project-memory-ai.ts` | Gemini project-state prompt |
| Evidence 문서 저장 | `project-documents.ts` | document CRUD, readiness, summary |
| Evidence 템플릿 | `project-document-templates.ts` | ko/en runtime template source |
| Evidence view model | `project-document-view-models.ts` | UI로 넘길 문서 상태 구성 |
| AI 문서 초안 | `project-document-draft-ai.ts` | Gemini draft generation |
| GitHub API | `github.ts` | commits, diffs, PRs, issues |
| 구독 제한 | `subscription.ts` | tier limit, usage count |
| PortOne 결제 | `portone-billing.ts` | billing key, charge, cancel, webhook |
| Supabase admin | `supabase-admin.ts` | server-only service role client |
| 공유 타입 | `types.ts` | domain type source |

## CONVENTIONS

- DB 접근 함수는 사용자 식별자와 리소스 id를 명시적으로 받는다.
- 서비스 함수는 UI copy보다 도메인 상태와 persistence를 우선 다룬다.
- Gemini 호출은 구조화된 입력과 보수적 판단을 유지한다. 과장된 마케팅 톤을 넣지 않는다.
- Evidence PRD는 `project_plans`가 source of truth다. 다른 Evidence 문서는 `project_documents`를 사용한다.
- `supabase-admin.ts`는 RLS를 우회할 수 있으므로 호출자는 서버 guard를 먼저 통과해야 한다.

## ANTI-PATTERNS

- `lib/billing.ts`와 `lib/stripe.ts`에 신규 결제 로직을 추가하지 않는다.
- `supabaseAdmin`을 사용했다는 이유로 소유권 확인을 생략하지 않는다.
- AI prompt에 실제 코드나 문서에 없는 사실을 단정하도록 지시하지 않는다.
- GitHub 수집에서 `.env`, lockfile, binary 같은 민감하거나 큰 파일을 분석 대상으로 넓히지 않는다.
- 단일 호출용 로직을 불필요한 추상화로 분리하지 않는다.

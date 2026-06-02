# PROJECT KNOWLEDGE BASE

**Generated:** 2026-05-31
**Commit:** 6f9bde8
**Branch:** master

## OVERVIEW

Synapso.dev는 GitHub 활동과 프로젝트 문서를 기반으로 프로젝트 상태, drift, blockers를 분석하는 Next.js 16 SaaS다.
핵심 스택은 Next.js App Router, React 19, Tailwind v4, NextAuth v5, Supabase, Gemini SDK다.

## STRUCTURE

```text
auto-blog/
├── app/[locale]/        # ko/en 라우트, 페이지, 서버 액션
├── app/api/             # 인증된 API와 관리자 API
├── components/          # 공유 UI와 프로젝트 문서 workspace 컴포넌트
├── lib/                 # 프로젝트, 문서, AI, GitHub 도메인 서비스
├── tests/               # Vitest 기능 테스트
├── scripts/             # Supabase SQL과 운영 보조 스크립트
├── doc/rules/           # 에이전트가 반드시 읽는 프로젝트 규칙
└── .specify/memory/     # 프로젝트 헌법
```

## WHERE TO LOOK

| Task | Location | Notes |
| --- | --- | --- |
| 프로젝트 전체 규칙 | `CLAUDE.md`, `.specify/memory/constitution.md`, `doc/rules/core/*` | 작업 전 우선 로드 |
| 인증과 세션 | `auth.ts`, `middleware.ts`, `lib/api-utils.ts` | GitHub numeric id를 사용자 PK로 사용 |
| 프로젝트 상태 분석 | `lib/project-refresh.ts`, `lib/project-memory-ai.ts` | GitHub 활동과 Evidence 문서를 결합 |
| 프로젝트 CRUD | `lib/projects.ts`, `app/api/projects/**`, `app/actions/projectActions.ts` | 소유권 확인 필수 |
| Evidence 문서 | `lib/project-documents.ts`, `lib/project-document-templates.ts`, `components/projects/*` | PRD는 `project_plans`가 source of truth |
| UI shell | `app/[locale]/layout.tsx`, `components/Header.tsx`, `components/Footer.tsx` | next-intl provider와 공통 chrome |
| 테스트 | `tests/*.test.ts`, `lib/__tests__/*.test.ts`, `vitest.config.ts` | `npm test` 없음, `npx vitest` 사용 |

## CODE MAP

| Symbol | Type | Location | Role |
| --- | --- | --- | --- |
| `auth` | NextAuth export | `auth.ts` | 서버 세션과 route authorization의 중심 |
| `requireAuth` | guard | `lib/api-utils.ts` | API 사용자 인증과 access token 확인 |
| `requireProjectOwnership` | guard | `lib/api-utils.ts` | IDOR 방지용 프로젝트 소유권 확인 |
| `refreshProjectState` | service | `lib/project-refresh.ts` | 분석 run 생성, GitHub 수집, snapshot 저장 |
| `analyzeProjectState` | AI service | `lib/project-memory-ai.ts` | Gemini 기반 상태 분석 |
| `ProjectDocumentsWorkspace` | client component | `components/projects/ProjectDocumentsWorkspace.tsx` | Evidence 문서 선택과 편집 상태 관리 |

## CONVENTIONS

- 모든 사용자 응답과 프로젝트 문서는 한국어로 작성한다.
- TypeScript `strict` 전제를 유지하고 `any`는 기존 예외 외에 추가하지 않는다.
- 컴포넌트 파일은 PascalCase, 도메인 로직 파일은 의미 중심 kebab-case 또는 camelCase를 따른다.
- API 입력은 Zod로 검증하고, 서버 내부 에러와 secret은 응답에 노출하지 않는다.
- 새 소스 파일 첫 줄에는 역할을 설명하는 한국어 한 줄 주석을 둔다. `'use client'`, `'use server'`, shebang이 있으면 그 바로 아래에 둔다.
- 비자명한 작업 전에는 `checklist.md`, `context-notes.md`, 필요 시 `doc/results/*`에 계획과 결정 기록을 남긴다.
- 커밋 메시지는 `type(scope): 요약` 뒤에 변경 파일, `Why`, `Impact`를 포함한다.

## ANTI-PATTERNS

- Supabase RLS에서 신규 `USING (true)` 정책을 만들지 않는다.
- IDOR 방지를 클라이언트 상태나 URL 파라미터에 맡기지 않는다. 서버에서 현재 사용자와 리소스 소유권을 다시 확인한다.
- JWT 직접 서명에 `jose`를 쓰지 않는다. 필요한 경우 Node 내장 `crypto.createHmac`를 사용한다.
- Octokit `listForUser`에 `type: "public"`을 전달하지 않는다.
- Next.js `cookies()`는 await 없이 호출하지 않는다.
- 공개 페이지에 작성자 실명, 이메일, 비공개 GitHub 링크 같은 PII를 노출하지 않는다.
- CSP에 와일드카드 `*`를 추가하지 않는다.

## COMMANDS

```bash
npm run dev
npm run build
npm run lint
npx vitest
```

## NOTES

- `package.json`에는 `test` script가 없다.
- GitHub Actions는 tag push용 release workflow만 있다. 일반 PR CI는 현재 없다.

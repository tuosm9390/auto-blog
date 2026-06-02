# Synapso.dev 기술 설명서

Synapso.dev는 GitHub 활동과 프로젝트 문서를 결합해 프로젝트의 현재 상태, 진행률, 리스크, 방향 변화, 다음 작업을 구조화하는 AI-native Project Memory 서비스입니다. 단순한 프로젝트 목록이나 문서 저장소가 아니라, 실제 개발 활동과 PRD/Evidence 문서를 근거로 “지금 이 프로젝트가 어디까지 왔고 무엇을 봐야 하는가”를 판단하는 상태판을 만드는 데 초점을 둡니다.

이 문서는 현재 코드베이스를 기준으로 아키텍처, 핵심 파이프라인, 데이터 모델, 주요 구현 방식, 기술 스택을 정리합니다.

## 프로젝트 개요

| 항목 | 내용 |
| --- | --- |
| 제품명 | Synapso.dev |
| 핵심 목적 | AI와 함께 진행하는 프로젝트의 맥락 손실을 줄이는 Project Memory |
| 주요 사용자 | 여러 실험과 구현을 동시에 진행하는 solo builder 또는 소규모 개발자 |
| 핵심 입력 | 프로젝트 thesis, 현재 PRD, Evidence 문서, GitHub commit, Pull Request, Issue |
| 핵심 출력 | 상태 스냅샷, 진행률, current phase, blocker/risk/drift 개수, watch next, evidence 목록 |

제품의 중심 엔터티는 `projects`입니다. 각 프로젝트는 원래 가설인 `original_thesis`, 현재 방향인 `current_thesis`, GitHub 저장소 연결 정보, 현재 PRD, Evidence 문서, 분석 실행 이력, 상태 스냅샷을 갖습니다.

## 핵심 파이프라인

상태 분석은 [lib/project-refresh.ts](lib/project-refresh.ts)에서 orchestration됩니다.

```text
Project + Current Plan + Applied Evidence Docs
        │
        ├─ GitHub commits, PRs, issues 수집
        │
        ├─ Evidence coverage와 누락 문서 계산
        │
        ├─ Gemini structured output 분석
        │
        ├─ state_snapshots 저장
        │
        └─ analysis_runs 상태 업데이트
```

### 1. 기준 데이터 로드

`refreshProjectState`는 프로젝트 ID를 받아 `projects`, 현재 `project_plans`, 적용된 `project_documents`를 읽습니다. PRD는 `project_plans`가 source of truth이고, roadmap, backlog, sprint plan, decision log, technical design, risk log, release/ops learning 같은 Evidence 문서는 `project_documents`에 저장됩니다.

문서 요약은 `summarizeStoredProjectDocuments`와 `buildDocumentSummary`를 통해 readiness, 적용 여부, content preview로 압축됩니다. 이 요약은 Gemini 프롬프트와 snapshot metadata 양쪽에 사용됩니다.

### 2. GitHub evidence 수집

GitHub 연동은 [lib/github.ts](lib/github.ts)가 담당합니다. 사용자의 GitHub OAuth access token을 받아 최근 commit을 조회하고, 각 commit의 diff, 관련 Pull Request, commit/PR 본문에 언급된 Issue 번호를 수집합니다.

수집 과정에서는 분석 노이즈를 줄이기 위해 lockfile, 환경 파일, 빌드 결과물, 바이너리와 미디어 파일을 제외합니다. 이 필터링은 AI 분석에 실제 설계와 구현 변화가 들어가도록 하기 위한 장치입니다.

### 3. AI 상태 분석

[lib/project-memory-ai.ts](lib/project-memory-ai.ts)는 Gemini SDK를 사용해 프로젝트 상태를 JSON으로 생성합니다. 프롬프트는 다음 맥락을 포함합니다.

- 프로젝트 이름, 설명, original thesis, current thesis.
- 현재 PRD 또는 계획 문서.
- 적용된 Evidence 문서의 타입, readiness, preview.
- 최근 commit diff의 파일명, 상태, 추가/삭제량.
- 관련 Pull Request와 Issue의 제목, 상태, 작성자, 본문 요약.
- 출력 언어 지침. `ko`와 `en`을 분리해 자연스러운 로컬라이즈된 결과를 만듭니다.

응답은 Gemini `responseSchema`로 제한됩니다. 필요한 필드는 `summary`, `progressPercent`, `currentPhase`, `blockerCount`, `riskCount`, `driftCount`, `watchNext`, `planProgress`, `drift`입니다. 이후 코드에서 진행률과 카운트는 보수적으로 clamp되고, watch next와 drift 항목 수는 UI에 맞게 제한됩니다.

### 4. fallback baseline 생성

GitHub 저장소가 없거나 access token을 사용할 수 없으면 Gemini 분석 대신 baseline snapshot을 생성합니다. 이 fallback은 “아직 GitHub 활동이 연결되지 않은 상태”를 명확히 표시하고, PRD 존재 여부에 따라 초기 진행률과 watch next를 다르게 구성합니다.

이 방식은 빈 화면을 피하면서도 없는 evidence를 꾸며내지 않도록 설계된 안전장치입니다.

### 5. snapshot과 run 저장

분석이 시작되면 `analysis_runs`에 pending run을 만들고 processing으로 업데이트합니다. 성공하면 `state_snapshots`에 결과를 저장하고 run을 completed로 바꿉니다. 실패하면 error message와 함께 failed로 기록합니다.

snapshot의 `raw_output_json`에는 생성 모드, repo/token 상태, commit/PR/issue 개수, plan summary, document coverage, fallback reason이 들어갑니다. UI는 이 metadata를 사용해 상태 품질과 evidence coverage를 보여줍니다.

## 프로젝트 구조

```text
synapso.dev/
├── app/
│   ├── [locale]/                 # ko/en 페이지, 프로젝트 화면, 관리자 화면
│   ├── actions/                  # 서버 액션
│   └── api/                      # 인증 API, GitHub API, 프로젝트 API, 관리자 API
├── components/
│   ├── projects/                 # Project Memory 상태판과 문서 workspace UI
│   └── ui/                       # 공통 UI 컴포넌트
├── lib/
│   ├── projects.ts               # 프로젝트, 계획, run, snapshot persistence
│   ├── project-refresh.ts        # 상태 분석 orchestration
│   ├── project-memory-ai.ts      # Gemini 상태 분석
│   ├── project-documents.ts      # Evidence 문서 저장과 적용 상태
│   ├── project-document-*.ts     # 문서 템플릿, view model, AI draft 생성
│   ├── github.ts                 # GitHub context 수집
│   ├── api-utils.ts              # 인증, 권한, API 응답 helper
│   └── types.ts                  # 도메인 타입
├── scripts/                      # Supabase SQL과 운영 보조 스크립트
├── tests/                        # Vitest 테스트
├── doc/rules/                    # 프로젝트 규칙과 작업 지침
└── messages/                     # next-intl ko/en 메시지
```

## 상세 기능 구현

### 인증과 권한

인증은 [auth.ts](auth.ts)의 NextAuth v5 설정이 중심입니다. GitHub provider는 `read:user user:email repo` scope를 사용하고, 최초 로그인 시 GitHub numeric ID를 session user id로 고정합니다. 이는 NextAuth v5의 내부 UUID가 로그인마다 바뀌는 문제를 피하고, Supabase `profiles.id`와 프로젝트 `owner_id`를 안정적으로 연결하기 위한 결정입니다.

권한 확인은 두 층으로 나뉩니다.

- 라우트 수준에서는 NextAuth `authorized` callback이 공개 페이지, 로그인 필요 페이지, 관리자 페이지를 분기합니다.
- API와 서버 액션 수준에서는 [lib/api-utils.ts](lib/api-utils.ts)의 `requireAuth`, `requireAdminAuth`, `requireProjectOwnership`이 현재 세션과 리소스 소유권을 다시 확인합니다.

이중 검증 구조는 IDOR 방지를 위해 중요합니다. 클라이언트 URL이나 화면 상태가 아니라 서버에서 프로젝트 owner를 다시 비교합니다.

### 프로젝트 CRUD와 PRD 저장

[lib/projects.ts](lib/projects.ts)는 Supabase admin client를 사용해 프로젝트와 관련 데이터를 읽고 씁니다. 프로젝트 생성 시 이름을 slug로 변환하고, 같은 사용자 안에서 중복 slug가 생기면 `-1`, `-2` 형태로 unique slug를 만듭니다.

현재 PRD는 `project_plans`의 `is_current = true` 행으로 저장됩니다. `upsertCurrentProjectPlan`은 기존 current plan이 있으면 업데이트하고, 없으면 새 버전을 생성합니다. 첫 구현은 프로젝트당 현재 문서 하나를 중심으로 단순하게 설계되어 있습니다.

### Project State Page

[app/[locale]/projects/[id]/page.tsx](app/[locale]/projects/[id]/page.tsx)는 상태판의 핵심 화면입니다. 최신 snapshot, run 목록, snapshot history, current plan을 병렬로 읽고 다음 정보를 렌더링합니다.

- progress, current phase, drift count, blocker/risk count.
- 요약과 watch next.
- 데이터 품질 체크. PRD 연결, repo 연결, GitHub activity 포함 여부.
- review readiness. summary, watch next, evidence, plan coverage가 충분한지.
- 두 번째 refresh 이후의 변화량. progress, drift, risk, blocker delta.
- commit coverage, PR evidence, Issue evidence, snapshot history.
- plan progress와 drift 항목.

이 화면은 단순 결과 표시가 아니라 snapshot의 품질을 사용자가 검토할 수 있게 만드는 운영 대시보드 역할을 합니다.

### Evidence 문서 관리

Evidence 문서 기능은 [app/[locale]/projects/[id]/documents/page.tsx](app/[locale]/projects/[id]/documents/page.tsx)와 [components/projects/ProjectDocumentsWorkspace.tsx](components/projects/ProjectDocumentsWorkspace.tsx)가 담당합니다.

문서 타입은 다음 8종입니다.

| 타입 | 역할 |
| --- | --- |
| `prd` | 현재 제품 목표와 acceptance criteria의 기준선 |
| `roadmap` | milestone과 일정 흐름 |
| `backlog` | 작업 항목과 우선순위 |
| `sprint_plan` | 현재 cycle의 실행 계획 |
| `decision_log` | 방향 전환과 의사결정 기록 |
| `technical_design` | 데이터 흐름, 인터페이스, 오류 경로, 테스트 계획 |
| `risk_log` | blocker, risk, dependency 추적 |
| `release_ops_learning` | 출시, 운영, 회고 기록 |

PRD는 `project_plans`에 저장되고 나머지는 `project_documents`에 저장됩니다. `buildProjectDocumentViewModels`는 저장된 문서가 없어도 템플릿 기반 draft view model을 만들어 사용자가 바로 편집할 수 있게 합니다.

### AI 문서 초안 생성

[lib/project-document-draft-ai.ts](lib/project-document-draft-ai.ts)는 현재 프로젝트, PRD, 관련 Evidence 문서, 최신 snapshot을 바탕으로 문서 초안을 생성합니다. 각 문서 타입에는 별도의 authoring guidance가 있습니다.

예를 들어 technical design은 데이터 흐름, 인터페이스, 저장 데이터, 외부 호출, Error Paths, Security, Test Plan을 채우도록 유도합니다. risk log는 blocker와 risk를 probability/impact 기준으로 분류하도록 유도합니다.

모든 초안 생성은 JSON schema로 `title`과 `contentMarkdown`을 받습니다. 알 수 없는 사실은 `TBD`, `unknown`, `needs validation`으로 남기도록 프롬프트가 강제합니다.

### Drift 검토

[app/[locale]/projects/[id]/drift/page.tsx](app/[locale]/projects/[id]/drift/page.tsx)는 최신 snapshot과 직전 snapshot을 비교해 새로 생긴 drift와 해소된 drift를 계산합니다. drift는 단순한 코드 변경이 아니라 제품 방향, 범위, 실행 방식의 변화로 취급됩니다.

화면은 original thesis, current thesis, next validated thesis를 timeline 형태로 보여주고, drift item의 `original`, `current`, `why`, `evidence_refs`를 표시합니다.

### API 설계

프로젝트 API는 App Router route handler로 구현되어 있습니다.

| Route | 역할 |
| --- | --- |
| `app/api/projects/route.ts` | 프로젝트 목록과 생성 |
| `app/api/projects/[id]/route.ts` | 단일 프로젝트 조회와 수정 |
| `app/api/projects/[id]/refresh/route.ts` | 상태 refresh 실행 |
| `app/api/projects/[id]/drift/route.ts` | drift 관련 데이터 조회 |
| `app/api/github/route.ts` | GitHub 기본 연동 |
| `app/api/github/repos/route.ts` | 사용자 GitHub repo 목록 |
| `app/api/admin/**` | 관리자 tester와 user 관리 |

입력 검증에는 Zod가 사용됩니다. API 응답은 `apiSuccess`, `apiError` helper로 통일하고, 인증 오류는 `AuthError` 타입으로 구분합니다.

### Supabase 데이터 모델

핵심 스키마는 [scripts/add-project-memory-core.sql](scripts/add-project-memory-core.sql)와 [scripts/add-project-documents.sql](scripts/add-project-documents.sql)에 정의되어 있습니다.

| Table | 역할 |
| --- | --- |
| `profiles` | GitHub 계정 기반 사용자 프로필과 역할 |
| `projects` | 프로젝트 기준선, thesis, GitHub repo 연결 |
| `project_plans` | 현재 PRD 또는 계획 문서 |
| `project_documents` | PRD 외 Evidence 문서 |
| `analysis_runs` | refresh 실행 상태와 실패 기록 |
| `state_snapshots` | AI 분석 결과와 evidence metadata |

RLS 정책은 프로젝트 owner 기준입니다. `project_plans`, `analysis_runs`, `state_snapshots`, `project_documents`는 모두 연결된 `projects.owner_id = auth.uid()::text` 조건으로 접근을 제한합니다.

## 기술 스택

| 영역 | 기술 |
| --- | --- |
| Framework | Next.js 16 App Router |
| UI | React 19, Tailwind CSS v4, CSS variables |
| Auth | NextAuth v5 beta, GitHub OAuth |
| Database | Supabase PostgreSQL, RLS |
| AI | Google Gemini SDK, structured JSON output |
| GitHub | Octokit REST API |
| Markdown | react-markdown, remark-gfm, rehype-highlight, rehype-sanitize |
| Validation | Zod |
| Email | Resend, React Email |
| Test | Vitest, Testing Library, jsdom |
| Deploy | Vercel |
| i18n | next-intl, `ko`와 `en` locale routing |

## 테스트와 검증

현재 테스트는 문서 템플릿, 문서 view model, AI draft prompt, 문서 action input, API JSON parsing, 제거된 도메인 잔재 확인을 다룹니다.

대표 테스트 파일은 다음과 같습니다.

| 파일 | 검증 내용 |
| --- | --- |
| `tests/project-document-templates.test.ts` | Evidence 템플릿 구조와 문서 타입 metadata |
| `tests/project-document-view-models.test.ts` | PRD와 stored document를 화면 모델로 변환하는 로직 |
| `tests/project-document-draft-ai.test.ts` | AI 초안 프롬프트가 필요한 맥락과 지침을 포함하는지 |
| `tests/project-document-action-inputs.test.ts` | 문서 apply/supersede 입력 parsing |
| `lib/__tests__/parseBody.test.ts` | API body parsing 동작 |
| 제거 도메인 잔재 확인 테스트 | 삭제된 파일, dependency, config, UI 잔재가 없는지 |

`package.json`에는 `test` script가 없으므로 전체 테스트는 `npx vitest` 또는 `npx vitest run`으로 실행합니다. 빌드 검증은 `npm run build`, lint는 `npm run lint`입니다.

## 주요 구현 특징

### Evidence 중심의 AI 분석

AI 분석은 단순히 프로젝트 설명을 요약하지 않습니다. PRD, Evidence 문서, commit diff, PR, Issue를 모두 prompt에 넣고, 결과도 evidence 목록과 함께 snapshot에 저장합니다. 이 구조는 “AI가 왜 이런 판단을 했는지”를 사용자가 다시 검토할 수 있게 합니다.

### 문서 readiness와 적용 상태 분리

문서는 존재 여부만으로 분석에 들어가지 않습니다. `readiness`와 `is_applied`가 분리되어 있어 draft 문서는 관리 화면에서 편집할 수 있지만, 분석에는 적용된 문서만 사용할 수 있습니다. 이 덕분에 작성 중인 문서가 상태 판단을 오염시키지 않습니다.

### baseline fallback

GitHub 연결이 없어도 프로젝트는 빈 상태로 남지 않습니다. baseline snapshot은 PRD와 thesis만으로 초기 상태를 만들고, GitHub evidence가 부족하다는 점을 `raw_output_json.fallbackReason`에 남깁니다. 이 방식은 사용자에게 다음 연결 작업을 안내하면서도 근거 없는 분석을 피합니다.

### snapshot history 기반 변화 추적

상태판은 최신 snapshot만 보여주지 않고 이전 snapshot과 비교합니다. progress, drift, risk, blocker delta를 계산해 프로젝트가 좋아지고 있는지, 방향 변화가 늘고 있는지 확인할 수 있습니다.

### 서버 중심 권한 검증

프로젝트 읽기와 변경은 모두 서버에서 session user id와 `project.owner_id`를 비교합니다. API, 서버 액션, 페이지 단에서 같은 원칙을 반복 적용해 URL 조작이나 클라이언트 상태 오염에 의존하지 않습니다.

### 타입과 스키마 기반 안정성

도메인 타입은 [lib/types.ts](lib/types.ts)에 모여 있고, 외부 입력은 Zod로 검증됩니다. Gemini 응답도 schema를 지정해 받기 때문에 UI가 기대하는 필드가 없는 응답을 줄입니다.

## 개발과 운영 관점

이 프로젝트는 아직 일반 PR CI가 아니라 로컬 검증 중심으로 운영됩니다. 일반적인 작업 검증 순서는 다음과 같습니다.

```bash
npx vitest run
npm run lint
npm run build
```

데이터베이스 변경은 Supabase SQL Editor에서 `scripts/*.sql`을 적용하는 방식입니다. Project Memory core schema와 Project Documents schema는 분리되어 있어, 문서 기능을 점진적으로 적용할 수 있습니다.

## 포트폴리오 관점의 기술적 난이도

Synapso.dev의 핵심 난이도는 “AI 호출을 붙인 대시보드”가 아니라, 신뢰 가능한 프로젝트 상태 판단을 만들기 위한 evidence pipeline에 있습니다.

- GitHub 활동과 문서 evidence를 함께 다루는 orchestration.
- AI 출력의 schema화와 fallback 설계.
- 프로젝트 owner 기준의 서버 권한 검증.
- 문서 readiness, 적용 상태, stale 판단을 포함한 Evidence 관리 UX.
- snapshot history와 drift 비교를 통한 상태 변화 추적.
- 한국어와 영어를 모두 고려한 App Router 기반 i18n.

결과적으로 이 프로젝트는 AI 기반 요약 기능보다 “프로젝트 운영 판단을 데이터와 문서로 재현 가능하게 만드는 시스템”에 가깝습니다.

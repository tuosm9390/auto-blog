# Project Documents Implementation Plan

> 작성일: 2026-05-28
> 대상 제품: Synapso.dev Project Memory
> 기준 문서: `doc/designs/project-documents-feature-design.md`
> 목표: Evidence 문서 확인, 수정, 저장, 분석 적용 기능을 실제 코드로 구현하기 위한 단계별 계획을 정의한다.

## 1. 구현 결론

구현은 한 번에 큰 편집기를 만드는 방식이 아니라, Evidence 문서를 프로젝트 상태 분석의 입력으로 승격하는 수직 슬라이스로 진행한다.

권장 순서는 다음과 같다.

1. `project_documents` 저장 모델 추가.
2. 타입과 문서 템플릿 메타데이터 추가.
3. 문서 CRUD와 적용 상태 변경 서버 액션 추가.
4. `/projects/[id]/documents` 페이지 추가.
5. 프로젝트 상세 페이지에서 Documents 진입점 추가.
6. `refreshProjectState`와 `analyzeProjectState`에 applied documents 연결.
7. 빌드와 핵심 경로 검증.

## 2. 성공 기준

구현 완료 기준은 다음이다.

- 프로젝트별 Evidence 문서 8종이 표시된다.
- 사용자는 문서 유형별 기본 초안을 생성할 수 있다.
- 사용자는 markdown 문서를 수정하고 저장할 수 있다.
- 사용자는 문서를 분석에 적용하거나 제외할 수 있다.
- 상태 새로고침은 applied 문서를 분석 입력에 포함한다.
- 최신 snapshot의 `evidence_json` 또는 `raw_output_json`에서 사용된 문서 근거를 확인할 수 있다.
- 한국어와 영어 UI 문자열이 모두 존재한다.
- `npm run build`가 통과한다.

## 3. 변경 대상 파일

예상 변경 파일은 다음이다.

```text
scripts/add-project-memory-core.sql
lib/types.ts
lib/project-documents.ts
lib/project-document-templates.ts
lib/project-refresh.ts
lib/project-memory-ai.ts
app/actions/projectActions.ts
app/[locale]/projects/[id]/documents/page.tsx
app/[locale]/projects/[id]/page.tsx
components/projects/DocumentCoverageGrid.tsx
components/projects/ProjectDocumentEditor.tsx
messages/ko.json
messages/en.json
```

신규 source 파일 첫 줄에는 프로젝트 지침에 따라 한국어 역할 주석을 넣는다.

## 4. 데이터베이스 계획

`scripts/add-project-memory-core.sql`에 `project_documents`를 추가한다.

권장 DDL은 다음 구조다.

```sql
CREATE TABLE IF NOT EXISTS public.project_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  content_markdown TEXT NOT NULL DEFAULT '',
  is_applied BOOLEAN NOT NULL DEFAULT false,
  readiness TEXT NOT NULL DEFAULT 'draft',
  related_links_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  analysis_signals_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_used_snapshot_id UUID REFERENCES public.state_snapshots(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT project_documents_document_type_check CHECK (
    document_type IN (
      'prd',
      'roadmap',
      'backlog',
      'sprint_plan',
      'decision_log',
      'technical_design',
      'risk_log',
      'release_ops_learning'
    )
  ),
  CONSTRAINT project_documents_status_check CHECK (
    status IN ('draft', 'active', 'superseded', 'archived')
  ),
  CONSTRAINT project_documents_readiness_check CHECK (
    readiness IN ('missing', 'draft', 'usable', 'stale')
  )
);
```

필요 인덱스는 다음이다.

```sql
CREATE INDEX IF NOT EXISTS idx_project_documents_project_id
  ON public.project_documents(project_id);

CREATE INDEX IF NOT EXISTS idx_project_documents_project_type
  ON public.project_documents(project_id, document_type);

CREATE INDEX IF NOT EXISTS idx_project_documents_applied
  ON public.project_documents(project_id, is_applied);
```

RLS는 `project_plans`와 같은 소유자 검증 패턴을 재사용한다.

## 5. 타입 계획

`lib/types.ts`에 다음 타입을 추가한다.

```ts
export type ProjectDocumentType =
  | "prd"
  | "roadmap"
  | "backlog"
  | "sprint_plan"
  | "decision_log"
  | "technical_design"
  | "risk_log"
  | "release_ops_learning";

export type ProjectDocumentStatus = "draft" | "active" | "superseded" | "archived";
export type ProjectDocumentReadiness = "missing" | "draft" | "usable" | "stale";

export interface ProjectDocument {
  id: string;
  project_id: string;
  document_type: ProjectDocumentType;
  title: string;
  status: ProjectDocumentStatus;
  content_markdown: string;
  is_applied: boolean;
  readiness: ProjectDocumentReadiness;
  related_links_json: unknown[];
  analysis_signals_json: string[];
  last_used_snapshot_id: string | null;
  created_at: string;
  updated_at: string;
}
```

`EvidenceItem.type`은 기존 string을 유지한다. snapshot evidence에 `document` 값을 추가해도 breaking change가 없다.

## 6. 템플릿 메타데이터 계획

`lib/project-document-templates.ts`를 추가한다.

역할은 다음이다.

- 문서 유형 8종의 순서 정의.
- 유형별 기본 제목 정의.
- 유형별 분석 신호 정의.
- 한국어와 영어 기본 markdown 초안 정의.
- readiness 계산에 필요한 필수 섹션 키워드 정의.

초기 API는 다음 형태가 적당하다.

```ts
export const PROJECT_DOCUMENT_TYPES = [...];

export function getProjectDocumentTemplate(
  type: ProjectDocumentType,
  locale: "ko" | "en"
): ProjectDocumentTemplate;

export function getDocumentTypeMeta(type: ProjectDocumentType): ProjectDocumentTypeMeta;

export function estimateDocumentReadiness(
  type: ProjectDocumentType,
  contentMarkdown: string,
  updatedAt?: string
): ProjectDocumentReadiness;
```

readiness v1은 단순 규칙으로 충분하다.

- content 없음은 `missing`.
- 200자 미만 또는 필수 섹션 2개 미만은 `draft`.
- 45일 이상 업데이트 없음은 `stale`.
- 그 외는 `usable`.

## 7. 데이터 접근 함수 계획

`lib/project-documents.ts`를 추가한다.

필요 함수는 다음이다.

```ts
getProjectDocuments(projectId: string): Promise<ProjectDocument[]>
getProjectDocument(projectId: string, documentType: ProjectDocumentType): Promise<ProjectDocument | null>
upsertProjectDocument(input): Promise<ProjectDocument>
setProjectDocumentApplied(projectId: string, documentId: string, isApplied: boolean): Promise<boolean>
markProjectDocumentSuperseded(projectId: string, documentId: string): Promise<boolean>
getAppliedProjectDocuments(projectId: string): Promise<ProjectDocument[]>
updateDocumentsLastUsed(projectId: string, documentIds: string[], snapshotId: string): Promise<void>
```

소유자 검증은 서버 액션과 페이지에서 `getProjectById` 결과의 `owner_id`로 먼저 수행한다.

## 8. 서버 액션 계획

`app/actions/projectActions.ts`에 문서용 action을 추가한다.

필요 action은 다음이다.

```ts
createProjectDocumentFromTemplateAction(locale, projectId, documentType)
saveProjectDocumentAction(locale, projectId, documentId, formData)
applyProjectDocumentAction(locale, projectId, documentId, isApplied)
markProjectDocumentSupersededAction(locale, projectId, documentId)
```

검증 규칙은 다음이다.

- 로그인 없으면 `/login`.
- 프로젝트 소유자가 아니면 `/projects`.
- `documentType`은 enum으로 제한.
- title은 최소 1자.
- content는 빈 값 저장을 허용하되 readiness는 `draft` 또는 `missing`으로 계산.
- action 후 `/projects/${projectId}/documents`와 `/projects/${projectId}`를 revalidate.

## 9. 페이지 구현 계획

신규 페이지는 `app/[locale]/projects/[id]/documents/page.tsx`다.

페이지 책임은 다음이다.

- 인증 확인.
- 프로젝트 소유권 확인.
- project, current plan, latest snapshot, documents 로드.
- 문서 유형별 view model 생성.
- coverage score 계산.
- 서버 액션 bind.
- 페이지 렌더링.

초기 UI 구성은 다음이다.

```text
Header
├─ Project name
├─ Evidence readiness summary
├─ Back to state
└─ Refresh state

Coverage grid
├─ 8 document cards
├─ readiness badge
├─ applied badge
└─ last updated

Editor area
├─ selected document type
├─ template/create action
├─ markdown textarea
├─ analysis signals
├─ save draft
├─ apply/exclude
└─ mark superseded
```

첫 구현에서는 query string `?type=roadmap`으로 선택 문서를 제어한다. 클라이언트 상태를 최소화하고 서버 컴포넌트 중심 구조를 유지하기 위함이다.

## 10. 컴포넌트 계획

`components/projects/DocumentCoverageGrid.tsx`.

- 문서 유형별 카드 표시.
- readiness, applied, updated_at 표시.
- 선택된 type 링크 제공.

`components/projects/ProjectDocumentEditor.tsx`.

- server action form 렌더링.
- 기존 문서가 없으면 create from template 버튼 표시.
- 기존 문서가 있으면 title, content textarea, save/apply/supersede 버튼 표시.
- textarea 기반 markdown 편집으로 시작.

초기에는 별도 클라이언트 컴포넌트가 필요하지 않다. 버튼 클릭 후 서버 액션과 redirect/revalidate로 충분하다.

## 11. 프로젝트 상세 페이지 연결

`app/[locale]/projects/[id]/page.tsx`의 header action 영역에 Documents 링크를 추가한다.

상태 review 영역에는 추후 문서 coverage를 보여줄 수 있지만, 첫 구현에서는 링크만 추가한다. 범위를 작게 유지하기 위함이다.

## 12. 분석 파이프라인 연결

`lib/project-refresh.ts`에서 `getAppliedProjectDocuments`를 호출한다.

`raw_output_json`에 다음 값을 추가한다.

```ts
documentCoverage: {
  appliedDocumentTypes: string[];
  appliedDocumentIds: string[];
  missingDocumentTypes: string[];
  staleDocumentTypes: string[];
}
```

baseline 분석에서도 applied documents는 evidence로 포함한다.

`analyzeProjectState`에는 documents 인자를 추가한다.

```ts
analyzeProjectState(project, plan, documents, commitDiffs, pullRequests, issues, locale)
```

프롬프트에는 문서를 전부 붙이지 않고, 유형, 제목, readiness, content preview를 압축해 넣는다. 첫 구현에서는 문서별 1,500자 정도로 제한한다.

snapshot 생성 후에는 `updateDocumentsLastUsed(projectId, appliedDocumentIds, snapshot.id)`를 호출한다.

## 13. 마이그레이션 호환성

기존 사용자는 `project_documents`가 없는 상태일 수 있다.

현재 코드의 `isMissingProjectMemoryTableError` 패턴처럼 문서 테이블이 없을 때 문서 페이지는 setup 안내를 보여주거나 빈 목록으로 안전하게 실패해야 한다.

단, 분석 파이프라인에서는 문서 테이블이 없더라도 refresh가 실패하면 안 된다. `getAppliedProjectDocuments`는 missing table 에러에서 빈 배열을 반환하도록 만든다.

## 14. 테스트와 검증 계획

필수 검증은 다음이다.

```text
npm run build
```

가능하면 추가할 검증은 다음이다.

```text
npm run lint
```

수동 검증 시나리오는 다음이다.

1. 프로젝트 상세에서 Documents 링크가 보인다.
2. Documents 페이지가 열린다.
3. missing 문서 카드가 표시된다.
4. Roadmap 문서를 template에서 생성한다.
5. 문서를 수정하고 저장한다.
6. Apply to analysis를 누르면 applied 상태가 표시된다.
7. Refresh state 후 snapshot evidence 또는 raw metadata에 document coverage가 남는다.

## 15. 구현 체크리스트

### Phase 1. Storage

- [ ] `project_documents` DDL 추가.
- [ ] index와 trigger 추가.
- [ ] RLS policy 추가.
- [ ] schema validation 쿼리 확인.

### Phase 2. Domain

- [ ] `ProjectDocument` 타입 추가.
- [ ] document type/status/readiness 타입 추가.
- [ ] 템플릿 메타데이터 추가.
- [ ] readiness 계산 함수 추가.
- [ ] 데이터 접근 함수 추가.

### Phase 3. Actions

- [ ] create from template action 추가.
- [ ] save action 추가.
- [ ] apply/exclude action 추가.
- [ ] supersede action 추가.
- [ ] revalidate 경로 추가.

### Phase 4. UI

- [ ] `/projects/[id]/documents` 페이지 추가.
- [ ] coverage grid 추가.
- [ ] markdown editor form 추가.
- [ ] 프로젝트 상세 페이지 Documents 링크 추가.
- [ ] 한국어와 영어 메시지 추가.

### Phase 5. Analysis

- [ ] refresh에서 applied documents 로드.
- [ ] AI 분석 입력에 document summary 추가.
- [ ] baseline evidence에 applied documents 추가.
- [ ] raw output에 document coverage 추가.
- [ ] last used snapshot 업데이트 추가.

### Phase 6. Verification

- [ ] `npm run build`.
- [ ] `npm run lint`.
- [ ] 핵심 수동 시나리오 확인.
- [ ] 구현 변경 커밋.

## 16. 리스크

가장 큰 리스크는 분석 입력이 과도하게 길어지는 것이다. 따라서 첫 구현에서는 문서 전문을 모두 넣지 말고, 문서별 preview와 핵심 metadata 중심으로 넣는다.

두 번째 리스크는 사용자가 저장과 적용의 차이를 이해하지 못하는 것이다. UI에서 Save Draft와 Apply to Analysis를 분리하되, applied 문서만 다음 refresh에 쓰인다는 문구를 짧게 보여줘야 한다.

세 번째 리스크는 DB schema가 적용되지 않은 환경에서 페이지가 깨지는 것이다. 이 프로젝트는 이미 setup 안내 패턴이 있으므로 문서 테이블도 같은 방식으로 방어한다.

## 17. 다음 작업 단위

첫 코드 작업은 Phase 1과 Phase 2만 묶는 것이 좋다.

이 단위는 UI 없이도 `project_documents` 저장 모델, 타입, 템플릿, readiness 계산을 검증할 수 있다. 이후 Phase 3과 Phase 4에서 사용자 화면을 붙이고, 마지막으로 Phase 5에서 분석 파이프라인을 연결하는 순서가 안전하다.

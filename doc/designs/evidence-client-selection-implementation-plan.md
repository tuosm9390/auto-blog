# Evidence Client Selection Implementation Plan

## 1. 목표

Evidence 문서 관리 페이지에서 문서 카드를 선택할 때마다 서버 컴포넌트 요청이 발생하는 구조를 개선한다.

목표는 다음과 같다.

- 최초 페이지 로드 시 모든 문서 view model을 한 번에 받는다.
- 문서 선택은 클라이언트 상태로 처리한다.
- 저장, AI 초안 작성, 분석 적용, 제외, supersede 같은 DB 변경 작업은 서버 액션으로 유지한다.
- 기존 deep link는 초기 진입 시에만 유지한다.

## 2. 현재 문제

현재 `/projects/[id]/documents`는 서버 컴포넌트이며 선택 문서 타입을 `searchParams.type`으로 결정한다.
`DocumentCoverageGrid`는 각 문서 카드를 `Link`로 렌더링한다.

따라서 `roadmap`, `backlog`, `risk_log` 같은 문서를 선택할 때마다 URL이 바뀌고 Next.js App Router가 서버 컴포넌트 payload를 다시 요청한다.
하지만 페이지는 이미 모든 문서 view model을 만들고 있으므로 선택 전환 자체에는 추가 데이터 요청이 필요 없다.

## 3. 구현 원칙

### 읽기 선택은 클라이언트 상태로 둔다

문서 목록과 본문은 최초 서버 렌더링에서 모두 전달한다.
선택된 문서 타입은 `ProjectDocumentsWorkspace`의 `useState`로 관리한다.

### 쓰기 작업은 서버 액션으로 둔다

아래 작업은 DB를 바꾸므로 서버 액션으로 유지한다.

- 템플릿으로 생성.
- AI 초안 작성.
- 문서 저장.
- 분석 적용.
- 분석 제외.
- superseded 처리.
- 프로젝트 상태 새로고침.

### URL은 초기 선택값으로만 사용한다

`?type=roadmap`으로 진입하면 roadmap을 초기 선택한다.
이후 탭 전환은 네트워크 요청을 피하기 위해 URL navigation을 하지 않는다.

URL 동기화가 필요하면 후속 작업에서 `window.history.replaceState`를 검토한다.

## 4. 변경 대상

### 4.1 새 클라이언트 컴포넌트 추가

파일 후보는 `components/projects/ProjectDocumentsWorkspace.tsx`다.

역할은 다음과 같다.

- `useState<ProjectDocumentType>`로 `selectedType` 관리.
- 전달받은 `viewModels`에서 `selectedDocument` 계산.
- `DocumentCoverageGrid`와 `ProjectDocumentEditor` 렌더링.
- `ProjectDocumentEditor`에 `key={selectedDocument.type}` 유지.
- 문서 선택 시 `setSelectedType(item.type)`만 호출.

### 4.2 `DocumentCoverageGrid`를 button 기반으로 변경

현재 `DocumentCoverageGrid`는 `Link`를 사용한다.
이를 선택 callback 기반 컴포넌트로 바꾼다.

변경 방향은 다음과 같다.

- `projectId` prop 제거.
- `onSelect: (type: ProjectDocumentType) => void` prop 추가.
- 카드 root를 `button type="button"`으로 변경.
- 선택된 카드에 `aria-pressed` 또는 `aria-current`에 준하는 접근성 속성 추가.
- 기존 스타일은 유지한다.

주의할 점은 이 컴포넌트가 event handler를 받으므로 client component가 되어야 한다는 점이다.
`ProjectDocumentsWorkspace` 내부 전용으로만 쓰면 `DocumentCoverageGrid` 자체를 client component로 바꿔도 영향 범위가 작다.

### 4.3 서버 페이지 역할 축소

`app/[locale]/projects/[id]/documents/page.tsx`는 계속 서버 컴포넌트로 둔다.

유지할 역할은 다음과 같다.

- auth 확인.
- 프로젝트 소유권 확인.
- translations 로드.
- project, plan, documents, setup state, latest snapshot 조회.
- `buildProjectDocumentViewModels` 호출.
- metric 계산.
- 서버 액션 bind.
- `ProjectDocumentsWorkspace`에 초기 데이터와 labels 전달.

서버 페이지에서 제거할 역할은 다음과 같다.

- `selectedDocument` 계산.
- 선택된 문서 기준 `applyAction`, `excludeAction`, `supersedeAction` bind.
- `DocumentCoverageGrid`와 `ProjectDocumentEditor` 직접 렌더링.

### 4.4 apply/exclude/supersede 액션 입력 구조 변경

현재 `applyProjectDocumentAction`은 `documentId`, `documentType`, `isApplied`를 bind 인자로 받는다.
클라이언트 선택 구조에서는 선택된 문서가 런타임에 바뀌므로 form data 기반이 더 단순하다.

권장 변경은 다음과 같다.

```ts
applyProjectDocumentAction(locale, projectId, formData)
```

form data 필드는 다음과 같다.

- `documentId`
- `documentType`
- `isApplied`

`markProjectDocumentSupersededAction`도 같은 방향으로 바꾼다.

```ts
markProjectDocumentSupersededAction(locale, projectId, formData)
```

form data 필드는 다음과 같다.

- `documentId`
- `documentType`

이렇게 하면 `ProjectDocumentEditor`는 현재 선택 문서의 hidden input만 렌더링하면 된다.

### 4.5 `ProjectDocumentEditor` props 정리

현재 editor는 `applyAction`, `excludeAction`, `supersedeAction`을 선택 문서 기준으로 받는다.
변경 후에는 문서별 action bind가 아니라 공통 action을 받는다.

권장 props는 다음과 같다.

- `applyAction?: (formData: FormData) => void | Promise<void>`
- `excludeAction?: (formData: FormData) => void | Promise<void>`
- `supersedeAction?: (formData: FormData) => void | Promise<void>`

각 form에는 hidden input을 둔다.

- `documentId`
- `documentType`
- `isApplied`

PRD는 기존처럼 적용 버튼을 표시하지 않는다.

### 4.6 metric 계산 위치

`usableCount`, `appliedCount`, `staleCount`는 서버 페이지에서 계산해도 되고 workspace에서 계산해도 된다.

첫 구현에서는 서버 페이지 계산을 유지한다.
이 값들은 저장이나 적용 이후 redirect로 다시 로드될 때 갱신된다.

클라이언트에서 낙관적 업데이트를 하지 않는 한, metric을 클라이언트로 옮길 실익은 작다.

## 5. 구현 순서

1. `ProjectDocumentsWorkspace` client component를 추가한다.
   검증은 타입 체크로 한다.

2. `DocumentCoverageGrid`를 button 기반 선택 컴포넌트로 바꾼다.
   검증은 선택 callback 타입과 UI 렌더링 구조 확인으로 한다.

3. `applyProjectDocumentAction`과 `markProjectDocumentSupersededAction`을 form data 기반으로 바꾼다.
   검증은 기존 호출부가 모두 새 시그니처에 맞는지 타입 체크로 한다.

4. `ProjectDocumentEditor`의 적용, 제외, supersede form에 hidden input을 추가한다.
   검증은 PRD가 적용 버튼을 표시하지 않고, 저장된 비 PRD 문서만 적용 버튼을 표시하는 조건을 유지하는지 확인한다.

5. 서버 page를 workspace 렌더링 구조로 단순화한다.
   검증은 build에서 server/client boundary 오류가 없는지 확인한다.

6. 단위 테스트를 보강한다.
   최소 검증은 `buildProjectDocumentViewModels` 테스트 유지와 action parsing helper가 생기면 helper 테스트 추가다.

7. `npm run build`, `npm run lint`, 관련 `vitest`를 실행한다.

## 6. 테스트 계획

### 단위 테스트

기존 테스트를 유지한다.

- `tests/project-document-templates.test.ts`
- `tests/project-document-view-models.test.ts`
- `tests/project-document-draft-ai.test.ts`

추가 후보는 action form parsing helper 테스트다.
서버 액션 내부에 parsing 로직이 직접 들어가면 테스트가 어렵기 때문에 아래 helper를 분리할 수 있다.

```ts
parseProjectDocumentApplyInput(formData)
parseProjectDocumentSupersedeInput(formData)
```

테스트해야 할 조건은 다음과 같다.

- 올바른 `documentId`, `documentType`, `isApplied`가 parse된다.
- PRD는 적용 상태 변경 대상에서 거부된다.
- 잘못된 document type은 거부된다.

### 빌드와 lint

필수 검증 명령은 다음과 같다.

```bash
npx vitest run tests/project-document-templates.test.ts tests/project-document-view-models.test.ts tests/project-document-draft-ai.test.ts
npm run build
npm run lint
```

### 수동 확인

로컬 서버에서 다음을 확인한다.

- `/ko/projects/{id}/documents?type=roadmap` 진입 시 roadmap이 초기 선택된다.
- 문서 카드를 눌러도 URL navigation 또는 RSC 요청 없이 선택 문서가 바뀐다.
- 제목과 본문이 이전 탭 값으로 남지 않는다.
- 저장 후 페이지가 최신 데이터로 다시 표시된다.
- AI 초안 작성 후 생성된 내용이 저장되어 다시 표시된다.
- 분석 적용과 제외가 기존처럼 동작한다.

## 7. 리스크와 대응

### Server Action을 client component에 전달하는 경계 문제

Next.js에서 서버 액션은 server component에서 client component로 prop으로 전달할 수 있다.
다만 action을 객체나 배열 안에 깊게 넣는 패턴은 피한다.

대응은 action props를 명시적으로 전달하는 것이다.

### uncontrolled input 값 잔존

선택 문서가 바뀌어도 textarea DOM 값이 이전 문서 값을 유지할 수 있다.

대응은 `ProjectDocumentEditor`에 `key={selectedDocument.type}`를 유지하는 것이다.

### URL deep link 후속 동기화

탭 전환 중 URL을 갱신하지 않으면 현재 선택 문서를 복사해서 공유하기 어렵다.

대응은 첫 구현에서는 초기 선택만 지원하고, 필요하면 후속 작업에서 `window.history.replaceState`를 추가하는 것이다.

### mutation 후 상태 최신화

저장 또는 AI 초안 작성 후 기존 클라이언트 state에는 이전 view model이 남을 수 있다.

대응은 기존 서버 액션 redirect와 revalidate 흐름을 유지하는 것이다.
후속 개선에서 optimistic update 또는 `router.refresh`를 검토한다.

## 8. 완료 기준

- 문서 선택 시 `Link` navigation이 제거된다.
- 최초 로드된 `viewModels`만으로 문서 선택과 editor 전환이 동작한다.
- 저장, AI 초안 작성, 분석 적용, 제외, supersede는 기존 DB 동작을 유지한다.
- PRD는 계속 현재 계획 원본으로 취급된다.
- 비 PRD 문서는 계속 저장 후에만 분석 적용이 가능하다.
- 관련 vitest, build, lint가 통과한다.

## 9. 권장 후속 작업

첫 구현 이후 다음을 검토한다.

- 선택 문서 URL 동기화를 `window.history.replaceState`로 복원.
- 저장 후 redirect 대신 `router.refresh`와 pending 상태로 UX 개선.
- 문서별 apply 상태를 낙관적으로 갱신.
- Playwright로 탭 전환 시 네트워크 요청 감소를 계측.

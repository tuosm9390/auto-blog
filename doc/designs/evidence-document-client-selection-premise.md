# Evidence Document Client Selection Premise

## 1. 질문

Evidence 문서 관리 페이지에서 사용자가 문서 카드를 선택할 때마다 API 또는 RSC 요청이 발생하는 것처럼 보인다.
이미 모든 문서 데이터를 한 번에 가져오고 있다면, 문서 선택은 클라이언트 상태만 바꿔서 처리할 수 있는지 확인한다.

추가로 AI 초안 작성으로 생성된 문서가 자동으로 DB에 저장되는지도 확인한다.

## 2. 현재 코드 기준 사실

### AI 초안 작성 저장 동작

`generateProjectDocumentDraftAction`은 AI가 생성한 결과를 자동으로 저장한다.

- PRD 문서는 `upsertCurrentProjectPlan`을 통해 `project_plans`의 현재 계획으로 저장된다.
- PRD가 아닌 Evidence 문서는 `upsertProjectDocument`를 통해 `project_documents`에 저장된다.
- 생성된 비 PRD 문서는 `isApplied: false`, `status: draft`로 저장된다.
- 따라서 AI 초안 작성은 DB 저장까지 수행하지만, 비 PRD 문서를 자동으로 분석 적용하지는 않는다.
- 사용자는 생성된 문서를 검토한 뒤 별도로 `분석에 적용`을 눌러야 다음 상태 분석 입력에 포함된다.

### 문서 선택 동작

`/projects/[id]/documents` 페이지는 서버 컴포넌트다.

페이지 렌더링 시 다음 데이터를 한 번에 조회한다.

- project
- current plan
- project documents
- project documents setup state
- latest state snapshot
- translations

그 후 `buildProjectDocumentViewModels`로 8개 문서의 view model을 모두 만든다.

하지만 선택된 문서 타입은 `searchParams.type`에서 읽는다.
`DocumentCoverageGrid`의 각 카드는 `Link`로 `/projects/{id}/documents?type={type}`에 이동한다.
따라서 사용자가 카드 또는 탭을 누를 때마다 URL이 바뀌고, Next.js App Router가 서버 컴포넌트 payload를 다시 요청한다.

즉, 데이터가 부족해서 매번 요청하는 것이 아니라 선택 상태가 URL navigation으로 설계되어 있기 때문에 요청이 발생한다.

## 3. 클라이언트 상태 전환 가능성

가능하다.

현재 페이지는 이미 모든 문서 view model을 가지고 있으므로, 선택 상태만 클라이언트 컴포넌트의 `useState`로 옮기면 문서 선택은 네트워크 요청 없이 즉시 바뀔 수 있다.

구조는 다음과 같이 바꿀 수 있다.

1. 서버 페이지는 현재처럼 모든 문서 데이터를 조회한다.
2. 서버 페이지는 `viewModels`, action 바인딩, labels를 클라이언트 컴포넌트에 전달한다.
3. 클라이언트 컴포넌트는 `selectedType`을 `useState`로 관리한다.
4. 문서 카드는 `Link` 대신 `button`으로 렌더링한다.
5. 선택된 문서에 따라 editor 내용을 클라이언트에서 교체한다.
6. 저장, AI 초안 작성, 분석 적용, 제외, supersede는 기존 서버 액션을 그대로 호출한다.

## 4. 장점

- 문서 탭 전환이 즉시 반응한다.
- 불필요한 RSC 재요청이 줄어든다.
- 문서 카드 선택이 URL 이동보다 앱 내부 interaction에 가깝게 느껴진다.
- 이미 로드된 `viewModels`를 활용하므로 추가 API 설계가 필요 없다.

## 5. 주의할 점

### URL 공유 가능성이 줄어든다

현재 구조는 `?type=roadmap` 같은 URL을 공유하면 해당 문서가 바로 열린다.
클라이언트 상태만 쓰면 이 deep link가 사라진다.

권장 전제는 다음과 같다.

- 초기 진입 시에는 `searchParams.type`을 읽어 초기 선택값으로 사용한다.
- 사용자가 탭을 바꿀 때는 `history.replaceState` 또는 router replace를 선택적으로 사용한다.
- 단, router replace를 쓰면 다시 navigation이 발생할 수 있으므로 네트워크 요청 제거가 목표라면 `window.history.replaceState`를 검토한다.

### 서버 액션 후 최신 데이터 반영이 필요하다

저장, AI 초안 작성, 분석 적용 같은 mutation은 DB를 바꾼다.
이후 화면에는 최신 DB 결과가 반영되어야 한다.

가능한 선택지는 두 가지다.

- 기존처럼 서버 액션 후 redirect와 revalidate를 수행한다.
- 더 나은 UX를 원하면 서버 액션 후 클라이언트 상태를 낙관적으로 갱신하거나 `router.refresh`를 한 번만 호출한다.

첫 구현에서는 기존 redirect 기반 mutation을 유지하는 편이 안전하다.
탭 선택만 클라이언트 상태로 바꿔도 사용자가 느끼는 반복 요청 문제는 대부분 줄어든다.

### editor의 uncontrolled input 처리

현재 `ProjectDocumentEditor`는 `defaultValue` 기반 input과 textarea를 사용한다.
선택 문서가 바뀔 때 editor를 remount하지 않으면 이전 문서의 DOM 값이 남을 수 있다.

클라이언트 컴포넌트로 옮길 때도 `key={selectedDocument.type}` 또는 controlled state reset이 필요하다.

### 서버 액션 바인딩 방식

현재 page server component에서 선택된 문서 기준으로 `applyAction`, `excludeAction`, `supersedeAction`을 bind한다.
클라이언트 선택으로 바꾸면 선택된 문서가 런타임에 바뀌므로 다음 중 하나가 필요하다.

- 문서별 action binding map을 서버에서 만들어 클라이언트에 전달한다.
- server action form에 `documentId`, `documentType`, `isApplied` hidden input을 넣고 action이 form data에서 읽도록 바꾼다.

권장안은 hidden input 방식이다.
문서별 action 함수를 많이 전달하지 않아도 되고, 클라이언트 선택 상태와 서버 액션 입력이 자연스럽게 맞는다.

## 6. 권장 구현 전제

첫 구현 범위는 다음으로 제한한다.

- `/projects/[id]/documents`는 계속 서버 페이지로 둔다.
- 새 클라이언트 컴포넌트 `ProjectDocumentsWorkspace`를 만든다.
- 서버 페이지는 모든 `viewModels`, project id, labels, 서버 액션을 workspace에 전달한다.
- `DocumentCoverageGrid`는 클라이언트 workspace 안에서 button 기반 선택 UI로 바꾼다.
- `ProjectDocumentEditor`는 선택된 문서를 props로 받고 `key={selectedDocument.type}`를 유지한다.
- mutation은 기존 서버 액션을 유지하되, apply/exclude/supersede는 form data 기반으로 바꾸는 것을 우선 검토한다.
- deep link는 초기 선택값으로만 지원하고, 탭 전환 중 URL 동기화는 후속 개선으로 둔다.

## 7. 결론

문서 선택을 위해 매번 서버 요청을 보낼 필요는 없다.
현재 구조에서도 모든 문서 view model은 이미 한 번에 준비되므로, 선택 상태를 클라이언트로 옮기면 네트워크 요청 없이 문서 내용을 전환할 수 있다.

다만 저장, AI 초안 작성, 분석 적용은 DB 상태를 바꾸는 작업이므로 서버 액션으로 유지해야 한다.
따라서 올바른 방향은 “읽기 선택은 클라이언트 상태, 쓰기 작업은 서버 액션”으로 역할을 나누는 것이다.

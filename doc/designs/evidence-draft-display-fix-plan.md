# Evidence Draft Display Fix Plan

> 작성일: 2026-05-28
> 대상 화면: `/projects/[id]/documents`
> 목표: 각 Evidence 문서 탭에서 해당 문서 유형에 맞는 제목과 초안 본문이 정확히 표시되도록 한다.

## 1. 문제 요약

현재 문서 관리 화면에서 문서 탭을 바꿔도 `문서 제목`과 `문서 내용` 입력값이 이전 탭 값처럼 유지될 수 있다.

동시에 저장된 문서가 없는 Evidence 유형은 `lib/project-document-templates.ts`에 초안이 있어도 editor 본문에는 표시되지 않는다. 사용자는 Roadmap, Backlog, Decision Log 같은 탭을 눌렀을 때 각 문서에 맞는 초안을 기대하지만, 실제 화면은 빈 본문이거나 이전 탭의 DOM 값을 보여줄 수 있다.

## 2. 원인

원인은 두 가지다.

1. `ProjectDocumentEditor`가 uncontrolled input을 사용한다.
   `defaultValue`는 최초 mount 시점에만 DOM에 반영된다. 탭 전환은 `?type=roadmap` 같은 query string 변경으로 처리되고, React가 같은 editor 컴포넌트를 재사용하면 기존 input과 textarea DOM 값이 유지된다.

2. `buildDocumentViewModels`가 저장 전 template body를 editor 값으로 넘기지 않는다.
   저장된 문서가 없을 때 title은 template title을 쓰지만, `contentMarkdown`는 빈 문자열로 둔다. 그래서 각 문서 유형별 초안 본문이 화면에 나타나지 않는다.

## 3. 수정 전제

수정 전제는 다음과 같다.

- 문서 탭 전환 시 editor는 선택된 `documentType` 기준으로 새로 mount되어야 한다.
- 저장된 문서가 있으면 저장된 `title`과 `content_markdown`을 표시한다.
- 저장된 문서가 없으면 해당 `documentType`의 template title과 template body를 초안으로 표시한다.
- 초안 표시와 저장은 분리한다. 사용자가 `문서 저장` 또는 `템플릿으로 생성`을 누르기 전까지 DB에는 쓰지 않는다.
- PRD는 기존 결정대로 `project_plans`를 원본으로 유지한다.
- PRD plan이 없으면 PRD template 초안을 보여주지만, 저장은 `upsertCurrentProjectPlan`을 통해 plan에 반영한다.
- 일반 Evidence 문서는 저장 전에는 `documentId = null` 상태를 유지하고, 저장 후에만 `project_documents` row를 가진다.
- `분석에 적용`, `분석에서 제외`, `대체됨으로 표시` 버튼은 저장된 일반 Evidence 문서에만 표시한다.

## 4. 구현 변경

### 4.1 Editor remount 보장

`app/[locale]/projects/[id]/documents/page.tsx`에서 `ProjectDocumentEditor`에 key를 추가한다.

```tsx
<ProjectDocumentEditor
  key={selectedDocument.type}
  ...
/>
```

이 변경으로 탭 전환 시 React가 input과 textarea DOM을 새로 만들고, 선택된 문서의 `defaultValue`가 다시 반영된다.

### 4.2 저장 전 template body 표시

`buildDocumentViewModels`에서 저장된 문서가 없을 때도 template body를 넘긴다.

PRD 처리 규칙은 다음과 같다.

```ts
contentMarkdown: plan?.content_markdown ?? template.contentMarkdown
```

일반 Evidence 문서 처리 규칙은 다음과 같다.

```ts
contentMarkdown: document?.content_markdown ?? template.contentMarkdown
```

단, 저장 여부 판단은 `documentId`와 기존 plan 존재 여부를 기준으로 유지한다. template body가 화면에 보인다고 해서 저장된 문서로 간주하면 안 된다.

### 4.3 저장 전 상태 표시 보정

저장 전 template 초안은 화면상 `draft`로 보이게 한다.

권장 방식은 `buildDocumentViewModels`에서 저장된 문서가 없을 때 readiness를 `draft`로 고정하는 것이다. 이렇게 하면 template body가 충분히 길거나 keyword를 포함해도 저장되지 않은 문서가 `usable`로 보이는 혼선을 피할 수 있다.

저장된 문서는 기존 `buildDocumentSummary`와 `estimateDocumentReadiness`를 그대로 사용한다.

### 4.4 안내 문구 보정

현재 empty hint는 “템플릿으로 초안을 만들거나 직접 마크다운을 입력하세요.”에 가깝다. template body가 바로 보이는 구조로 바뀌면 다음 의미가 더 정확하다.

- 한국어: “표시된 초안은 아직 저장되지 않았습니다. 수정 후 문서 저장을 누르세요.”
- 영어: “This draft is not saved yet. Edit it, then save the document.”

필수는 아니지만 혼선을 줄이기 위해 메시지를 바꾸는 것을 권장한다.

## 5. 테스트 계획

### Unit test

`tests/project-document-templates.test.ts` 또는 새 test에 다음 케이스를 추가한다.

- missing Roadmap view model이 `Roadmap` title과 Roadmap template body를 가진다.
- missing Backlog view model이 `Backlog` title과 Backlog template body를 가진다.
- 저장된 document가 있으면 template이 아니라 저장된 title과 body를 우선한다.
- 저장 전 template draft는 readiness가 `draft`로 표시된다.

현재 `buildDocumentViewModels`가 page 파일 내부 함수라 테스트하기 어렵다. 테스트 가능성을 높이려면 view model builder를 `lib/project-document-view-models.ts`로 분리하는 것이 좋다.

### Build 검증

다음 검증을 실행한다.

```text
npm run build
npm run lint
```

### 수동 검증

수동 확인 순서는 다음과 같다.

1. `/projects/[id]/documents`에 진입한다.
2. Roadmap 탭을 클릭하면 Roadmap 제목과 Roadmap 초안 본문이 보인다.
3. Backlog 탭을 클릭하면 Backlog 제목과 Backlog 초안 본문으로 즉시 바뀐다.
4. Decision Log 탭을 클릭하면 Decision Log 초안 본문으로 즉시 바뀐다.
5. 저장하지 않고 다른 탭으로 이동해도 DB row가 생기지 않는다.
6. `문서 저장`을 누르면 해당 문서 유형으로 저장된다.
7. 저장 후 다시 탭을 열면 저장된 내용이 template보다 우선 표시된다.

## 6. 구현 범위

이번 수정은 표시와 저장 전 초안 UX에만 한정한다.

이번에 하지 않을 일은 다음과 같다.

- template 자동 저장.
- document versioning.
- block editor 전환.
- AI 초안 생성.
- 분석 파이프라인 변경.
- DB schema 변경.

## 7. 완료 기준

완료 기준은 다음이다.

- 모든 Evidence 탭에서 서로 다른 문서 유형별 초안 제목과 본문이 표시된다.
- 탭 전환 시 이전 탭의 입력값이 남지 않는다.
- 저장된 문서가 있으면 저장된 내용이 template보다 우선한다.
- 저장 전 template 초안은 DB에 저장된 문서처럼 취급되지 않는다.
- `npm run build`가 통과한다.
- `npm run lint`가 통과한다.

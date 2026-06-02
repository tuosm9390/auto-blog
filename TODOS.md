# TODOS.md — Synapso.dev (auto-blog)

## 포스트 / 커밋 (Posts)

### [P2] 포스트 수정 폼에 is_public 토글 추가

**What:** EditForm(`/app/[locale]/[username]/[slug]/edit`)에 `is_public` 토글 UI 추가 — 레포 공개/비공개 전환 후 사후 변경 지원

**Why:** `is_public`은 포스트 생성 시 자동 설정되지만, 사용자가 GitHub에서 레포 공개 여부를 바꿨을 때 기존 포스트를 수동으로 업데이트할 방법이 없음. 커밋 링크 가시성이 영구적으로 잘못 설정될 수 있음.

**Pros:**
- 사용자 자율성 확보 (private → public 전환 후 링크 복원 가능)
- 구현 단순: 체크박스 1개 + `updatePost` 파라미터 추가

**Cons:**
- EditForm + `updatePost` + `updateSchema` 3곳 수정 필요
- 사용자가 의도치 않게 private 레포를 public으로 잘못 설정할 수 있음

**Context:**
`is_public` DB 컬럼 추가(commit link visibility PR) 이후 진행. `updatePost` 함수가 현재 `is_public`을 수정하지 않음 — 여기서 확장 필요. 토글 라벨: "커밋 링크를 방문자에게 공개" (체크 = public).

**Effort:** XS (human) → XS (CC+gstack)
**Depends on:** commit link visibility PR 머지 완료

---

### [P2] 커밋 링크 조건부 렌더링 단위 테스트

**What:** `isOwner || post.is_public` 4가지 Case를 검증하는 vitest/jest 단위 테스트 추가

**Why:** 테스트 인프라가 없는 상태에서 새로운 보안 관련 조건 분기가 추가됨. 회귀 방지를 위한 최소 테스트 필요.

**Pros:**
- 4개 케이스(오너+public, 오너+private, 비오너+public, 비오너+private) 명시적 검증
- 테스트 인프라 구축 시 다른 컴포넌트 테스트의 발판이 됨

**Cons:**
- 현재 프로젝트에 테스트 인프라(vitest/jest) 없음 — 신규 구축 필요 (vitest + @testing-library/react)
- Next.js 15 서버 컴포넌트 테스트 설정 복잡도 있음

**Context:**
`app/[locale]/[username]/[slug]/page.tsx`의 커밋 렌더링 블록 (현재 line 137-156) 테스트 대상. 서버 컴포넌트이므로 vitest + msw로 Supabase 쿼리 모킹 전략 고려. 또는 조건 로직만 별도 순수 함수로 분리하면 단위 테스트가 훨씬 쉬워짐.

**Effort:** M (human) → S (CC+gstack)
**Depends on:** commit link visibility PR 머지 완료

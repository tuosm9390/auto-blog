# TODOS.md — Synapso.dev (auto-blog)

## 결제/구독 (Billing)

### [P2] 세금계산서/현금영수증 자동 발행

**What:** PortOne 결제 완료 후 국세청 API 연동을 통한 세금계산서(법인 고객) 및 현금영수증(B2C) 자동 발행

**Why:** 한국 법인 고객은 세금계산서 없으면 결제 자체를 거부할 수 있음 — B2B 수요 발생 즉시 블로커가 됨

**Pros:**
- PortOne 결제 내역 API + 국세청 연동으로 자동화 가능
- B2B 단가가 높아 몇 건만 전환해도 ROI 확보

**Cons:**
- 국세청 홈택스 API 연동 복잡도 높음 (인증서 기반)
- 사업자 정보 수집 UI 추가 필요

**Context:**
PortOne 마이그레이션(master 브랜치) 완료 후 진행. PortOne이 결제 내역 API를 제공하므로 영수증 데이터 조회는 가능. 국세청 전자세금계산서 발급은 별도 공인인증서 또는 전자세금계산서 발급 대행 서비스(예: 이지세금계산서) 활용 검토 필요.

**Effort:** L (human) → M (CC+gstack)
**Depends on:** PortOne 마이그레이션 완료, B2B 고객 1건 이상 확보

---

### [P2] Cron 배치 결제 병렬화 (Promise.allSettled)

**What:** 월간 자동 결제 Cron의 순차 루프(`for...of`) → `Promise.allSettled` 기반 병렬 배치 처리로 전환

**Why:** 사용자 수 증가 시 Cron 실행 시간 O(N) 선형 증가 → Vercel Cron 60초 제한 도달. 100명 이상 시 문제 시작.

**Pros:**
- Vercel Cron 60초 실행 시간 내 관리 가능
- 실패한 사용자와 성공한 사용자를 allSettled로 분리 처리

**Cons:**
- 배치 실패 시 부분 성공/부분 실패 혼합 처리 복잡도 증가
- PortOne API Rate Limit과 충돌 가능 (배치 크기 제한 필요)

**Context:**
초기에는 `for...of` 순차 루프로 구현(MVP). 결제 완료 사용자 100명 돌파 시점에 전환 예정. `Promise.allSettled`로 10-20명씩 배치 처리하되 각 배치 간 100ms 딜레이 추가하여 Rate Limit 회피. 실패 목록은 별도 `past_due` 업데이트 후 3일 후 Cron에서 재시도.

**Effort:** S (human) → S (CC+gstack)
**Depends on:** PortOne 마이그레이션 완료, 유료 사용자 100명 달성

---

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

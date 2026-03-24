# Tasks: Marketing Demo Page

**Input**: Design documents from `/specs/001-marketing-demo/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and archiving

- [X] T001 Archive existing demo page by moving `app/[locale]/demo` to `app/[locale]/demo-archive`
- [X] T002 Archive existing demo API by moving `app/api/demo` to `app/api/demo-archive`
- [X] T003 Create directory structure for new demo feature: `app/[locale]/demo`, `components/demo`, `lib/demo.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data processing and security

- [X] T004 Implement `getDemoPosts` and `getDemoPostBySlug` in `lib/demo.ts` using strict security filtering (must be `published` and `not deleted`) and PII stripping
- [X] T005 [P] Implement `stripGithubLinks` utility function using Regex in `lib/demo.ts`
- [X] T006 Define `DemoPost` Zod schemas in `lib/types.ts` reflecting all fields and validation rules in `data-model.md`

---

## Phase 3: User Story 1 - Public Demo Viewing (Priority: P1) 🎯 MVP

**Goal**: Enable guest users to browse and read public tech blog posts

**Independent Test**: Access `/demo` as a guest and confirm post list and detail page loads correctly.

### Tests for User Story 1

- [X] T007 [P] [US1] Create integration test for guest access to `/demo` path (no Auth headers)
- [X] T008 [P] [US1] Create unit test for `getDemoPosts` ensuring strict filtering of non-public data

### Implementation for User Story 1

- [X] T009 [P] [US1] Create `components/demo/DemoPostCard.tsx` using `DemoPost` data
- [X] T010 [US1] Implement demo list page in `app/[locale]/demo/page.tsx` with ISR (`revalidate = 3600`)
- [X] T011 [US1] Implement demo detail page in `app/[locale]/demo/[slug]/page.tsx` with ISR

**Checkpoint**: User Story 1 functional - Guests can view the post gallery.

---

## Phase 4: User Story 2 - Restricted Interactions (Priority: P2)

**Goal**: Enforce read-only experience and remove external links/PII

**Independent Test**: Verify detail page has no edit buttons and commit links are text-only.

### Tests for User Story 2

- [X] T012 [P] [US2] Create test ensuring `DemoPostContent` removes `github.com` commit links
- [X] T013 [P] [US2] Create test ensuring PII (author name) is absent from the DOM
- [X] T013-Nav [P] [US2] Create test verifying "Go Back" button correctly navigates back or to `/demo`

### Implementation for User Story 2

- [X] T014 [P] [US2] Create `components/demo/DemoPostContent.tsx` using link stripping utility
- [X] T015 [US2] Update `app/[locale]/demo/[slug]/page.tsx` to use `DemoPostContent` and hide edit/delete UI
- [X] T016 [US2] Implement "Go Back" navigation button in `app/[locale]/demo/[slug]/page.tsx` replacing user-specific nav

**Checkpoint**: User Story 2 functional - Content is sanitized and interactions are restricted.

---

## Phase 5: User Story 3 - Specialized Demo Header (Priority: P3)

**Goal**: Optimize header layout for marketing conversion

**Independent Test**: Confirm `/demo` pages show simplified header with "Tester Apply" button.

### Implementation for User Story 3

- [X] T017 [P] [US3] Implement `components/demo/DemoHeader.tsx` with Logo, LanguageSwitcher, and 강조된 "테스터 신청" 버튼
- [X] T018 [US3] Create specialized layout for demo routes in `app/[locale]/demo/layout.tsx` using `DemoHeader`

**Checkpoint**: User Story 3 functional - Marketing-optimized layout is active.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and SEO

- [X] T019 [P] Add SEO meta tags (OpenGraph, Description) for demo pages
- [X] T020 Run `quickstart.md` validation checklist
- [X] T021 Final linting and type checking (`npm run lint` && `tsc`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Phase 1 structure.
- **User Story 1 (P1)**: Depends on Phase 2 (Data fetching logic).
- **User Story 2 (P2)**: Depends on US1 (Detail page must exist).
- **User Story 3 (P3)**: Depends on US1 (Page structure must exist).
- **Polish (Final)**: Depends on all user stories.

### Parallel Opportunities

- T005 (Regex utility) can run parallel with T004 (Fetching logic).
- Tests (T007, T008, T012, T013) can run in parallel with their respective implementation tasks.
- US3 Header implementation can start as soon as `app/[locale]/demo/layout.tsx` is initialized.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Archive old logic.
2. Implement basic fetching and `/demo` list/detail pages.
3. **STOP and VALIDATE**: Ensure guest users can see the gallery.

### Incremental Delivery

1. Add PII/Link stripping logic (US2).
2. Swap regular Header with DemoHeader (US3).
3. Final SEO and verification.

# Context Notes

## 2026-05-29 Evidence Client Selection Implementation

- Decision: Keep `/projects/[id]/documents` as a server page for auth, data loading, and translation loading.
- Decision: Move document tab selection into a new client workspace so switching cards does not navigate to `?type=` links.
- Decision: Convert apply/exclude/supersede actions to read hidden form fields, because selected document identity now changes on the client.
- Verification: `npx vitest run tests/project-document-action-inputs.test.ts tests/project-document-draft-ai.test.ts tests/project-document-templates.test.ts tests/project-document-view-models.test.ts`, `npm run build`, and `npm run lint` pass.
- Verification: Local dev server responds at `http://localhost:3010/ko/projects`.

## 2026-05-29 Evidence Client Selection Implementation Plan

- Input: Use `doc/designs/evidence-document-client-selection-premise.md` as the source premise.
- Decision: Plan implementation around a thin client workspace that owns only selection state, while the server page keeps authentication, data loading, translation loading, and action binding.
- Decision: Use form hidden inputs for document-specific mutation parameters so apply/exclude/supersede can work with client-selected documents without creating per-document action maps.
- Output: Wrote `doc/designs/evidence-client-selection-implementation-plan.md` with component changes, server action changes, test plan, risks, and completion criteria.

## 2026-05-29 Evidence Document Client Selection Premise

- Observation: `generateProjectDocumentDraftAction` persists AI-generated PRD drafts through `upsertCurrentProjectPlan` and non-PRD Evidence drafts through `upsertProjectDocument`.
- Observation: `/projects/[id]/documents` already fetches plan, documents, setup state, project, and latest snapshot once per server render, but document selection is encoded in `searchParams.type`.
- Observation: `DocumentCoverageGrid` uses `Link` to `/projects/{id}/documents?type={type}`, so each selection performs navigation and triggers a new server component request.
- Decision: Client-side selection is feasible because the page already has all document view models needed to render every tab, but mutation actions should remain server actions and revalidate after writes.
- Output: Wrote `doc/designs/evidence-document-client-selection-premise.md` with the storage answer, current request cause, client-state feasibility, risks, and recommended implementation premise.

## 2026-05-28 Evidence AI Draft Generation

- Observation: `Apply to analysis` only marks saved non-PRD documents as included in future refresh runs; it does not create usable document content.
- Observation: The product needs a pre-analysis authoring step where an agent fills each Evidence document from project metadata, current PRD, existing documents, and the latest state snapshot.
- Decision: Add AI draft generation as a server action that writes the selected document body into the existing PRD or `project_documents` storage, without automatically applying non-PRD documents to analysis.
- Decision: Keep generated content in editable Markdown so users can review and adjust before applying it as evidence.
- Decision: The prompt uses project metadata, current PRD, related Evidence document summaries, latest state snapshot, existing document content, and the selected template structure.
- Verification: `npx vitest run tests/project-document-draft-ai.test.ts tests/project-document-templates.test.ts tests/project-document-view-models.test.ts`, `npm run build`, and `npm run lint` pass.

## 2026-05-28 Evidence Agent Prompt Addition

- Observation: Evidence templates already include `Agent Reading Notes`, but those notes tell the system how to interpret a document rather than giving the user a reusable prompt for agent collaboration.
- Decision: Add a document-specific `Agent Collaboration Prompt` section to each runtime template so users can ask an agent to analyze project state using the document as evidence.
- Decision: Keep prompts inside the editable markdown body so users can customize or remove them per project before saving.
- Verification: `npx vitest run tests/project-document-templates.test.ts tests/project-document-view-models.test.ts`, `npm run build`, and `npm run lint` pass.

## 2026-05-28 Evidence Draft Content Sync

- Observation: The documents UI reads its initial draft body from `lib/project-document-templates.ts`, not directly from `doc/designs/evidence-pack/`.
- Observation: The runtime templates still contain short placeholder bodies, so the page can switch tabs correctly while still showing under-specified draft content.
- Decision: Replace each runtime template with the corresponding evidence-pack draft structure, including metadata, evidence, and agent reading notes sections.
- Decision: Keep Korean and English runtime templates structurally aligned so locale switching does not regress document-specific draft rendering.
- Verification: `npx vitest run tests/project-document-templates.test.ts tests/project-document-view-models.test.ts`, `npm run build`, and `npm run lint` pass.

## 2026-05-28 Evidence Draft Display Fix Implementation

- Decision: Move the documents page view model builder into `lib/project-document-view-models.ts` so missing-template behavior can be unit-tested outside the Next page.
- Decision: Missing documents show their template body as an unsaved draft and use `draft` readiness, while stored documents and existing PRD plans still use persisted content.
- Decision: Add `key={selectedDocument.type}` to the editor so uncontrolled `defaultValue` fields remount on tab changes.
- Verification: `npx vitest run tests/project-document-templates.test.ts tests/project-document-view-models.test.ts`, `npm run build`, and `npm run lint` pass.

## 2026-05-28 Evidence Draft Display Fix Plan

- Observation: `ProjectDocumentEditor` uses uncontrolled `defaultValue` fields, so React can preserve the previous input DOM when only the selected `type` query parameter changes.
- Observation: `buildDocumentViewModels` uses template titles for missing documents but leaves `contentMarkdown` empty, so per-type draft bodies are not visible until "Create from template" runs.
- Decision: The fix should remount the editor by `selectedDocument.type` and show template content as an unsaved draft when no stored document exists.
- Decision: Showing a template draft must not imply persistence. DB writes should still happen only through `Save document` or `Create from template`.

## 2026-05-28 Project Documents Implementation

- Decision: Use a companion SQL script for `project_documents` instead of modifying only the existing core schema script, so existing deployments have a clear manual SQL to run.
- Decision: Keep v1 one-document-per-type for non-PRD Evidence docs with `UNIQUE(project_id, document_type)`.
- Decision: Keep `project_plans` as the PRD source of truth. The Documents page will show PRD as a document card but saving PRD will continue to call `upsertCurrentProjectPlan`.
- Decision: Compute readiness at read time so stale status can change with time without needing a background write.
- Scope: Implement textarea-based markdown editing, typed document cards, apply/exclude, and analysis evidence integration. Do not implement version history, block editing, comments, or external sync.
- Verification: `npx vitest run tests/project-document-templates.test.ts` and `npm run build` pass. `npm run lint` still fails on pre-existing unrelated lint errors in about/admin/auth/header/mobile/api utility files.

## 2026-05-28 Project Documents Implementation Plan

- Observation: `scripts/add-project-memory-core.sql` is the current project-memory schema source, so document storage should be added there or through a companion migration that follows the same RLS style.
- Observation: `refreshProjectState` currently loads only project, current plan, GitHub commits, PRs, and issues before calling `analyzeProjectState`.
- Decision: Implement in thin vertical slices: storage/types first, then CRUD actions, then page UI, then analysis integration. This keeps each step verifiable.
- Decision: The first editor should reuse markdown textarea patterns instead of introducing a block editor or external document sync.

## 2026-05-28 Project Documents Feature Design

- Assumption: Treat the feature as a real Synapso.dev SaaS product enhancement, not a demo-only editor.
- Observation: The current app has `project_plans` for one current plan, `state_snapshots` for state evidence, and no document-type CRUD or `/projects/[id]/documents` page.
- Decision: The feature should not become a generic Notion-style document system. Its core job is to make project-state analysis more inspectable and editable through typed Evidence documents.
- Decision: A new `project_documents` model is the correct product direction because the requested view, customize, apply, and save workflow requires per-document identity, status, freshness, and analysis linkage.
- Scope: This pass produces a design document only because `$office-hours` is a product/design review workflow, not an implementation workflow.

## 2026-05-26 GitHub OAuth redirect_uri 오류 수정

- Observation: The app uses NextAuth v5 with the default GitHub provider in `auth.ts`, so the GitHub OAuth callback path is `/api/auth/callback/github`.
- Constraint: Existing uncommitted changes in `DESCRIPTION.md` appear unrelated and should not be touched.
- Observation: Vercel has `AUTH_URL=https://synapso.dev` and the provider endpoint reports `callbackUrl=https://synapso.dev/api/auth/callback/github`.
- Decision: Add `AUTH_REDIRECT_PROXY_URL=https://synapso.dev/api/auth` in Vercel production/development and local `.env.local` so non-canonical hosts use the canonical GitHub callback instead of generating an unregistered `redirect_uri`.

## 2026-05-26 Individual Evidence Documents and Management Page Premise

- Decision: Split the Evidence Pack into individual docs under `doc/designs/evidence-pack/` so each document can evolve independently and later map cleanly to a project document type.
- Decision: Keep the product page premise separate from the templates. The templates describe what users write; the page premise describes how Synapso should let users manage, inspect, and connect those documents.
- Decision: The first product page should show document readiness and evidence coverage before becoming a full document editor. This avoids rebuilding Notion/Confluence and keeps the product centered on state judgment.

## 2026-05-26 Evidence Pack Templates

- Decision: Create a repo markdown template pack instead of changing UI, DB, or API in this pass. The current product stores one current plan in `project_plans`, so implementation should first stabilize the agent-readable document standard.
- Decision: Use 8 templates rather than all 11 document categories. The pack covers PRD, roadmap, backlog, sprint plan, decision/ADR, RFC, risk/issue/dependency, and release/ops learning.
- Decision: Every template includes state signals and agent reading notes so the document can feed `progress`, `blocker`, `risk`, `drift`, `watchNext`, and `evidence` judgments.

## 2026-05-26 Project Management Document Premise

- Decision: Treat project documents as evidence for project-state judgment, not as a generic document repository. This matches the current Project Memory pipeline better than rebuilding Confluence/Notion.
- Decision: Prioritize PRD, backlog/issues, decision log/ADR, risk/issue log, release/changelog, and state snapshots. These are the recurring artifacts across Atlassian, GitLab, Scrum, GitHub, SRE, and ADR practices.
- Decision: Keep stakeholder matrices, Gantt charts, full document editors, and enterprise approval workflows out of the first management-environment scope. They add process weight before the core solo-builder pain is solved.
- Scope: Created `doc/designs/project-management-document-premise.md` as the baseline premise for future design and implementation.

## 2026-05-07 PRD Template Guidance

- Decision: Add PRD guidance inside the project create/edit form because that is where users attach the current plan that powers snapshots, progress, and drift.
- Decision: Do not auto-fill the textarea with template content. Placeholder template text can accidentally be saved as real PRD content if the user submits without editing, so the template should be visible as guidance instead.
- Scope: Keep the first version as localized copy and UI guidance only. Do not add database fields, new routes, or AI generation for PRDs.

## 2026-05-31 init-deep AGENTS.md Knowledge Base

- Assumption: Treat `$omo:init-deep` as update mode because no `--create-new` flag was supplied.
- Observation: No existing `AGENTS.md` file was found under the repository outside ignored build/dependency folders.
- Observation: The repository is a Next.js 16 / React 19 localized SaaS app with about 402 tracked workspace files, 25k code/doc lines, and maximum directory depth 5.
- Decision: Generate a root `AGENTS.md` plus targeted child files only where the directory has a distinct operating model: `app/api`, `lib`, `components`, and `tests`.
- Decision: Do not generate child files for `doc`, `scripts`, or `app/[locale]` in this pass. Their rules are already captured by the root router and existing `doc/rules/**` files, and extra child files would mostly repeat parent content.
- Verification: Generated AGENTS files are within target sizes: root 69 lines; child files 30-34 lines.
- Verification: `npm run lint` passes after the documentation changes.

## 2026-06-01 Payment System Removal

- Assumption: The request covers runtime payment and subscription functionality, user-facing billing UI, direct PortOne/Stripe dependencies, Vercel billing cron, CSP payment domains, and current project guidance docs.
- Constraint: Do not edit `.env.local` because it may contain local secrets and the user did not explicitly request secret file cleanup.
- Decision: Keep project planning concepts such as `project_plans`, `planProgress`, and `sprint_plan`; these are product planning artifacts, not payment plan features.
- Decision: Remove payment migration scripts from the repo, but do not attempt a live DB destructive migration in this pass.
- QA Plan: Use a RED→GREEN Vitest file plus HTTP route checks, browser UI checks, and tmux dependency/static-scan checks.
- RED Evidence: `npx vitest run tests/payment-removal.test.ts` failed all 4 tests because payment API routes, UI files, PortOne dependencies, and payment domain modules still exist. Output saved to `.omo/ulw-loop/evidence/red-payment-removal.txt`.
- Implementation: Removed payment API routes, pricing/admin subscription UI, settings billing UI, PortOne/Stripe/subscription domain modules, PortOne dependencies, payment CSP/cron config, payment migration script, and active project guidance references.
- Decision: Browser QA used the Browser plugin Chrome extension surface because `iab` was unavailable in this session. The app redirects admin access to port 3000, so the final Browser pass used `http://127.0.0.1:3000`.
- Constraint: `tmux` is unavailable on this Windows host, so C003 was captured as an equivalent PowerShell CLI transcript with the same commands and exit codes.
- Verification: `npx vitest run tests/payment-removal.test.ts`, `npx vitest run`, `npm run lint`, and `npm run build` pass. HTTP QA confirms removed payment API endpoints return 404. Browser QA confirms settings/admin-visible surfaces have no payment text or links.
- Review Fix: Final reviewer found stale PortOne entries in tracked `pnpm-lock.yaml`, missing command strings in C003 evidence, and the new test file being absent from diff views. Regenerated `pnpm-lock.yaml`, added lockfile assertions to `tests/payment-removal.test.ts`, refreshed C003 evidence with exact commands, and marked the test file intent-to-add for diff audit without committing.
- Final Review: `payment_removal_final_reviewer_fast` returned PASS. Remaining risks are limited to out-of-scope local secrets in `.env.local` and live DB cleanup requiring separate approval.

## 2026-06-02 Project Description Regeneration

- Assumption: `$project-describer` means regenerate the default root `DESCRIPTION.md`.
- Constraint: The description must reflect the post-payment-removal codebase and should not describe removed payment features.
- Decision: Use current `package.json`, `README.md`, App Router files, API routes, `lib` services, components, tests, and SQL scripts as source of truth.
- Verification: `rg -n -i "portone|stripe|billing|subscription|pricing|payment|결제|구독|요금제|TossPayments|@portone" DESCRIPTION.md` returns no matches. `npx vitest run tests/payment-removal.test.ts` and `npm run lint` pass.

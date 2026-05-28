# Context Notes

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

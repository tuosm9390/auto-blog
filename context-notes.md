# Context Notes

## 2026-05-26 Project Management Document Premise

- Decision: Treat project documents as evidence for project-state judgment, not as a generic document repository. This matches the current Project Memory pipeline better than rebuilding Confluence/Notion.
- Decision: Prioritize PRD, backlog/issues, decision log/ADR, risk/issue log, release/changelog, and state snapshots. These are the recurring artifacts across Atlassian, GitLab, Scrum, GitHub, SRE, and ADR practices.
- Decision: Keep stakeholder matrices, Gantt charts, full document editors, and enterprise approval workflows out of the first management-environment scope. They add process weight before the core solo-builder pain is solved.
- Scope: Created `doc/designs/project-management-document-premise.md` as the baseline premise for future design and implementation.

## 2026-05-07 PRD Template Guidance

- Decision: Add PRD guidance inside the project create/edit form because that is where users attach the current plan that powers snapshots, progress, and drift.
- Decision: Do not auto-fill the textarea with template content. Placeholder template text can accidentally be saved as real PRD content if the user submits without editing, so the template should be visible as guidance instead.
- Scope: Keep the first version as localized copy and UI guidance only. Do not add database fields, new routes, or AI generation for PRDs.

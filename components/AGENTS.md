# COMPONENT KNOWLEDGE

## OVERVIEW

`components`는 공통 UI primitive, 앱 chrome, 프로젝트 문서 workspace를 제공한다.

## STRUCTURE

```text
components/
├── ui/          # Button, Card, PageContainer, form/filter primitives
├── projects/    # 프로젝트 생성, refresh, Evidence 문서 UI
├── settings/    # 구독 설정 UI
└── *.tsx        # Header, Footer, Providers, auth/profile/search components
```

## WHERE TO LOOK

| Task | Location | Notes |
| --- | --- | --- |
| Provider composition | `Providers.tsx` | client provider root |
| Global navigation | `Header.tsx`, `MobileMenu.tsx`, `LanguageSwitcher.tsx` | locale-aware chrome |
| Footer | `Footer.tsx`, `ScrollToTopButton.tsx` | shared page ending |
| UI primitives | `ui/Button.tsx`, `ui/Card.tsx`, `ui/PageContainer.tsx` | small reusable surfaces |
| Project form | `projects/ProjectEditorForm.tsx` | create/edit project fields |
| Evidence workspace | `projects/ProjectDocumentsWorkspace.tsx` | selected document state |
| Evidence editor | `projects/ProjectDocumentEditor.tsx` | textarea markdown editor actions |
| Billing settings | `settings/BillingSection.tsx` | subscription controls |

## CONVENTIONS

- Client components start with `"use client"` when hooks, state, browser APIs, or form pending state are used.
- New source files need a Korean one-line role comment directly under `"use client"` if present.
- Prefer existing `components/ui` primitives before creating a new visual component.
- Tailwind v4 classes and project CSS variables drive styling. Avoid one-off theme systems.
- Keep page-specific composition in `app/[locale]/**`; move only reusable behavior here.
- Icon-only or ambiguous controls need accessible labels.

## ANTI-PATTERNS

- Do not introduce nested decorative cards when `Card` or simple layout wrappers are enough.
- Do not remove focus visibility. `outline: none` alone is forbidden.
- Do not add large UI abstractions for one route.
- Do not persist unsaved Evidence drafts implicitly. Save/create actions must remain explicit.

# TEST KNOWLEDGE

## OVERVIEW

Tests use Vitest with jsdom, globals, React plugin, and `@` mapped to the repository root.

## WHERE TO LOOK

| Task | Location | Notes |
| --- | --- | --- |
| Vitest config | `../vitest.config.ts` | jsdom, globals, setup file, alias |
| Global setup | `../vitest.setup.ts` | imports `@testing-library/jest-dom` |
| Feature tests | `*.test.ts` | project document behavior |
| Colocated lib tests | `../lib/__tests__/*.test.ts` | library helper tests |

## CONVENTIONS

- Use `*.test.ts` naming.
- Put cross-feature or workflow tests in `tests/`.
- Put small library tests near the module under `lib/__tests__/`.
- Use `npx vitest run <file>` for focused checks and `npx vitest` for the full suite.
- Test behavior at module boundaries rather than implementation details.
- Prefer deterministic fixtures over live GitHub, Supabase, or Gemini calls.
- When testing server actions or route helpers, assert ownership and invalid input paths as well as the happy path.

## COMMANDS

```bash
npx vitest
npx vitest run tests/project-document-templates.test.ts
```

## NOTES

- `package.json` has no `test` script, so do not report `npm test` unless a script is added.
- For code changes, run the smallest relevant Vitest command first, then broader `npm run build` or `npm run lint` when risk justifies it.
- Existing tests focus on project document templates, view models, draft generation inputs, and `parseJsonBody`.
- UI tests run in jsdom and load `@testing-library/jest-dom` through `vitest.setup.ts`.
- Document-only changes can be verified with lint plus manual markdown review.
- Business logic changes should include a regression test when no existing test covers the boundary.

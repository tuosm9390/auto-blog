# Context Notes

## 2026-05-07

- Decision: Project state analysis output should follow the active app locale, because snapshot summaries, plan progress, watch-next, and drift are persisted and then shown directly in localized pages.
- Scope: Keep the change surgical by passing `locale` through the refresh pipeline and adding language instructions to the existing Gemini prompt. Do not redesign the snapshot schema.
- Compatibility: API refresh callers that do not provide locale should continue to default to English unless an explicit locale is supplied.
- Implementation: Server action refreshes pass the active route locale. API refresh accepts an optional `locale` body field and defaults to English for backward compatibility.
- Implementation: Baseline snapshots are localized separately because they do not go through the Gemini prompt.

## 2026-05-07 Service Positioning Refresh

- Decision: The public product message should lead with AI-native project memory, not AI blog generation.
- Scope: Apply the safe first pass from `doc/service-positioning-refresh-design.md`: update landing, how-it-works, navigation labels, and metadata. Do not delete legacy post-generation routes in this pass.
- Risk control: Remove generated-post samples from the landing page because they reinforce the old product promise. Keep direct routes for `/generate`, `/jobs`, and public posts intact.

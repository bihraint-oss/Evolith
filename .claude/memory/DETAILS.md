# Implementation Details & Patterns

_Non-obvious patterns, gotchas, and conventions discovered during implementation. Add entries as you learn things worth remembering._

---

## Architecture Patterns

### Frontend Auth Transport
- `packages/web/src/auth/auth-context.tsx` stores the full `GetProfileResponse` alongside tokens so route guards and the future dashboard both read `hasCompletedDiagnosis` and `radar` from the same `/api/profile` source of truth.
- `packages/web/src/lib/api-client.ts` owns API envelope parsing, Bearer header injection, and token refresh retry logic for protected requests; page-level code should call the typed helpers instead of reimplementing fetch details.
- Refresh retries are deduplicated through a single in-flight promise so concurrent 401 responses share one `/api/auth/refresh` exchange instead of churning tokens.
- The API client uses configurable auth-session bindings, which lets `auth-context.tsx` own reactive auth state later while the transport layer still persists refreshed tokens and clears auth on refresh failure.
- `packages/web/src/routes/DashboardPage.tsx` protects the `/api/skills` fetch with a request-sequence ref keyed to the active authenticated user so a slow response from an older session cannot overwrite the newer dashboard state after auth changes.

### Skill Graph Unlock State
- The Phase 3 skills read API derives `locked` and `available` on read from `skill_nodes.prerequisites` plus the authenticated user's completed `user_progress` rows.
- Only persisted `user_progress.status` values of `inProgress` and `completed` should override the derived state; sparse `locked` or `available` rows are intentionally ignored for status computation.
- Skill nodes should be loaded with `orderBy(asc(skill_nodes.id))` so the API preserves the authored DAG order from the deterministic seed data.

### Diagnosis Contracts
- The diagnosis service owns a fixed six-question scored bank and always deep-clones snapshots before persistence so future bank edits do not mutate historical sessions.
- Persisted diagnosis sessions should store scored question snapshots in `DiagnosisQuestionSnapshot`, while API payloads expose sanitized `DiagnosisQuestion` objects without scoring metadata.
- Single-choice diagnosis answers are modeled explicitly as `questionId` + `choiceId` + `answeredAt`; generic free-form answer payloads are no longer part of the shared contract.

### Monorepo Structure
- Bun workspaces: `packages/server`, `packages/web`, `packages/shared`
- Shared types in `packages/shared/src/types.ts`
- Import pattern: `import type { ... } from '@evolith/shared'`

### Database Conventions
- Table prefix: none (unlike Archon's `remote_agent_` prefix)
- All IDs: UUID v4
- Timestamps: `created_at`, `updated_at` with defaults
- Column naming: snake_case in DB, camelCase in TypeScript

### API Conventions
- Base path: `/api/`
- Auth: Bearer token in Authorization header
- Response format: `{ data: ... }` or `{ error: ... }`
- Error codes: standard HTTP status codes

### Scoring Algorithm
- Implemented in `packages/server/src/services/diagnosis.ts`.
- The diagnosis bank is fixed at six questions across five scored dimensions.
- Each answered question contributes the selected choice's score to every dimension listed in that question's `dimensionIds`.
- Missing per-choice dimension scores are treated as `0`.
- Per-dimension totals are averaged across answered questions that touched that dimension, then rounded and clamped to `0..100`.

---

## Gotchas & Workarounds

### Frontend Route Guards
- `packages/web/src/App.tsx` owns the redirect table for `/`, `/auth`, `/diagnosis`, and `/dashboard`; route components should assume they are already on an allowed path and avoid re-implementing the same auth/diagnosis branching locally.
- `packages/web/src/lib/routing.ts` returns `null` while auth/profile bootstrap is unresolved, so the app shell should render a loading gate instead of redirecting during first paint. This avoids `/auth` ↔ `/dashboard` or `/diagnosis` flashes while `/api/profile` is still loading.
- `packages/web/src/routes/DiagnosisPage.tsx` should recover failed answer submissions by reloading `GET /api/profile/diagnosis/:id` instead of replaying the prior `choiceId`; this keeps the client aligned with the authoritative session state even when the original POST may have partially succeeded.
- When the diagnosis API returns `state: "completed"`, refresh `/api/profile` through `auth-context.tsx` before navigating so the `/dashboard` guard and the destination page read the same `hasCompletedDiagnosis` source of truth.

### Drizzle SQLite Migrations
- `drizzle-kit generate` correctly emitted the new `diagnosis_sessions.state` column and updated snapshot metadata, but the generated SQLite migration did not backfill rows derived from `completed_at`; phase work that depends on historical state needs a manual `UPDATE ... WHERE completed_at IS NOT NULL` patch in the generated SQL.
- In-progress diagnosis sessions now rely on a partial unique index over `diagnosis_sessions.user_id` with `state = 'inProgress'`, so the database enforces one resumable session per user even under concurrent starts.

---

## Environment Setup Notes

- SQLite is the current backend for local development and tests.
- Bun >= 1.x
- Environment variables in `.env` (see `.env.example`)

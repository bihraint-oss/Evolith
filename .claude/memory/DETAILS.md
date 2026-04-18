# Implementation Details & Patterns

_Non-obvious patterns, gotchas, and conventions discovered during implementation. Add entries as you learn things worth remembering._

---

## Architecture Patterns

### Frontend Session & Routing
- The web app keeps auth state in a module-level `sessionStore` backed by the `evolith.session` `localStorage` key and exposes it through `useSyncExternalStore`.
- Stored session payloads are shape-validated on read; corrupted or stale JSON is removed instead of being trusted.
- `ProtectedRoute` only checks for a stored session. The final route choice still happens inside the pages after live `GET /api/profile` reads so diagnosis completion stays server-authoritative.
- The shared API client retries authenticated requests exactly once after a `401` by calling `POST /api/auth/refresh`, rewriting stored tokens, and replaying the original request. Refresh failure clears storage and surfaces an auth-expired error for page-level redirects.

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

### Frontend jsdom Coverage
- Recharts and responsive layout tests need `matchMedia`, `ResizeObserver`, and `scrollTo` shims in `packages/web/src/test/setup.ts`; without them the dashboard suite fails in jsdom before assertions run.
- The shared test setup should clear `localStorage` and `sessionStorage` after each case because auth bootstrap reads session state during initial render.

### Diagnosis/Dashboard Gating
- `/diagnosis` must fetch `GET /api/profile` before calling `POST /api/profile/diagnosis/start`; otherwise completed users can accidentally create a fresh diagnosis session through the resumable start endpoint.
- `/dashboard` should fetch profile and skills together, but it still needs to redirect incomplete users before rendering the dashboard body so the UI never implies diagnosis is optional.

### Drizzle SQLite Migrations
- `drizzle-kit generate` correctly emitted the new `diagnosis_sessions.state` column and updated snapshot metadata, but the generated SQLite migration did not backfill rows derived from `completed_at`; phase work that depends on historical state needs a manual `UPDATE ... WHERE completed_at IS NOT NULL` patch in the generated SQL.
- In-progress diagnosis sessions now rely on a partial unique index over `diagnosis_sessions.user_id` with `state = 'inProgress'`, so the database enforces one resumable session per user even under concurrent starts.

---

## Environment Setup Notes

- SQLite is the current backend for local development and tests.
- Bun >= 1.x
- Environment variables in `.env` (see `.env.example`)

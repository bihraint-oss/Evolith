# Implementation Details & Patterns

_Non-obvious patterns, gotchas, and conventions discovered during implementation. Add entries as you learn things worth remembering._

---

## Architecture Patterns

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

### Drizzle SQLite Migrations
- `drizzle-kit generate` correctly emitted the new `diagnosis_sessions.state` column and updated snapshot metadata, but the generated SQLite migration did not backfill rows derived from `completed_at`; phase work that depends on historical state needs a manual `UPDATE ... WHERE completed_at IS NOT NULL` patch in the generated SQL.
- In-progress diagnosis sessions now rely on a partial unique index over `diagnosis_sessions.user_id` with `state = 'inProgress'`, so the database enforces one resumable session per user even under concurrent starts.

---

## Environment Setup Notes

- SQLite is the current backend for local development and tests.
- Bun >= 1.x
- Environment variables in `.env` (see `.env.example`)

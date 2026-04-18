# Implementation Details & Patterns

_Non-obvious patterns, gotchas, and conventions discovered during implementation. Add entries as you learn things worth remembering._

---

## Architecture Patterns

### Diagnosis Contracts
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
- 5 dimensions scored 0-100
- 5-8 diagnostic questions, each maps to 1-2 dimensions
- Score = weighted average of relevant question answers
- _(Algorithm details to be filled during Phase 2 implementation)_

---

## Gotchas & Workarounds

### Drizzle SQLite Migrations
- `drizzle-kit generate` correctly emitted the new `diagnosis_sessions.state` column and updated snapshot metadata, but the generated SQLite migration did not backfill rows derived from `completed_at`; phase work that depends on historical state needs a manual `UPDATE ... WHERE completed_at IS NOT NULL` patch in the generated SQL.

---

## Environment Setup Notes

- PostgreSQL required (with pgvector extension for future use)
- Bun >= 1.x
- Environment variables in `.env` (see `.env.example`)

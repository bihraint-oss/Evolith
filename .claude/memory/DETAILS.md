# Implementation Details & Patterns

_Non-obvious patterns, gotchas, and conventions discovered during implementation. Add entries as you learn things worth remembering._

---

## Architecture Patterns

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

_(None yet — add as discovered)_

---

## Environment Setup Notes

- PostgreSQL required (with pgvector extension for future use)
- Bun >= 1.x
- Environment variables in `.env` (see `.env.example`)

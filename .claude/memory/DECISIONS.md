# Technical Decisions

_Entries in reverse chronological order (newest first)._

---

### D-009: Frontend routing is decided from live profile reads
- **Date**: 2026-04-19
- **Decision**: The browser flow uses `GET /api/profile` to choose between `/diagnosis` and `/dashboard` after auth success and when authenticated users enter either gated page.
- **Rationale**: The backend is the source of truth for diagnosis completion and resumable state. Relying on cached client flags would risk sending completed users back into diagnosis or leaving incomplete users on the dashboard.
- **Alternatives**: Persist a local `hasCompletedDiagnosis` flag and route from cache; always start/resume diagnosis without a profile pre-check.
- **Impact**: `/auth` redirects only after a profile read, `/diagnosis` bounces completed users to `/dashboard`, and `/dashboard` redirects incomplete users back to `/diagnosis`.

### D-008: Centralize token refresh and keep session state narrow
- **Date**: 2026-04-19
- **Decision**: The frontend owns one shared API client that parses envelopes, attaches bearer tokens, retries one `401` via `POST /api/auth/refresh`, and stores only `user` plus auth tokens in `localStorage`.
- **Rationale**: The MVP has three protected routes and does not need a heavier state layer. Centralizing auth behavior keeps refresh logic consistent and prevents each page from implementing its own retry or token bookkeeping.
- **Alternatives**: Refresh tokens separately inside each page load; add Redux or another global store for auth/session state.
- **Impact**: `packages/web/src/lib/api.ts` handles refresh/replay semantics, `packages/web/src/lib/session.tsx` stays minimal, and UI code only needs to react to the surfaced auth-expired condition.

### D-007: Skills API returns derived status only
- **Date**: 2026-04-19
- **Decision**: `GET /api/skills` and `GET /api/skills/:id` expose seeded skill-node fields plus computed `status` only; they do not return `startedAt`, `completedAt`, or `score`.
- **Rationale**: Review feedback confirmed the Phase 3 frontend only needs unlock/completion state, and omitting extra progress metadata keeps the read contract minimal until write flows or richer learning analytics exist.
- **Alternatives**: Return progress timestamps/scores immediately; persist derived `locked`/`available` rows and expose them directly.
- **Impact**: `SkillNodeView` stays narrow, the skills router strips user-progress metadata from responses, and integration tests assert those fields are absent at runtime.

## Pre-Implementation Decisions (from PRD Phase 0)

### D-006: Flexible interfaces for questions & skill tree
- **Date**: 2026-04-18
- **Decision**: Architecture supports manual curation, AI generation, or external import for diagnostic questions and skill nodes. MVP hardcodes both.
- **Rationale**: Source is TBD; don't paint into a corner
- **Alternatives**: Fixed hardcoded only; AI-only generation
- **Impact**: Service interfaces must be abstraction-ready but can start with simple implementations

### D-005: Codex is dev-time model only
- **Date**: 2026-04-18
- **Decision**: Codex (gpt-5.4) used for Archon development workflows only. Product AI features need a swappable provider interface.
- **Rationale**: Product may use open-source or different commercial models; keep dev-time and product-time AI separate
- **Impact**: `packages/server/src/services/ai-provider.ts` must define abstract interface

### D-004: No account management in MVP
- **Date**: 2026-04-18
- **Decision**: Password reset, profile editing, admin dashboard all excluded
- **Rationale**: Not needed for funding demo; reduces scope significantly
- **Impact**: Auth routes are register + login + refresh only

### D-003: 5 cognitive dimensions locked
- **Date**: 2026-04-18
- **Decision**: creativity, imagination, prompt precision, system decomposition, AI orchestration. Scoring method TBD.
- **Rationale**: User confirmed dimensions; quantification refinement deferred
- **Impact**: Schema stores 5 integer scores (0-100) per dimension

### D-002: MVP scope = Register → Diagnosis → Radar Chart
- **Date**: 2026-04-18
- **Decision**: Smallest loop that validates diagnostic→scoring produces trustworthy signal
- **Rationale**: Learning sessions are complex; core loop must work first
- **Impact**: No LearningSession table or learning routes in MVP

### D-001: Tech stack — Bun + Hono + Drizzle + PostgreSQL + React/Vite/Tailwind
- **Date**: 2026-04-18
- **Decision**: Full stack as specified in PRD
- **Rationale**: Proven combination (Hono used in Archon); greenfield so no conflicts
- **Impact**: All tooling and conventions based on this stack

# Technical Decisions

_Entries in reverse chronological order (newest first)._

---

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

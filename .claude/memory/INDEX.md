# Evolith Memory Index

**Last updated**: 2026-04-18
**Current phase**: Phase 2 In Progress
**Current focus**: Phase 2 AI provider placeholder and profile route implementation
**Next steps**: Add the product-time AI provider interface placeholder, then implement the authenticated profile and diagnosis routes

---

## Memory Files

| File | Purpose | When to Read |
|---|---|---|
| [PROGRESS.md](PROGRESS.md) | Phase & task tracking with status | Every conversation start |
| [DECISIONS.md](DECISIONS.md) | Technical decisions with rationale | When making or revisiting decisions |
| [ISSUES.md](ISSUES.md) | Bugs, blockers, and resolutions | When encountering or fixing issues |
| [DETAILS.md](DETAILS.md) | Implementation patterns, gotchas, conventions | Before implementing new features |
| [TODOS.md](TODOS.md) | Prioritized next steps and backlog | When picking up new work |
| [API-LOG.md](API-LOG.md) | API endpoint change history | When modifying APIs |

## Project State Summary

- **Repo**: Phase 1 backend foundation is implemented; Phase 2 diagnosis work is in progress
- **Branch**: `archon/task-piv-phase2-diagnosis`
- **PRD**: Validated at `.archon/ralph/evolith-mvp/prd.md`
- **Archon config**: Codex (gpt-5.4 xhigh) for dev-time AI
- **Database**: SQLite + Drizzle on Bun
- **Dependencies**: Installed
- **Latest completed task**: Diagnosis service implementation in `packages/server/src/services/diagnosis.ts`

## Phase Status

| Phase | Status |
|---|---|
| 0 — Planning & PRD | ✅ Done |
| 1 — Backend Foundation | ✅ Done |
| 2 — Diagnosis Core Loop | 🔄 In progress |
| 3 — Skill Graph API | ⬜ Not started |
| 4 — Frontend | ⬜ Not started |

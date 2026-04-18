# Evolith Memory Index

**Last updated**: 2026-04-19
**Current phase**: Phase 4 Complete
**Current focus**: Phase 4 is fully implemented and documented; the repo now has the full frontend demo loop plus a repo-level runbook and validated handoff path
**Next steps**: Use `bun run dev:server` and `bun run dev:web` for demo prep, and treat `bun run validate && bun run build` as the release/handoff check before any follow-on phase work

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

- **Repo**: Phase 1 backend foundation, Phase 2 diagnosis core loop, Phase 3 skill graph API, and Phase 4 frontend are all implemented. The repo now includes the `packages/web` SPA, centralized frontend auth/bootstrap logic, the real `/auth` → `/diagnosis` → `/dashboard` flow, Bun-native frontend helper coverage in the standard root test path, and repo-level documentation for both local development and final validation.
- **Branch**: `archon/task-plan-phase4-frontend`
- **PRD**: Validated at `.archon/ralph/evolith-mvp/prd.md`
- **Archon config**: Codex (gpt-5.4 xhigh) for dev-time AI
- **Database**: SQLite + Drizzle on Bun
- **Dependencies**: Installed
- **Latest completed task**: Phase 4 Task 10 — refreshed the README to a repo-level server/web runbook, updated memory for Phase 4 completion, and re-verified the full handoff command `bun run validate && bun run build`

## Phase Status

| Phase | Status |
|---|---|
| 0 — Planning & PRD | ✅ Done |
| 1 — Backend Foundation | ✅ Done |
| 2 — Diagnosis Core Loop | ✅ Done |
| 3 — Skill Graph API | ✅ Done |
| 4 — Frontend | ✅ Done |

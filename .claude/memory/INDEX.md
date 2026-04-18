# Evolith Memory Index

**Last updated**: 2026-04-19
**Current phase**: Phase 4 In Progress
**Current focus**: Phase 4 now has Bun-native frontend helper coverage wired into the repo test entrypoint, so the remaining implementation work is the final documentation and memory sweep for Task 10
**Next steps**: Complete Phase 4 Task 10 by updating `README.md`, `.claude/memory/PROGRESS.md`, and `.claude/memory/INDEX.md` for the full frontend runbook and final validation guidance, then run `bun run validate && bun run build`

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

- **Repo**: Phase 1 backend foundation, Phase 2 diagnosis core loop, and Phase 3 skill graph API are implemented; Phase 4 now has workspace plumbing, repo-wide browser typecheck coverage, a buildable Vite web scaffold, the shared frontend auth/API/routing/skill helper layer under `packages/web/src/lib`, a bootstrapped `AuthProvider` with centralized route guarding, the real `/auth` register/login screen, a server-driven `/diagnosis` route that starts or resumes sessions and refreshes `/api/profile` on completion, a real `/dashboard` route that renders the backend radar plus all seeded skills grouped by dimension with status badges, and Bun-native frontend unit tests that now run through the normal root `bun run test` path
- **Branch**: `archon/task-plan-phase4-frontend`
- **PRD**: Validated at `.archon/ralph/evolith-mvp/prd.md`
- **Archon config**: Codex (gpt-5.4 xhigh) for dev-time AI
- **Database**: SQLite + Drizzle on Bun
- **Dependencies**: Installed
- **Latest completed task**: Phase 4 Task 9 — added frontend helper tests for API transport/auth refresh, route decisions, and skill grouping, then updated the repo test entrypoint so the web suite runs alongside the server suite

## Phase Status

| Phase | Status |
|---|---|
| 0 — Planning & PRD | ✅ Done |
| 1 — Backend Foundation | ✅ Done |
| 2 — Diagnosis Core Loop | ✅ Done |
| 3 — Skill Graph API | ✅ Done |
| 4 — Frontend | 🚧 In progress |

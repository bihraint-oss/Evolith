# Evolith Memory Index

**Last updated**: 2026-04-19
**Current phase**: Phase 4 In Progress
**Current focus**: Phase 4 now has the initial `packages/web` Vite scaffold, so the next implementation step is the shared frontend foundation layer for auth persistence, API transport, route resolution, and skill grouping
**Next steps**: Complete Phase 4 Task 4 by creating `packages/web/src/lib/auth-session.ts`, `api-client.ts`, `routing.ts`, and `skills.ts`

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

- **Repo**: Phase 1 backend foundation, Phase 2 diagnosis core loop, and Phase 3 skill graph API are implemented; Phase 4 now has workspace plumbing, repo-wide browser typecheck coverage, and a buildable Vite web scaffold under `packages/web`
- **Branch**: `archon/task-plan-phase4-frontend`
- **PRD**: Validated at `.archon/ralph/evolith-mvp/prd.md`
- **Archon config**: Codex (gpt-5.4 xhigh) for dev-time AI
- **Database**: SQLite + Drizzle on Bun
- **Dependencies**: Installed
- **Latest completed task**: Phase 4 Task 3 — created the initial `packages/web` Vite scaffold with the HTML entrypoint, local TS config, `/api` proxy, Router bootstrap, placeholder app shell, and baseline frontend styling

## Phase Status

| Phase | Status |
|---|---|
| 0 — Planning & PRD | ✅ Done |
| 1 — Backend Foundation | ✅ Done |
| 2 — Diagnosis Core Loop | ✅ Done |
| 3 — Skill Graph API | ✅ Done |
| 4 — Frontend | 🚧 In progress |

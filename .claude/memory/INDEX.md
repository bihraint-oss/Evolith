# Evolith Memory Index

**Last updated**: 2026-04-19
**Current phase**: Phase 4 In Progress
**Current focus**: Phase 4 now has the authenticated dashboard surface in place, so the next implementation step is adding Bun-native frontend unit coverage for the API client refresh flow, route decisions, and skill grouping transforms
**Next steps**: Complete Phase 4 Task 9 by creating `packages/web/src/lib/api-client.test.ts`, `routing.test.ts`, and `skills.test.ts`, then verify the pure frontend helpers through the root `bun run test` path before the final documentation/memory sweep

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

- **Repo**: Phase 1 backend foundation, Phase 2 diagnosis core loop, and Phase 3 skill graph API are implemented; Phase 4 now has workspace plumbing, repo-wide browser typecheck coverage, a buildable Vite web scaffold, the shared frontend auth/API/routing/skill helper layer under `packages/web/src/lib`, a bootstrapped `AuthProvider` with centralized route guarding, the real `/auth` register/login screen, a server-driven `/diagnosis` route that starts or resumes sessions and refreshes `/api/profile` on completion, and a real `/dashboard` route that renders the backend radar plus all seeded skills grouped by dimension with status badges
- **Branch**: `archon/task-plan-phase4-frontend`
- **PRD**: Validated at `.archon/ralph/evolith-mvp/prd.md`
- **Archon config**: Codex (gpt-5.4 xhigh) for dev-time AI
- **Database**: SQLite + Drizzle on Bun
- **Dependencies**: Installed
- **Latest completed task**: Phase 4 Task 8 — created the frontend `/dashboard` screen with radar rendering from `profile.radar`, authenticated `/api/skills` loading, grouped skill sections, and color-coded `locked` / `available` / `inProgress` / `completed` badges

## Phase Status

| Phase | Status |
|---|---|
| 0 — Planning & PRD | ✅ Done |
| 1 — Backend Foundation | ✅ Done |
| 2 — Diagnosis Core Loop | ✅ Done |
| 3 — Skill Graph API | ✅ Done |
| 4 — Frontend | 🚧 In progress |

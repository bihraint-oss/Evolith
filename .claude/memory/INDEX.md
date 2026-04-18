# Evolith Memory Index

**Last updated**: 2026-04-19
**Current phase**: Phase 4 In Progress
**Current focus**: Phase 4 now has the real diagnosis route in place, so the next implementation step is building the authenticated dashboard surface with the radar chart, grouped skill sections, and status badges
**Next steps**: Complete Phase 4 Task 8 by creating `packages/web/src/routes/DashboardPage.tsx` plus the supporting chart/status/group components, then wire `/dashboard` away from the placeholder preview and load `/api/skills` against the shared profile state

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

- **Repo**: Phase 1 backend foundation, Phase 2 diagnosis core loop, and Phase 3 skill graph API are implemented; Phase 4 now has workspace plumbing, repo-wide browser typecheck coverage, a buildable Vite web scaffold, the shared frontend auth/API/routing/skill helper layer under `packages/web/src/lib`, a bootstrapped `AuthProvider` with centralized route guarding, the real `/auth` register/login screen, and a server-driven `/diagnosis` route that starts or resumes sessions, submits one answer at a time, and refreshes `/api/profile` before the dashboard handoff
- **Branch**: `archon/task-plan-phase4-frontend`
- **PRD**: Validated at `.archon/ralph/evolith-mvp/prd.md`
- **Archon config**: Codex (gpt-5.4 xhigh) for dev-time AI
- **Database**: SQLite + Drizzle on Bun
- **Dependencies**: Installed
- **Latest completed task**: Phase 4 Task 7 — created the frontend `/diagnosis` screen with session bootstrap/resume, sequential answer submission, failure recovery through session reload, and profile refresh before routing completed users into `/dashboard`

## Phase Status

| Phase | Status |
|---|---|
| 0 — Planning & PRD | ✅ Done |
| 1 — Backend Foundation | ✅ Done |
| 2 — Diagnosis Core Loop | ✅ Done |
| 3 — Skill Graph API | ✅ Done |
| 4 — Frontend | 🚧 In progress |

# Evolith Memory Index

**Last updated**: 2026-04-19
**Current phase**: Phase 4 In Progress
**Current focus**: Phase 4 now has the real `/auth` screen in place, so the next implementation step is building the diagnosis route that starts or resumes the server-driven Q&A flow and refreshes profile state on completion
**Next steps**: Complete Phase 4 Task 7 by creating `packages/web/src/routes/DiagnosisPage.tsx`, wiring it into `/api/profile/diagnosis/start` and answer submission, and navigating completed sessions through the shared auth context to `/dashboard`

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

- **Repo**: Phase 1 backend foundation, Phase 2 diagnosis core loop, and Phase 3 skill graph API are implemented; Phase 4 now has workspace plumbing, repo-wide browser typecheck coverage, a buildable Vite web scaffold, the shared frontend auth/API/routing/skill helper layer under `packages/web/src/lib`, a bootstrapped `AuthProvider` with centralized route guarding, and the real `/auth` register/login screen wired into that session flow
- **Branch**: `archon/task-plan-phase4-frontend`
- **PRD**: Validated at `.archon/ralph/evolith-mvp/prd.md`
- **Archon config**: Codex (gpt-5.4 xhigh) for dev-time AI
- **Database**: SQLite + Drizzle on Bun
- **Dependencies**: Installed
- **Latest completed task**: Phase 4 Task 6 — created the frontend `/auth` screen with combined register/login modes, backend error surfacing, context-driven token persistence, and post-auth routing into `/diagnosis` or `/dashboard`

## Phase Status

| Phase | Status |
|---|---|
| 0 — Planning & PRD | ✅ Done |
| 1 — Backend Foundation | ✅ Done |
| 2 — Diagnosis Core Loop | ✅ Done |
| 3 — Skill Graph API | ✅ Done |
| 4 — Frontend | 🚧 In progress |

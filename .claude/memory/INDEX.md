# Evolith Memory Index

**Last updated**: 2026-04-19
**Current phase**: Phase 4 Complete
**Current focus**: The full-stack MVP browser loop is implemented in `packages/web`, documented, and covered by frontend/backend validation
**Next steps**: Review the completed Phase 4 deliverable or pick up the remaining follow-up items in `TODOS.md` such as diagnosis JSDoc, explicit re-diagnosis UX, or richer skill views

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

- **Repo**: Phases 1 through 4 are implemented; the MVP now ships a browser flow from auth to diagnosis to dashboard on top of the existing Hono API contracts
- **Branch**: `archon/task-archon-task-plan-phase4-frontend`
- **PRD**: Validated at `.archon/ralph/evolith-mvp/prd.md`
- **Archon config**: Codex (gpt-5.4 xhigh) for dev-time AI
- **Database**: SQLite + Drizzle on Bun
- **Dependencies**: Installed
- **Latest completed task**: Phase 4 frontend implementation and memory sync — the repo now includes the React/Vite web package, auth/diagnosis/dashboard routes, frontend coverage, and full-stack README updates

## Phase Status

| Phase | Status |
|---|---|
| 0 — Planning & PRD | ✅ Done |
| 1 — Backend Foundation | ✅ Done |
| 2 — Diagnosis Core Loop | ✅ Done |
| 3 — Skill Graph API | ✅ Done |
| 4 — Frontend | ✅ Done |

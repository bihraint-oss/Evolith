# Evolith Memory Index

**Last updated**: 2026-04-19
**Current phase**: Phase 4 In Progress
**Current focus**: Phase 4 frontend setup now covers repo-wide browser typechecking after Task 2 expanded the root `tsconfig.json` for TSX, declarations, JSX, and DOM libs
**Next steps**: Complete Phase 4 Task 3 by scaffolding the initial Vite web app in `packages/web` with `index.html`, package-local TS config, Vite proxying, and placeholder React entry files

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

- **Repo**: Phase 1 backend foundation, Phase 2 diagnosis core loop, and Phase 3 skill graph API are implemented; Phase 4 now has workspace plumbing plus repo-wide browser typecheck coverage
- **Branch**: `archon/task-plan-phase4-frontend`
- **PRD**: Validated at `.archon/ralph/evolith-mvp/prd.md`
- **Archon config**: Codex (gpt-5.4 xhigh) for dev-time AI
- **Database**: SQLite + Drizzle on Bun
- **Dependencies**: Installed
- **Latest completed task**: Phase 4 Task 2 — updated the root `tsconfig.json` to include TSX and `.d.ts` files, `jsx: "react-jsx"`, and DOM libraries for browser code validation

## Phase Status

| Phase | Status |
|---|---|
| 0 — Planning & PRD | ✅ Done |
| 1 — Backend Foundation | ✅ Done |
| 2 — Diagnosis Core Loop | ✅ Done |
| 3 — Skill Graph API | ✅ Done |
| 4 — Frontend | 🚧 In progress |

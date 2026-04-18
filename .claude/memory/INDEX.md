# Evolith Memory Index

**Last updated**: 2026-04-19
**Current phase**: Phase 3 In Progress
**Current focus**: The authenticated Phase 3 skills API is mounted, integration-tested, and aligned with review feedback; awaiting re-review or approval
**Next steps**: Re-review the `/api/skills` implementation, or request any additional follow-up before approval

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

- **Repo**: Phase 1 backend foundation and Phase 2 diagnosis core loop are implemented; Phase 3 skill graph route work is underway
- **Branch**: `archon/task-plan-phase3-skill-graph`
- **PRD**: Validated at `.archon/ralph/evolith-mvp/prd.md`
- **Archon config**: Codex (gpt-5.4 xhigh) for dev-time AI
- **Database**: SQLite + Drizzle on Bun
- **Dependencies**: Installed
- **Latest completed task**: Phase 3 review follow-up — narrowed the skills response contract to status-only progress data and refreshed integration coverage

## Phase Status

| Phase | Status |
|---|---|
| 0 — Planning & PRD | ✅ Done |
| 1 — Backend Foundation | ✅ Done |
| 2 — Diagnosis Core Loop | ✅ Done |
| 3 — Skill Graph API | 🚧 In progress |
| 4 — Frontend | ⬜ Not started |

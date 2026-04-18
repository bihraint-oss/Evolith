# Progress Tracker

## Phase 0: Planning & PRD
**Status**: ✅ Done

- [x] 2026-04-18: PRD generated via archon-interactive-prd workflow
- [x] 2026-04-18: Archon config set (assistant: codex, model: gpt-5.4 xhigh)
- [x] 2026-04-18: Memory system created

## Phase 1: Backend Foundation
**Status**: ✅ Done

- [x] 2026-04-18: Backend foundation completed in the earlier implementation loop. See `.claude/archon/plans/progress.txt` for the detailed task-by-task commit log.

## Phase 2: Diagnosis Core Loop
**Status**: ✅ Done

- [x] 2026-04-19: Task 11 completed — addressed PR #2 review follow-ups by rejecting corrupted in-progress sessions on read/resume, enforcing a one-active-session-per-user database invariant, expanding route/service regression coverage, refreshing Phase 2 docs/memory, and adding a root `build` script for repo validation.
- [x] 2026-04-19: Task 10 completed — added `packages/server/src/routes/profile.test.ts` with end-to-end coverage for auth guarding, profile pre-diagnosis state, diagnosis start/resume, invalid-choice and out-of-order answer rejection, completion persistence, re-diagnosis overwrite behavior, completed-session history retention, and ownership checks. Full validation now passes for the Phase 2 backend loop.
- [x] 2026-04-18: Task 8 completed — updated `packages/server/src/app.ts` to mount `createProfileRouter` under the shared `/api` prefix whenever auth dependencies are present, making the authenticated profile and diagnosis endpoints reachable through `createApp`.
- [x] 2026-04-18: Task 7 completed — created `packages/server/src/routes/profile.ts` with authenticated `/api/profile` and diagnosis lifecycle routes, sequential answer validation, and transactional completion that overwrites `cognitive_profiles`.
- [x] 2026-04-18: Task 6 completed — added `packages/server/src/services/ai-provider.ts` as the interface-only placeholder for future product-time AI integrations without wiring it into the request path.
- [x] 2026-04-18: Task 5 completed — created `packages/server/src/services/diagnosis.ts` with the fixed diagnosis bank, question sanitization helpers, next-choice validation, deterministic scoring, and radar/result builders.
- [x] 2026-04-18: Task 4 completed — committed Drizzle metadata updates in `packages/server/src/db/migrations/meta/_journal.json` and `0001_snapshot.json` for the new diagnosis session state column.
- [x] 2026-04-18: Task 3 completed — generated `packages/server/src/db/migrations/0001_wakeful_silverclaw.sql` to add `diagnosis_sessions.state` with an explicit backfill that marks existing completed sessions as `completed`.
- [x] 2026-04-18: Task 2 completed — updated `packages/server/src/db/schema.ts` to add `diagnosis_sessions.state`, store scored `DiagnosisQuestionSnapshot[]` question JSON, and make `profileSnapshot` nullable in the Drizzle typing.
- [x] 2026-04-18: Task 1 completed — updated `packages/shared/src/types.ts` with single-choice diagnosis DTOs, scored question snapshot types, shared session/result/progress views, and radar data contracts.

## Phase 3: Skill Graph API
**Status**: ✅ Done

- [x] 2026-04-19: Review follow-up completed — aligned the authenticated skills read API with validation feedback by keeping both endpoints auth-guarded, preserving seeded id ordering, returning locked detail nodes with `200`, exposing only `status` as the progress overlay field, and refreshing the route-level integration coverage.
- [x] 2026-04-19: Task 4 completed — added `packages/server/src/routes/skills.test.ts` with integration coverage for auth, diagnosis gating, prerequisite unlock derivation, `inProgress`/`completed` overrides, locked detail reads, missing ids, response shape, and user isolation.
- [x] 2026-04-19: Task 3 completed — mounted `createSkillsRouter` under the shared `/api` prefix in `packages/server/src/app.ts`, activating the authenticated skills list and detail endpoints.
- [x] 2026-04-19: Task 2 completed — created `packages/server/src/routes/skills.ts` with authenticated `GET /skills` and `GET /skills/:id` handlers, per-user progress joins, stable seeded ordering, and derived unlock-state computation that only treats stored `inProgress` and `completed` rows as authoritative overrides.
- [x] 2026-04-19: Task 1 completed — added shared skill graph DTOs in `packages/shared/src/types.ts` for the skills list/detail responses and `SkillNodeView`.

## Phase 4: Frontend
**Status**: 🚧 In progress

- [x] 2026-04-19: Task 6 completed — created `packages/web/src/routes/AuthPage.tsx` as the real combined register/login screen with a mode toggle, backend error-message surfacing, submit disabling while pending, and successful auth handoff through `setAuthFromAuthResponse`, then wired `/auth` in `packages/web/src/App.tsx` away from the placeholder preview. Repo validation and the root web build both passed afterward.
- [x] 2026-04-19: Task 5 completed — created `packages/web/src/auth/auth-context.tsx` to bootstrap auth from stored tokens, bind the API client to reactive session state, and fetch `/api/profile`, then replaced `packages/web/src/App.tsx` with centralized guarded routes for `/`, `/auth`, `/diagnosis`, and `/dashboard` plus a full-screen bootstrap loading gate to avoid redirect flash.
- [x] 2026-04-19: Task 4 completed — added `packages/web/src/lib/auth-session.ts`, `api-client.ts`, `routing.ts`, and `skills.ts` so the frontend now has safe localStorage token persistence, a typed `/api` client with envelope parsing and deduplicated refresh-on-401 behavior, centralized pure route-resolution helpers, and ordered skill grouping/label transforms for the dashboard.
- [x] 2026-04-19: Task 3 completed — scaffolded `packages/web` with a buildable Vite entrypoint, package-local TypeScript config, `/api` proxying to `http://localhost:3000`, a BrowserRouter bootstrap, a placeholder React shell, and the initial warm-tone CSS system for the frontend surface.
- [x] 2026-04-19: Task 2 completed — expanded the root `tsconfig.json` so repo-wide typecheck now includes TSX and `.d.ts` files, uses `jsx: "react-jsx"`, and loads DOM browser libs for the incoming web package.
- [x] 2026-04-19: Task 1 completed — created the `@evolith/web` workspace manifest, registered `packages/web` in the root workspace, added `dev:web`, updated the root `build` command to invoke the web build after repo typecheck, and refreshed `bun.lock` via `bun install`.

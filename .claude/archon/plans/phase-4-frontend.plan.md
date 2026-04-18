# Feature: Phase 4 Frontend

## Summary
Create the missing `packages/web` frontend so the existing auth, diagnosis, profile, and skills APIs become a usable MVP loop in the browser. The implementation must wire the monorepo for a React/Vite/Tailwind package, keep the client aligned with the current shared contracts, and finish with frontend tests plus README/memory sync.

## Mission
Ship a browser flow of `/auth` -> `/diagnosis` -> `/dashboard` that works against the current backend contracts without adding new endpoints.

## Success Criteria
- [ ] `packages/web` exists as a Bun workspace with Vite, React, Tailwind, Recharts, and Vitest wiring that runs locally against `VITE_API_BASE_URL`
- [ ] `/auth` supports register and login on one page, persists auth tokens, and routes users to `/diagnosis` or `/dashboard` based on `GET /api/profile`
- [ ] `/diagnosis` resumes the current in-progress session through `POST /api/profile/diagnosis/start`, advances through all six questions, and redirects to `/dashboard` on completion
- [ ] `/dashboard` loads `/api/profile` and `/api/skills`, renders the saved radar data, and shows skill statuses in authored API order without inventing a new graph contract
- [ ] Frontend coverage exists for token refresh/retry, auth routing, diagnosis progression/resume, dashboard redirects, radar rendering, and skill status rendering
- [ ] README documents full-stack setup/run flow including the web package and `VITE_API_BASE_URL`
- [ ] Memory files reflect Phase 4 progress, decisions, details, and next steps
- [ ] All validation passes (`bun run validate`)
- [ ] No regressions in existing tests

## Scope
### In Scope
- Add `packages/web` with Vite + React + Tailwind + Recharts + Vitest/Testing Library
- Update root workspace/scripts/env/TypeScript wiring so server and web validate independently
- Implement a typed frontend API client that uses the existing shared DTOs and response envelopes
- Persist auth session state in `localStorage` and refresh tokens once via `POST /api/auth/refresh` after a `401`
- Build a single auth page, a diagnosis question page, and a dashboard page
- Add route guards, shared layout/loading/error states, and page-level redirect logic
- Add frontend tests plus README and `.claude/memory` updates

### Out of Scope
- New backend endpoints or schema changes, except tiny frontend-enabling fixes discovered during implementation
- Password reset, profile editing, or admin/dashboard management flows; `register`, `login`, and `refresh` are the only MVP auth routes per `.claude/memory/DECISIONS.md:29-33`
- Skill detail/start flows, learning-session UI, or any write flow for `user_progress`
- A positioned DAG/graph API for skills; the current contract is a flat ordered list with `status` and `prerequisiteIds`
- Exposing re-diagnosis as a first-class frontend feature; the backend supports it, but this phase should optimize for the first-run MVP loop

## Codebase Context
### Key Files
| File | Role | Action |
|------|------|--------|
| `package.json` | Root Bun workspaces and aggregate scripts | UPDATE |
| `packages/server/package.json` | Server-local validation scripts that currently scan all `packages/**/*.ts(x)` | UPDATE |
| `tsconfig.json` | Shared TypeScript base config and path aliases | UPDATE |
| `.env.example` | Local server defaults; needs web API base URL | UPDATE |
| `packages/server/tsconfig.json` | Server-only TS project so web TSX does not break backend checks | CREATE |
| `packages/web/package.json` | Frontend dependencies and scripts | CREATE |
| `packages/web/tsconfig.json` | DOM/JSX/Vitest-aware TS config for app code | CREATE |
| `packages/web/tsconfig.node.json` | TS config for `vite.config.ts` and other tool files | CREATE |
| `packages/web/vite.config.ts` | Vite build/dev server plus Vitest config | CREATE |
| `packages/web/tailwind.config.ts` | Tailwind content scan and theme tokens | CREATE |
| `packages/web/postcss.config.mjs` | Tailwind/PostCSS integration | CREATE |
| `packages/web/index.html` | Vite HTML entry | CREATE |
| `packages/web/src/main.tsx` | React bootstrap and providers | CREATE |
| `packages/web/src/App.tsx` | Router composition and route-level wiring | CREATE |
| `packages/web/src/lib/api.ts` | Typed HTTP client with refresh retry and envelope parsing | CREATE |
| `packages/web/src/lib/session.tsx` | Auth/session context backed by `localStorage` | CREATE |
| `packages/web/src/components/ProtectedRoute.tsx` | Token-based route guard | CREATE |
| `packages/web/src/components/AppShell.tsx` | Shared page layout/loading/error shell | CREATE |
| `packages/web/src/components/RadarChart.tsx` | Recharts radar wrapper for `DiagnosisRadarData` | CREATE |
| `packages/web/src/components/SkillMap.tsx` | Skill visualization using `status` + `prerequisiteIds` | CREATE |
| `packages/web/src/pages/Auth.tsx` | Combined register/login page | CREATE |
| `packages/web/src/pages/Diagnosis.tsx` | One-question-at-a-time diagnosis flow | CREATE |
| `packages/web/src/pages/Dashboard.tsx` | Profile/radar/skills page | CREATE |
| `packages/web/src/test/setup.ts` | Testing Library and browser API test setup | CREATE |
| `packages/web/src/**/*.test.tsx` | Frontend route/page coverage | CREATE |
| `packages/web/src/lib/api.test.ts` | Refresh-retry and session-clearing coverage | CREATE |
| `README.md` | Repo setup and run instructions | UPDATE |
| `.claude/memory/PROGRESS.md` | Task tracking | UPDATE |
| `.claude/memory/DECISIONS.md` | Frontend implementation decisions | UPDATE |
| `.claude/memory/DETAILS.md` | Frontend-specific patterns/gotchas | UPDATE |
| `.claude/memory/INDEX.md` | Current phase/focus summary | UPDATE |
| `.claude/memory/TODOS.md` | Follow-up work, if any remains after implementation | UPDATE |

### Patterns to Follow
Keep the client aligned to the shared DTO package instead of redefining payloads, following the current server import pattern in `packages/server/src/routes/auth.ts:1-8` and the shared barrel export in `packages/shared/src/index.ts:1`:

```ts
import type {
  AuthResponse,
  LoginRequest,
  PublicUser,
  RefreshRequest,
  RefreshResponse,
  RegisterRequest,
} from "@evolith/shared";
```

Expect every backend response to use the standard `{ data }` / `{ error }` envelopes from `packages/server/src/lib/http.ts:9-27`, and make the frontend client parse that centrally:

```ts
export function successResponse<TData>(
  context: Context,
  data: TData,
  status: ContentfulStatusCode = 200,
): Response {
  const body: ApiSuccessResponse<TData> = { data };
  return context.json(body, status);
}
```

Treat `POST /api/profile/diagnosis/start` `200` and `201` responses as the same successful session shape, because the route resumes an existing session or creates a new one using the same payload in `packages/server/src/routes/profile.ts:418-519`:

```ts
if (existingSession !== undefined) {
  const response: StartDiagnosisResponse = {
    session: sessionView,
  };

  return successResponse(context, response);
}

const response: StartDiagnosisResponse = {
  session: sessionView,
};

return successResponse(context, response, 201);
```

Preserve the authored skill order and diagnosis-gated statuses exactly as the existing integration tests assert in `packages/server/src/routes/skills.test.ts:248-327`:

```ts
expect(result.body.data.skills.map((skill) => skill.id)).toEqual(expectedSkillIds);
expect(rootSkill.status).toBe("available");
expect(lockedSkill.status).toBe("locked");
```

## Architecture
- Split TypeScript configuration before adding TSX files. The current server `typecheck` script in `packages/server/package.json:8-10` scans every file under `../../packages`, so adding `packages/web` without a server-local `tsconfig.json` will break backend validation immediately.
- Keep frontend state minimal: one session context backed by `localStorage` plus page-local fetch state. Do not add Redux or another global state framework for a three-route MVP.
- Centralize all HTTP logic in `packages/web/src/lib/api.ts`: typed envelope parsing, bearer token attachment, one refresh retry on `401`, then session clearing and redirect back to `/auth` if refresh fails.
- Route by profile state, not by guessed client state. After login/register, call `GET /api/profile` and send incomplete users to `/diagnosis` and completed users to `/dashboard`.
- Guard `/diagnosis` against accidental re-diagnosis. The backend can create a new session after completion, but the Phase 4 frontend should treat diagnosis as a first-run gate and redirect completed users back to `/dashboard` unless a future phase adds an explicit re-diagnose control.
- Build the dashboard from the existing contracts: use Recharts for `GetProfileResponse.radar`, and render the flat skills payload in authored order while resolving prerequisite names from the same list. Do not invent coordinates or wait for a graph-layout API.
- Prefer targeted fetch mocks in Vitest over MSW for this phase. There is no existing frontend test harness in the repo, and the app only needs a small number of deterministic API interactions.

## Task List
Execute in order. Each task is atomic and independently verifiable.

### Task 1: UPDATE `package.json`
**Action**: UPDATE
**Details**: Add `packages/web` to the root `workspaces`. Introduce root scripts for `dev:web`, `typecheck:web`, `build:web`, `test:web`, and `validate:web`, and update the existing aggregate `typecheck`, `build`, `lint`, `test`, and `validate` scripts so they run both server and web validations in sequence. Convert the root `tsconfig.json` into a shared base config with path aliases only; remove the current repo-wide `include` that only covers `.ts` files. Create `packages/server/tsconfig.json` and update `packages/server/package.json` so server validation targets its own project instead of globbing the entire monorepo. Extend `.env.example` with `VITE_API_BASE_URL=http://localhost:3000/api` while preserving the current server env defaults.
**Pattern**: Follow `package.json:4-22`, `packages/server/package.json:6-16`, `tsconfig.json:2-38`, `.env.example:1-6`, and the monorepo note in `.claude/memory/DETAILS.md:19-23`
**Validate**: `bun run --cwd packages/server typecheck`

### Task 2: CREATE `packages/web/package.json`
**Action**: CREATE
**Details**: Create the new web workspace with `packages/web/package.json`, `packages/web/tsconfig.json`, `packages/web/tsconfig.node.json`, `packages/web/vite.config.ts`, `packages/web/tailwind.config.ts`, `packages/web/postcss.config.mjs`, `packages/web/index.html`, `packages/web/src/vite-env.d.ts`, `packages/web/src/main.tsx`, `packages/web/src/index.css`, and `packages/web/src/test/setup.ts`. Include React, React DOM, React Router, Recharts, Tailwind, Vite, TypeScript, Vitest, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, and `@testing-library/user-event` dependencies/scripts compatible with Bun. Configure Vitest to use `jsdom` and the shared setup file. In `setup.ts`, register `jest-dom` and stub browser APIs needed by Recharts or responsive layout (`matchMedia`, `ResizeObserver`, and `scrollTo` if the chosen components require them).
**Pattern**: Follow the existing package manifest style in `packages/shared/package.json:1-10` and the repo's strict TS conventions from `.claude/CLAUDE.md:102-106`
**Validate**: `bun install && bun run --cwd packages/web typecheck`

### Task 3: CREATE `packages/web/src/lib/api.ts`
**Action**: CREATE
**Details**: Create a typed API layer in `packages/web/src/lib/api.ts` plus `packages/web/src/lib/session.tsx`. The API module should expose small wrappers for `register`, `login`, `refresh`, `getProfile`, `startDiagnosis`, `answerDiagnosis`, and `getSkills`, all typed from `@evolith/shared`. Parse the standard `ApiSuccessResponse` / `ApiErrorResponse` envelope once, throw a typed client error for non-OK responses, and attach the bearer access token automatically when a session is present. When an authenticated request returns `401`, retry exactly once by calling `POST /api/auth/refresh` with the stored refresh token, update the stored tokens on success, and replay the original request. If refresh fails, clear session storage and surface an auth-expired failure so the UI can route back to `/auth`. Keep the stored session shape narrow: `user`, `accessToken`, `refreshToken`, and `tokenType`.
**Pattern**: Follow `packages/server/src/lib/http.ts:9-27`, `packages/server/src/routes/auth.ts:215-293`, `packages/server/src/middleware/auth.ts:42-75`, and `packages/shared/src/types.ts:172-239`
**Validate**: `bun test packages/web/src/lib/api.test.ts`

### Task 4: CREATE `packages/web/src/pages/Auth.tsx`
**Action**: CREATE
**Details**: Build a single auth page that supports register and login modes without leaving `/auth`. Use controlled form state, inline pending/error states, and the shared API client. Successful register/login responses should persist the returned user/tokens in the session context, then immediately call `GET /api/profile` to decide whether to navigate to `/diagnosis` or `/dashboard`. When `/auth` loads with an existing stored session, run the same profile check and redirect authenticated users away from the form. Do not add password reset or profile edit UI. Keep the page visually intentional but implementation-simple; any supporting components can stay local to `packages/web/src/components`.
**Pattern**: Follow `.claude/memory/DECISIONS.md:29-45`, `packages/server/src/routes/auth.ts:139-255`, and the MVP flow in `.archon/ralph/evolith-mvp/prd.md:104-112`
**Validate**: `bun test packages/web/src/pages/Auth.test.tsx`

### Task 5: CREATE `packages/web/src/pages/Diagnosis.tsx`
**Action**: CREATE
**Details**: Build the diagnosis page as a one-question-at-a-time flow. Require an authenticated session, then load `GET /api/profile` once on entry and redirect completed users to `/dashboard` so visiting `/diagnosis` does not silently trigger a re-diagnosis. For incomplete users, call `POST /api/profile/diagnosis/start` on mount and treat `200` and `201` identically. Render progress, current question text, and the returned choices. On answer submission, call `POST /api/profile/diagnosis/:id/answer`, replace local session state with the returned view, and continue until the response becomes `state: "completed"`, then navigate to `/dashboard`. Disable duplicate submits, surface API errors inline, and avoid storing the session id outside the page; the backend already guarantees one resumable in-progress session.
**Pattern**: Follow `packages/server/src/routes/profile.ts:399-519`, `packages/server/src/routes/profile.ts:557-715`, `packages/server/src/routes/profile.test.ts:197-293`, and `.claude/memory/DETAILS.md:14-17`
**Validate**: `bun test packages/web/src/pages/Diagnosis.test.tsx`

### Task 6: CREATE `packages/web/src/pages/Dashboard.tsx`
**Action**: CREATE
**Details**: Build the dashboard page plus `packages/web/src/components/RadarChart.tsx` and `packages/web/src/components/SkillMap.tsx`. After confirming an authenticated session, fetch `GET /api/profile` and `GET /api/skills` in parallel. If the profile says `hasCompletedDiagnosis === false`, redirect to `/diagnosis` before rendering the dashboard. Render the saved `radar` data with Recharts using the backend-provided dimension/value pairs directly. Render the skills payload in authored order, styling by `status` and resolving `prerequisiteIds` to prerequisite names from the same response so locked skills explain why they are still locked. Keep the visualization contract-driven: no new skill positioning API, no drag/drop, and no skill write actions.
**Pattern**: Follow `packages/shared/src/types.ts:59-73`, `packages/shared/src/types.ts:234-245`, `packages/server/src/routes/skills.ts:68-155`, `packages/server/src/routes/skills.test.ts:248-375`, and `packages/server/src/db/seed-data/skill-tree.ts:18-137`
**Validate**: `bun test packages/web/src/pages/Dashboard.test.tsx`

### Task 7: CREATE `packages/web/src/App.tsx`
**Action**: CREATE
**Details**: Compose the app routes in `packages/web/src/App.tsx` and supporting layout/guard components such as `packages/web/src/components/ProtectedRoute.tsx` and `packages/web/src/components/AppShell.tsx`. Define `/`, `/auth`, `/diagnosis`, and `/dashboard`; unauthenticated users should land on `/auth`, while authenticated routes should require a stored session before rendering. Keep diagnosis-completion redirects inside the page logic from Tasks 4-6 so routing decisions are always based on live profile data rather than stale cached flags. Add an integration-style `packages/web/src/App.test.tsx` that covers landing-route behavior, token-based guarding, and bootstrapping from `localStorage`.
**Pattern**: Follow the route composition style in `packages/server/src/app.ts:19-92`, the auth-required behavior in `packages/server/src/routes/profile.test.ts:295-308`, and the diagnosis/dashboard MVP path in `.archon/ralph/evolith-mvp/prd.md:106-112`
**Validate**: `bun test packages/web/src/App.test.tsx`

### Task 8: UPDATE `README.md`
**Action**: UPDATE
**Details**: Rewrite the backend-only README into full-stack setup/run documentation. Keep the current backend setup and curl smoke-test sections, but add the new `packages/web` dependency/setup expectations, `VITE_API_BASE_URL`, `bun run dev:web`, the browser flow from auth to diagnosis to dashboard, and the updated validation commands. Make it clear that local development now uses the API server and the Vite web app together.
**Pattern**: Follow the existing command-oriented README style in `README.md:1-189` and the MVP loop in `.archon/ralph/evolith-mvp/prd.md:24-30`
**Validate**: `grep -n "dev:web\\|VITE_API_BASE_URL\\|dashboard" README.md`

### Task 9: UPDATE `.claude/memory/PROGRESS.md`
**Action**: UPDATE
**Details**: Sync `.claude/memory/PROGRESS.md`, `.claude/memory/DECISIONS.md`, `.claude/memory/DETAILS.md`, `.claude/memory/INDEX.md`, and `.claude/memory/TODOS.md` after implementation. Record Phase 4 as in progress/completed, capture the token-refresh and diagnosis-gating decisions, note any frontend-specific gotchas, and update next steps if any follow-up work remains. Perform the required separate `memory:` commit and push after memory changes, distinct from the code commit, as mandated by `.claude/CLAUDE.md`.
**Pattern**: Follow `.claude/CLAUDE.md:5-64`, `.claude/memory/PROGRESS.md:1-40`, `.claude/memory/DECISIONS.md:1-51`, `.claude/memory/DETAILS.md:1-57`, and `.claude/memory/INDEX.md:1-37`
**Validate**: `grep -n "Phase 4" .claude/memory/PROGRESS.md .claude/memory/INDEX.md`

## Testing Strategy
| Test File | Test Cases | Validates |
|-----------|-----------|-----------|
| `packages/web/src/lib/api.test.ts` | bearer header attachment; envelope parsing; one refresh retry on `401`; token update on refresh success; session clear on refresh failure | Central HTTP/auth behavior is correct before page tests rely on it |
| `packages/web/src/pages/Auth.test.tsx` | register success routes to diagnosis; login success routes to dashboard when diagnosis already completed; invalid credentials show API error; existing stored session redirects away from `/auth` | Auth UI, session persistence, and profile-driven route decisions |
| `packages/web/src/pages/Diagnosis.test.tsx` | start new session on mount; resume existing in-progress session; render progress and current question; answer through completion; redirect to dashboard; completed users are redirected away from diagnosis | Diagnosis start/resume contract usage and sequential page behavior |
| `packages/web/src/pages/Dashboard.test.tsx` | diagnosis-incomplete users redirect to `/diagnosis`; completed users render radar chart; authored skill order is preserved; skill statuses render correctly for `locked`, `available`, `inProgress`, and `completed` | Dashboard data loading, contract rendering, and route protection |
| `packages/web/src/App.test.tsx` | `/` landing redirect; protected routes block unauthenticated access; `localStorage` bootstrap restores the session | Top-level route wiring and session bootstrap behavior |
| `packages/server/src/routes/profile.test.ts` | existing diagnosis/profile suite | Frontend-enabling refactors do not regress diagnosis/profile contracts |
| `packages/server/src/routes/skills.test.ts` | existing skills suite | Frontend-enabling refactors do not regress skill status/order contracts |
| `packages/server/src/app.test.ts` | existing app/auth smoke tests | Root workspace and server script changes do not break app composition |

## Validation Commands
1. Type check: `bun run typecheck`
2. Lint: `bun run lint`
3. Tests: `bun run test`
4. Full validation: `bun run validate`

## Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| The current server `typecheck`/`test` scripts scan the entire `packages/` tree, so adding `packages/web` without package-local TS projects can immediately break backend validation | HIGH | Update root/server scripts and add `packages/server/tsconfig.json` before landing any TSX files |
| A naive diagnosis page that always calls `POST /api/profile/diagnosis/start` can silently create a new diagnosis session for users who already completed the assessment | HIGH | Gate `/diagnosis` with `GET /api/profile` first and redirect completed users back to `/dashboard` |
| Token expiry during diagnosis or dashboard loads can strand the user in a broken partial state | HIGH | Centralize refresh/retry in the API client and clear session on refresh failure so the app returns cleanly to `/auth` |
| The skills API is a flat ordered list, not a positioned graph payload | MED | Render a contract-driven board/list using authored order, `status`, and resolved prerequisite names instead of inventing graph coordinates |
| Recharts can fail in tests without browser API shims | MED | Add `matchMedia`/`ResizeObserver` test setup in `packages/web/src/test/setup.ts` before dashboard tests are written |

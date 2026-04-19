# Issues & Blockers

_Entries in reverse chronological order (newest first)._

---

## Active Issues

_(None yet)_

---

## Resolved Issues

### 2026-04-19 — Issue #9/#10: "Route not found" after registration
- **Problem**: After successful registration, `routeFromProfile()` called `navigate()` with undefined path when `getProfile()` failed silently
- **Fix**: Added auth-level error response in middleware, proper error handling in `Auth.tsx`, `isSubmitting` state guard before navigate
- **Files**: `packages/web/src/pages/Auth.tsx`, `packages/server/src/middleware/auth.ts`

### 2026-04-19 — Issue #7/#8: "The API request could not be completed" — CORS blocked
- **Problem**: Browser cross-origin requests from `localhost:5173` to `localhost:3000` were blocked; no CORS headers
- **Fix**: Added `hono/cors` middleware to `packages/server/src/app.ts` with `origin: http://localhost:5173, credentials: true`
- **Files**: `packages/server/src/app.ts`

### 2026-04-19 — Issue #5/#6: Login returned "invalid JSON" — wrong API base URL
- **Problem**: `VITE_API_BASE_URL` not set in `packages/web/.env`; frontend sent requests to Vite dev server (5173) instead of backend (3000); also `dev.db` was empty (migrations not run)
- **Fix**: Created `packages/web/.env` with `VITE_API_BASE_URL=http://localhost:3000`, created `.env.example` template, documented `bun run db:migrate` in README
- **Files**: `packages/web/.env`, `packages/web/.env.example`, `README.md`

### 2026-04-19 — PR #2 diagnosis review follow-ups

- Corrupted in-progress diagnosis sessions could be returned as healthy on `GET /api/profile/diagnosis/:id` and `POST /api/profile/diagnosis/start`, then fail only on the next answer write.
- The diagnosis session table did not enforce one active in-progress session per user, so concurrent starts could hide duplicate rows.
- Added read/resume integrity guards, a partial unique index for active sessions, duplicate-session conflict handling, answer-body regression coverage, and a sanitized 500 fallback test for impossible persisted session state.

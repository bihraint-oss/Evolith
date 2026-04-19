# TODO & Backlog

## Immediate (Current)

- [ ] Add inline JSDoc for diagnosis route/session invariants near the public exports
- [ ] Decide whether Phase 5 should expose an explicit re-diagnosis control on the dashboard instead of relying on direct route entry
- [ ] Decide whether auth-expired handling should move from page-level errors to a global banner/toast pattern as the web app grows

## Backlog (Post-MVP)

- [ ] AI learning sessions per skill anchor
- [ ] Differentiated feedback by score range
- [ ] Skill node detail view
- [ ] Chat-based AI lesson interface with SSE

## Archived Completed Work

### Phase 1 — Completed 2026-04-18

- [x] Create root `package.json` with Bun workspace config
- [x] Create root `tsconfig.json` with strict TypeScript
- [x] Create `packages/server/package.json` with Hono + Drizzle deps
- [x] Create `packages/shared/package.json` + `types.ts`
- [x] Create `packages/server/src/index.ts` (Hono app skeleton)
- [x] Create `packages/server/drizzle.config.ts`
- [x] Create `packages/server/src/db/schema.ts` (5 tables)
- [x] Run initial migration
- [x] Create `packages/server/src/db/seed.ts` (skill tree data)
- [x] Create `packages/server/src/middleware/auth.ts` (JWT)
- [x] Create `packages/server/src/routes/auth.ts` (register/login/refresh)
- [x] Verify all auth endpoints via curl

### Phase 2 — Completed except noted follow-up

- [ ] Add inline JSDoc for diagnosis route/session invariants near the public exports
- [x] Implement diagnosis scoring algorithm
- [x] Implement AI provider interface (abstract)
- [x] Implement profile routes (GET profile, diagnosis lifecycle)

### Phase 3 — Completed 2026-04-19

- [x] Implement skill routes (GET skills, GET skills/:id)
- [x] Implement unlock logic (prerequisite checking)

### Phase 4 — Completed 2026-04-19

- [x] Initialize Vite + React + Tailwind in `packages/web`
- [x] Build Login/Register page
- [x] Build Dashboard with radar chart (Recharts)
- [x] Build Diagnosis Q&A page

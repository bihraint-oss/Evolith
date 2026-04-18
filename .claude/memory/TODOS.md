# TODO & Backlog

## Immediate (Phase 1 — Next Up)

- [ ] Create root `package.json` with Bun workspace config
- [ ] Create root `tsconfig.json` with strict TypeScript
- [ ] Create `packages/server/package.json` with Hono + Drizzle deps
- [ ] Create `packages/shared/package.json` + `types.ts`
- [ ] Create `packages/server/src/index.ts` (Hono app skeleton)
- [ ] Create `packages/server/drizzle.config.ts`
- [ ] Create `packages/server/src/db/schema.ts` (5 tables)
- [ ] Run initial migration
- [ ] Create `packages/server/src/db/seed.ts` (skill tree data)
- [ ] Create `packages/server/src/middleware/auth.ts` (JWT)
- [ ] Create `packages/server/src/routes/auth.ts` (register/login/refresh)
- [ ] Verify all auth endpoints via curl

## Phase 2 (After Phase 1)

- [ ] Implement diagnosis scoring algorithm
- [ ] Implement AI provider interface (abstract)
- [ ] Implement profile routes (GET profile, diagnosis lifecycle)

## Phase 3 (Parallel with Phase 2)

- [ ] Implement skill routes (GET skills, GET skills/:id)
- [ ] Implement unlock logic (prerequisite checking)

## Phase 4 (After Phase 2+3)

- [ ] Initialize Vite + React + Tailwind in `packages/web`
- [ ] Build Login/Register page
- [ ] Build Dashboard with radar chart (Recharts)
- [ ] Build Diagnosis Q&A page

## Backlog (Post-MVP)

- [ ] AI learning sessions per skill anchor
- [ ] Differentiated feedback by score range
- [ ] Skill node detail view
- [ ] Chat-based AI lesson interface with SSE

# Feature: Phase 3 Skill Graph API

## Summary
Add the authenticated Phase 3 skills read API so the frontend can fetch the seeded skill DAG with per-user unlock status. The implementation should reuse the existing Hono + Drizzle route patterns, add shared DTOs for the new responses, keep unlock state derived from prerequisites instead of storing new rows, and apply the diagnosis gate before any skill becomes available.

## Mission
Expose the seeded skill graph through authenticated `/api/skills` endpoints that merge `skill_nodes` with the current user's `user_progress` rows, keep all skills locked until diagnosis completion, and then compute unlock state from completed prerequisites.

## Success Criteria
- [ ] `GET /api/skills` returns `{ data: { skills: SkillNodeView[] } }` for authenticated users and includes all 25 seeded nodes
- [ ] Each returned skill includes the base node fields plus computed `status`, `startedAt`, `completedAt`, and `score`
- [ ] Unlock rules are correct: all skills remain `locked` until diagnosis is complete; after diagnosis, root nodes default to `available`, unmet prerequisites yield `locked`, completed prerequisites yield `available`, and stored `inProgress` / `completed` rows override the derived state
- [ ] `GET /api/skills/:id` returns one `SkillNodeView` with `200` even when the node is locked, and returns `404` with code `skill_not_found` when the id does not exist
- [ ] The skills router is mounted under `/api` and protected by bearer auth
- [ ] All validation passes (`bun run validate`)
- [ ] No regressions in existing tests

## Scope
### In Scope
- Add shared request/response DTOs for the skills list/detail endpoints in `packages/shared/src/types.ts`
- Create an authenticated `packages/server/src/routes/skills.ts` router with `GET /skills` and `GET /skills/:id`
- Compute unlock state from `skill_nodes.prerequisites` plus the authenticated user's `user_progress`
- Mount the new router from `packages/server/src/app.ts`
- Add route-level integration coverage in `packages/server/src/routes/skills.test.ts` using the existing temp-SQLite app harness plus explicit skill-tree seeding

### Out of Scope
- Database schema or migration changes: `skill_nodes` and `user_progress` already exist in `packages/server/src/db/schema.ts`
- Seed-data changes: the 25-node DAG already exists and is already upserted by `packages/server/src/db/seed.ts`
- Any write endpoint for skill progress or learning-session flows; this phase is read-only API surface
- Frontend rendering, graph layout, or dashboard integration

## Codebase Context
### Key Files
| File | Role | Action |
|------|------|--------|
| `packages/shared/src/types.ts` | Shared API contracts for server + clients | UPDATE |
| `packages/server/src/routes/skills.ts` | New authenticated skills list/detail router and unlock helpers | CREATE |
| `packages/server/src/app.ts` | App composition and `/api` router mounting | UPDATE |
| `packages/server/src/routes/skills.test.ts` | End-to-end route coverage for skills auth, status derivation, and error handling | CREATE |

### Patterns to Follow
Mount the new router the same way authenticated routes are already composed in `packages/server/src/app.ts:61-76`:

```ts
app.route(
  "/api",
  createProfileRouter({
    db: dependencies.db,
    tokenService: dependencies.tokenService,
  }),
);
```

Guard the whole subtree and return the standard envelope exactly like `createProfileRouter` in `packages/server/src/routes/profile.ts:341-377` and `packages/server/src/lib/http.ts:9-27`:

```ts
const router = new Hono<AuthContextBindings>();
const authMiddleware = createAuthMiddleware({
  tokenService: dependencies.tokenService,
});

router.use("/profile", authMiddleware);
router.use("/profile/*", authMiddleware);

router.get("/profile", (context) => {
  return successResponse(context, response);
});
```

Build the skills test harness from the existing temp-database setup in `packages/server/src/routes/profile.test.ts:79-171`, then add explicit seeding using the pattern already exercised in `packages/server/src/db/seed.test.ts:24-56`:

```ts
runMigrations({ databaseFile });

const dbClient = createDatabaseClient({ databaseFile });
const app = createApp({
  db: dbClient.db,
  logger: pino({ enabled: false }),
  tokenService,
});
```

```ts
const firstRunCount = seedSkillTree(dbClient.db);
const rows = dbClient.db.select().from(skillNodes).all();
```

## Architecture
- Keep unlock computation read-only and derived from `skill_nodes.prerequisites` plus the current user's completed progress. Do not persist new `locked` or `available` rows; that avoids stale unlock state and needs no schema work.
- Treat only stored `user_progress.status === "inProgress"` and `"completed"` as authoritative overrides. All other statuses should be recomputed from prerequisites on read so the API reflects the current DAG instead of trusting sparse derived rows.
- Implement one route-local transformation that loads all skill nodes and the authenticated user's progress, orders nodes by `skill_nodes.id` ascending to preserve the seeded authoring order, and reuses the same `SkillNodeView` mapping for both list and detail responses.
- `GET /api/skills/:id` is a read endpoint, not a gatekeeper. Return the node with its computed locked/available state instead of `403` so the frontend can show future anchors.

## Task List
Execute in order. Each task is atomic and independently verifiable.

### Task 1: UPDATE `packages/shared/src/types.ts`
**Action**: UPDATE
**Details**: Add the shared contracts required by the new routes without changing existing entity types. Create `SkillNodeView` that extends `SkillNode` with `status`, `startedAt`, `completedAt`, and `score`. Add `GetSkillsRequest = Record<string, never>`, `GetSkillsResponse { skills: SkillNodeView[] }`, `GetSkillRequest { id: EntityId }`, and `GetSkillResponse { skill: SkillNodeView }`. Keep naming and placement consistent with the existing `GetProfileResponse` / `GetDiagnosisSessionResponse` section near the bottom of the file.
**Pattern**: Follow `packages/shared/src/types.ts:228-258`
**Validate**: `bun run typecheck`

### Task 2: CREATE `packages/server/src/routes/skills.ts`
**Action**: CREATE
**Details**: Create `SkillsRouteDependencies` with `db` and `tokenService`, construct `Hono<AuthContextBindings>`, and guard `/skills` plus `/skills/*` with `createAuthMiddleware`. Add route-local helpers to: load all `skillNodes` in stable seeded order (`orderBy(asc(skillNodes.id))`), load the authenticated user's `userProgress` rows, index progress by `skillNodeId`, build the completed-id set, derive each node's `status`, and map DB rows into `SkillNodeView`. The derivation rules are: stored `completed` => `completed`; stored `inProgress` => `inProgress`; otherwise skills stay `locked` until diagnosis is complete, then become `available` only when every `prerequisiteId` is in the completed-id set, else remain `locked`. `GET /skills` returns all mapped nodes in `{ data: { skills } }`. `GET /skills/:id` reuses the same mapped views, returns `{ data: { skill } }` for the requested id, and returns `errorResponse(context, "Skill not found", 404, "skill_not_found")` when absent. Do not create or mutate `user_progress` rows in this router.
**Pattern**: Follow `packages/server/src/routes/profile.ts:341-508`, `packages/server/src/middleware/auth.ts:42-83`, and `packages/server/src/lib/http.ts:9-27`
**Validate**: `bun run typecheck`

### Task 3: UPDATE `packages/server/src/app.ts`
**Action**: UPDATE
**Details**: Import `createSkillsRouter` and mount it inside the existing auth-enabled block under the shared `/api` prefix, alongside the existing auth and profile routers. Preserve the current dependency guard, request logger, global error handler, and `notFound` behavior unchanged.
**Pattern**: Follow `packages/server/src/app.ts:61-76`
**Validate**: `bun run typecheck`

### Task 4: CREATE `packages/server/src/routes/skills.test.ts`
**Action**: CREATE
**Details**: Create a route test suite that mirrors the style of `profile.test.ts` but seeds the skill tree before requests. The test harness should run migrations, create the DB client, call `seedSkillTree(dbClient.db)`, build the app with a test token service, and clean up the temp directory. Add coverage for:
- unauthenticated `GET /api/skills` and `GET /api/skills/:id` returning `401` / `auth_required`
- a newly registered user receiving all 25 seeded nodes, with every skill including root nodes marked `locked` until diagnosis completion, and the list order matching `aiDeveloperSkillTree.map((node) => node.id)`
- diagnosis completion making root nodes `available`, while deeper nodes like skill `00000000-0000-4000-8000-000000000006` remain `locked` until prerequisites are satisfied
- derived unlock logic after diagnosis completion and inserting completed prerequisite rows for the current user, including a node that becomes `available` without its own `user_progress` row
- stored override logic after inserting `inProgress` and `completed` rows for representative nodes, while leaving a downstream dependent node `locked` until all prerequisites are completed
- `GET /api/skills/:id` returning `200` and the computed `locked` status for a locked node instead of `403`
- `GET /api/skills/:id` returning `404` / `skill_not_found` for an unknown id
- user isolation: a second authenticated user still sees default statuses even when the first user has progress rows
Use direct `db.insert(userProgress)` setup in the tests rather than adding any new write endpoint.
**Pattern**: Follow `packages/server/src/routes/profile.test.ts:79-259` and `packages/server/src/db/seed.test.ts:24-56`
**Validate**: `bun test packages/server/src/routes/skills.test.ts`

## Testing Strategy
| Test File | Test Cases | Validates |
|-----------|-----------|-----------|
| `packages/server/src/routes/skills.test.ts` | auth required; seeded list returns 25 nodes; diagnosis gate lock state; post-diagnosis root availability; derived availability from completed prerequisites; `inProgress` / `completed` overrides; locked detail returns 200; missing id returns 404; user isolation | The new skills API contract, unlock algorithm, auth behavior, error handling, and seeded test harness |
| `packages/server/src/routes/profile.test.ts` | existing profile + diagnosis suite | The new router mount does not regress existing authenticated route behavior |
| `packages/server/src/app.test.ts` | existing health/auth smoke tests | App composition still serves the existing `/api` routes after mounting skills |

## Validation Commands
1. Type check: `bun run typecheck`
2. Lint: `bun run lint`
3. Tests: `bun run test`
4. Full validation: `bun run validate`

## Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Skills list order becomes nondeterministic if the query is left unordered | MED | Explicitly order by `skill_nodes.id` and assert the returned ids match `aiDeveloperSkillTree` in the new test |
| Derived unlock state disagrees with stored `locked` / `available` rows in `user_progress` | MED | Document and implement the sparse-progress rule: only `inProgress` and `completed` override, everything else is recomputed on read |
| Skills tests accidentally exercise an empty table because migrations do not seed data | HIGH | Call `seedSkillTree(dbClient.db)` in the skills test harness and assert the 25-node count in the list response |
| Another user's progress leaks into the authenticated response | HIGH | Always filter `user_progress` by `auth.userId` and add an explicit cross-user isolation test |

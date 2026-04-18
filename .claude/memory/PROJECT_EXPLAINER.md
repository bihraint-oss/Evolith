# Project Explainer — Evolith

This file gives any collaborator (human or AI) a complete understanding of the project in one read.

---

## What Is Evolith?

**Evolith** is an AI-native capability evolution platform. Its core insight: knowledge is commoditized by AI; people need to learn AI collaboration skills, not accumulate knowledge.

**MVP Goal**: Register → Diagnosis → Radar Chart + Skill Graph visualization. Learning sessions are post-MVP.

**Target Users**: Knowledge workers (developers, PMs, analysts) who realize they're only scratching the surface of AI's potential and want structured skill development.

---

## Product Vision

Three engines:
1. **AI Symbiont (Cognitive Profile)** — 5-dimension diagnostic assessment → radar chart
2. **Skill Anchor Star Map** — structured skill tree with unlock logic
3. **Streaming Courses + PBL** — AI-generated content (deferred post-MVP)

**5 Cognitive Dimensions** (locked):
- creativity
- imagination
- prompt precision
- system decomposition
- AI orchestration

---

## Architecture

```
Evolith/
├── packages/
│   ├── server/          # Hono backend API
│   │   └── src/
│   │       ├── index.ts           # Entry point
│   │       ├── app.ts             # Hono app setup
│   │       ├── config/            # Environment config
│   │       ├── db/
│   │       │   ├── schema.ts      # Drizzle schema (5 tables)
│   │       │   ├── client.ts      # DB connection
│   │       │   ├── migrate.ts     # Migration runner
│   │       │   ├── seed.ts        # Skill tree seed data
│   │       │   └── seed-data/
│   │       │       └── skill-tree.ts
│   │       ├── routes/
│   │       │   ├── auth.ts        # register, login, refresh
│   │       │   └── health.ts
│   │       ├── middleware/
│   │       │   └── auth.ts        # JWT verification
│   │       └── lib/
│   │           ├── auth/          # password hashing, token utils
│   │           ├── http.ts        # HTTP utilities
│   │           └── logger.ts
│   └── shared/          # Shared TypeScript types
│       └── src/
│           ├── types.ts
│           └── index.ts
├── .archon/             # Archon workflow configs
├── .claude/             # Claude Code memory & settings
│   ├── CLAUDE.md        # Project rules for Claude Code
│   ├── memory/          # Memory files (see below)
│   └── settings.json
└── .env.example
```

### Database Schema (5 tables)
- **users** — id, email, password_hash, display_name, timestamps
- **skill_nodes** — id, name, description, dimension, difficulty, prerequisites (JSONB), completion_criteria
- **user_abilities** — id, user_id, skill_node_id, status, started_at, completed_at, score
- **diagnosis_sessions** — id, user_id, questions (JSONB), answers (JSONB), profile_snapshot (JSONB), completed_at
- **diagnosis_answers** — id, session_id, question_id, answer_value, dimension_scores (JSONB)

---

## Memory Files

Every file in `.claude/memory/` serves a specific purpose. Read them in order:

| File | Purpose | When to Read |
|---|---|---|
| **INDEX.md** | Start here. Current phase, next steps, project state summary. | Every conversation start |
| **PROGRESS.md** | Phase-by-phase task tracking with status. | When picking up work |
| **CHANGELOG.md** | What changed, when. Historical record of completed work. | After git pull to see recent changes |
| **TODOS.md** | Prioritized next steps and backlog. | When ready to start implementation |
| **DECISIONS.md** | Technical decisions with rationale. | When making or revisiting architectural choices |
| **ISSUES.md** | Active and resolved bugs/blockers. | When encountering problems |
| **DETAILS.md** | Implementation patterns, conventions, gotchas. | Before implementing new features |
| **API-LOG.md** | API endpoint change history. | When modifying APIs |

### Auto-Save Rules (from .claude/CLAUDE.md)

| Trigger | Action |
|---|---|
| Complete a task | Update PROGRESS.md |
| Make a technical decision | Update DECISIONS.md |
| Encounter or fix a bug | Update ISSUES.md |
| Discover a non-obvious pattern | Update DETAILS.md |
| Add or modify an API endpoint | Update API-LOG.md |
| Identify new work | Update TODOS.md |
| End conversation | Update INDEX.md |

---

## Implementation Phases

| Phase | Status | Description |
|---|---|---|
| 0 — Planning & PRD | ✅ Done | PRD via `archon-interactive-prd` workflow |
| 1 — Backend Foundation | ✅ Done | Monorepo, Hono, Drizzle schema, JWT auth, 9 tests |
| 2 — Diagnosis Core Loop | ⬜ Next | Diagnosis service, AI provider interface, profile routes |
| 3 — Skill Graph API | ⬜ Not started | Skill routes, unlock logic |
| 4 — Frontend | ⬜ Not started | Vite + React + Tailwind, radar chart, Q&A pages |

---

## Key Decisions (see DECISIONS.md for full log)

- **D-001**: Bun + Hono + Drizzle + SQLite/PostgreSQL + React/Vite/Tailwind
- **D-002**: MVP scope = Register → Diagnosis → Radar Chart (no learning sessions)
- **D-003**: 5 cognitive dimensions locked, quantification method TBD
- **D-004**: No account management in MVP (no password reset, profile editing, admin)
- **D-005**: Codex is dev-time only; product AI needs swappable provider interface
- **D-006**: Flexible interfaces for questions & skill tree sources
- **D-007**: SQLite for Phase 1, PostgreSQL path preserved

---

## Tech Stack

| Layer | Choice |
|---|---|
| Runtime | Bun |
| Language | TypeScript (strict) |
| Backend | Hono |
| Database | SQLite (dev) / PostgreSQL (prod) via Drizzle ORM |
| Auth | JWT (access 15m + refresh 7d TTL), argon2 via Bun.password |
| Frontend | React + Vite + Tailwind (Phase 4) |
| Charts | Recharts (radar chart) |
| AI | Swappable interface (Codex for dev) |

---

## Development Workflow

### Start a new session
```bash
cd ~/Documents/my_factory/Evolith
git pull origin main
claude
```

### After each phase — test before proceeding
```bash
bun run dev:server   # PORT=3001 if Archon is on 3000
# Run curl tests from README
# Only proceed to next phase when all tests pass
```

### Commit pattern
```bash
feat: add diagnosis scoring algorithm      # new features
fix: correct dimension weight calculation  # bug fixes
memory: update progress — Phase 2 done     # memory updates
```

---

## Testing Rule (from user requirement)

**Test after each phase.** User requires this workflow:
1. Complete a phase
2. Start server, run API tests
3. Verify all endpoints work before moving on

Do NOT skip testing and move to next phase.

---

## PRD Location

Full PRD: `.archon/ralph/evolith-mvp/prd.md`

Contains: problem statement, evidence, solution detail, data models, API endpoints, implementation phases.

---

## User Preferences (remembered)

- User decides WHAT to build — Claude decides HOW
- Do NOT ask user to choose frameworks or technologies
- Always test after completing a phase

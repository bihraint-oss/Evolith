# Evolith MVP — Product Requirements Document

## 1. Problem Statement

Knowledge is becoming commoditized by AI. Traditional learning models — built on accumulating information — are increasingly obsolete. What people actually need is the ability to **collaborate with AI as a capability multiplier**: how to dispatch AI tools, how to ask precise questions, how to expand the boundaries of what they can accomplish with AI. No existing platform trains this systematically. ChatGPT answers questions; Duolingo teaches languages; Coursera delivers lectures. None build the meta-skill of **human-AI collaboration**.

This affects all knowledge workers who sense they are only scratching the surface of AI's potential — developers, product managers, analysts, designers — not a single domain, but anyone who realizes they must evolve alongside AI or risk obsolescence.

## 2. Evidence

- **User pain signal**: Knowledge workers who use ChatGPT/Claude for basic Q&A feel overwhelmed by AI's rapid evolution and under-equipped to leverage it beyond simple lookups. Trigger moment: seeing a colleague do something remarkable with AI and realizing their own usage is shallow.
- **Market gap**: No platform exists that systematizes the training of human-AI collaboration as a composite skill. Current tools address fragments (prompt engineering tips, coding assistants, language learning) but no one integrates diagnosis → personalized path → practice → measurable growth into a single loop.
- **Feasibility enablers**: AI capability development now makes personalized diagnosis and course generation possible for the first time. Simultaneously, demand for "AI collaboration ability" is exploding across industries.
- **Existing PRD**: `.archon/ralph/evolith-mvp/prd.md` documents a prior planning iteration covering tech stack, data models, and API design — this PRD supersedes and refines it.

## 3. Proposed Solution

**Evolith** is an AI-native capability evolution platform with three engines:

1. **AI Symbiont (Cognitive Profile)**: A 5-dimension diagnostic assessment that maps each user's current AI collaboration capabilities — creativity, imagination, prompt precision, system decomposition, AI orchestration — producing a radar chart and quantitative baseline.
2. **Skill Anchor Star Map**: A structured skill tree (20-30 nodes for the "AI Developer" path) with prerequisite unlock logic. Each anchor maps to one or more cognitive dimensions and has clear completion criteria.
3. **Streaming Courses + PBL** (deferred to post-MVP): AI-generated, per-anchor course content with exercises that update cognitive dimension scores.

**MVP core loop**: Register → Diagnosis → Radar Chart + Skill Graph visualization. The learning session loop is deferred but the architecture must support it.

The solution extends the vision documented in `.archon/ralph/evolith-mvp/prd.md`, narrowing scope to the smallest loop that validates the diagnostic→scoring pathway produces a trustworthy signal.

## 4. Key Hypothesis

**The diagnosis→radar chart loop generates enough perceived value that users return to view their profile.**

Measured by: proportion of users who complete diagnosis and subsequently return to view their skill graph. Specific target percentage TBD, but direction is correct — return-after-diagnosis is the leading indicator that the assessment feels valuable and actionable.

Secondary hypothesis: the 5 cognitive dimensions (creativity, imagination, prompt precision, system decomposition, AI orchestration) produce meaningful differentiation in user profiles. Quantification method is uncertain; MVP validates whether the diagnostic→scoring loop produces distinguishable signals, with quantification refinement in later iterations.

## 5. What We're NOT Building

| Excluded | Why |
|---|---|
| Account management (password reset, profile editing) | Not needed for MVP demo |
| Admin dashboard | No user base to manage yet |
| AI learning sessions / chat interface | Post-MVP iteration; architecture must support but UI not built |
| 3D/AR skill graph rendering | Visual polish, not core validation |
| Social features (leaderboards, comparison) | No community yet |
| Mobile adaptation | Demo is desktop-first |
| Code sandbox execution | Too complex for MVP |
| Multi-role paths (only AI Developer path in MVP) | Scope reduction |
| MindHub community, PoV blockchain certificates | Future vision, not MVP |
| Non-linear graph dynamic restructuring | Over-engineering for MVP |

## 6. Success Metrics

| Metric | Target | Measurement |
|---|---|---|
| Users complete full diagnosis | Functional verification | Can register and see radar chart end-to-end |
| Return-after-diagnosis rate | TBD % — direction correct | Users who complete diagnosis return to view profile |
| Skill graph correctly displays | All nodes, correct unlock logic | Visual + API verification |
| All APIs curl-testable | 100% | Every endpoint responds correctly via curl |

MVP goal is **demo-quality for fundraising**, not production-scale metrics. The critical signal is: does the diagnosis→scoring loop produce a result that users find valuable enough to revisit?

## 7. Open Questions

| Question | Status | Impact if Unresolved |
|---|---|---|
| How to quantify the 5 cognitive dimensions reliably? | TBD — MVP uses initial scoring algorithm, refinement deferred | Medium — scoring may feel arbitrary if not calibrated |
| Where do diagnostic questions come from? | TBD — architecture requires flexible question source interface (manual curation, AI-generated, or external import) | Low for MVP — hardcoded questions acceptable initially |
| Where do skill tree nodes come from? | TBD — architecture requires open interface (manual curation, AI-generated, external import). Priority for next iteration. | Low for MVP — hardcoded tree acceptable initially |
| Which AI model for in-product use? | TBD — Codex is development-time model only. Product AI features need a provider interface supporting open-source or commercial models. Architecture must have swappable provider interface. | High — cost and capability depend on model choice |
| What return-after-diagnosis percentage indicates success? | TBD | Medium — need baseline data first |

## 8. Users & Context

### Primary User: The Awareness Gap Knowledge Worker

- **Profile**: Developer, product manager, analyst, or similar. Has used ChatGPT/Claude for basic tasks. Recognizes they're only using AI at surface level. Feels overwhelmed by AI's speed of evolution.
- **Trigger**: Sees a colleague accomplish something impressive with AI and realizes they need structured skill development.
- **Jobs To Be Done**: "When I realize my AI usage is limited to basic Q&A, I want a personalized, systematic path to develop AI collaboration skills, so I can treat AI as a capability multiplier — not a fancy search engine."
- **Context of use**: Desktop, focused sessions. Not casual browsing — intentional skill development time.

### Non-Users (Explicitly Excluded)

- AI resisters who refuse to adopt AI tools
- People who want to memorize AI facts rather than practice skills
- Casual learners seeking certification without practice
- Developers looking for yet another chat UI wrapper

## 9. Solution Detail — MoSCoW Table

| Priority | Feature | Notes |
|---|---|---|
| **Must** | User registration & JWT login | Minimal auth for demo |
| **Must** | 5-dimension cognitive diagnosis (5-8 questions) | Core loop entry point |
| **Must** | Radar chart visualization (5 dimensions) | The "aha moment" — users see their profile |
| **Must** | Skill anchor graph with unlock logic | Visualizes path forward |
| **Must** | Cognitive profile storage & retrieval | Data persistence for diagnosis results |
| **Must** | REST API, all endpoints curl-testable | Backend-first principle |
| **Should** | AI learning sessions per skill anchor | Deferred but architecture must support |
| **Should** | Differentiated feedback by score range | Encouraging / heuristic / challenging styles |
| **Could** | Skill node detail view with start button | Post-MVP learning flow |
| **Could** | Chat-based AI lesson interface with SSE streaming | Post-MVP learning flow |
| **Won't** | Admin panel, password reset, social features | See Section 5 |

### MVP Definition (Minimum)

**Register → Diagnosis → Radar Chart**

1. User registers and logs in
2. User starts diagnostic assessment (5-8 structured questions)
3. System scores 5 cognitive dimensions (0-100)
4. User sees radar chart + skill graph with unlocked nodes
5. Data persists — returning users see their profile

## 10. Technical Approach

### Current Codebase State

**This is a greenfield project.** No application code exists. The repository contains only:
- `README.md` — placeholder ("Space")
- `.archon/config.yaml` — Codex (gpt-5.4 xhigh) as assistant model
- `.archon/ralph/evolith-mvp/prd.md` — prior PRD (superseded by this document)
- `.archon/workflows/archon-fix-github-issue.yaml` — Archon workflow (not part of application)

All file paths below are **to be created**. None exist yet.

### Architecture

```
evolith/
├── packages/
│   ├── server/                    # Hono backend
│   │   ├── src/
│   │   │   ├── index.ts           # App entry, Hono instance
│   │   │   ├── db/
│   │   │   │   ├── schema.ts      # Drizzle schema definitions
│   │   │   │   ├── migrations/    # Drizzle migration files
│   │   │   │   └── seed.ts        # Seed skill tree data
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts        # POST register, login, refresh
│   │   │   │   ├── profile.ts     # GET profile, POST diagnosis/start, answer, GET result
│   │   │   │   └── skills.ts      # GET skills, GET skills/:id
│   │   │   ├── services/
│   │   │   │   ├── diagnosis.ts    # Diagnosis logic & scoring algorithm
│   │   │   │   └── ai-provider.ts # Swappable AI provider interface
│   │   │   └── middleware/
│   │   │       └── auth.ts        # JWT verification middleware
│   │   ├── drizzle.config.ts
│   │   └── package.json
│   ├── web/                       # React + Vite frontend
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   ├── pages/
│   │   │   │   ├── Login.tsx      # Login/Register form
│   │   │   │   ├── Dashboard.tsx  # Radar chart + skill list
│   │   │   │   └── Diagnosis.tsx  # One-question-at-a-time Q&A
│   │   │   ├── components/
│   │   │   │   ├── RadarChart.tsx # Recharts radar chart
│   │   │   │   └── SkillList.tsx  # Skill anchors with status
│   │   │   └── lib/
│   │   │       └── api.ts         # API client
│   │   ├── vite.config.ts
│   │   └── package.json
│   └── shared/                    # Shared types
│       ├── src/
│       │   └── types.ts           # User, CognitiveProfile, SkillNode, etc.
│       └── package.json
├── package.json                   # Workspace root
├── tsconfig.json
└── .env.example
```

### Tech Stack (Verified — no existing code to conflict with)

| Layer | Choice | Rationale |
|---|---|---|
| Runtime | Bun | Fast, TypeScript-native |
| Language | TypeScript (strict) | Type safety across monorepo |
| Backend | Hono | Lightweight, proven in Archon project |
| Database | PostgreSQL + pgvector | Structured data + future embedding support |
| ORM | Drizzle ORM | Type-safe, lightweight |
| Auth | JWT (access + refresh) | Simple for MVP demo |
| Frontend | React + Vite + Tailwind | Minimal, functional |
| Charts | Recharts | Radar chart support |
| AI Provider | Swappable interface | Codex for dev; product AI TBD |

### Data Models (To Be Created in `packages/server/src/db/schema.ts`)

```typescript
// User table
users: {
  id: uuid (PK),
  email: text (unique),
  password_hash: text,
  display_name: text,
  created_at: timestamp,
  updated_at: timestamp
}

// CognitiveProfile table (1:1 with User)
cognitive_profiles: {
  id: uuid (PK),
  user_id: uuid (FK → users, unique),
  creativity: integer (0-100),
  imagination: integer (0-100),
  prompt_precision: integer (0-100),
  architecture: integer (0-100),       // "system_decomposition" in DB for clarity
  ai_orchestration: integer (0-100),
  last_diagnosed_at: timestamp
}

// SkillNode table (predefined, seeded)
skill_nodes: {
  id: uuid (PK),
  name: text,
  description: text,
  dimension: text,                     // one of 5 dimension names
  difficulty: integer (1-5),
  prerequisites: jsonb,                // array of skill_node ids
  completion_criteria: text
}

// UserProgress table
user_progress: {
  id: uuid (PK),
  user_id: uuid (FK → users),
  skill_node_id: uuid (FK → skill_nodes),
  status: text,                       // "locked" | "available" | "in_progress" | "completed"
  started_at: timestamp,
  completed_at: timestamp,
  score: integer
}

// DiagnosisSession table
diagnosis_sessions: {
  id: uuid (PK),
  user_id: uuid (FK → users),
  questions: jsonb,                    // structured diagnostic questions
  answers: jsonb,                      // user answers
  profile_snapshot: jsonb,             // cognitive profile at completion
  completed_at: timestamp
}
```

### API Endpoints (To Be Created)

**Auth routes** (`packages/server/src/routes/auth.ts`):
- `POST /api/auth/register` — create user + empty cognitive profile
- `POST /api/auth/login` — return access + refresh JWT
- `POST /api/auth/refresh` — refresh access token

**Profile routes** (`packages/server/src/routes/profile.ts`):
- `GET /api/profile` — return cognitive profile + radar chart data
- `POST /api/profile/diagnosis/start` — create diagnosis session, return first question
- `POST /api/profile/diagnosis/:id/answer` — submit answer, return next question or completion signal
- `GET /api/profile/diagnosis/:id` — return diagnosis result with dimension scores

**Skill routes** (`packages/server/src/routes/skills.ts`):
- `GET /api/skills` — return skill tree with user progress status
- `GET /api/skills/:id` — return single anchor detail

**Health** (`packages/server/src/index.ts`):
- `GET /api/health` — service health check

### Key Architectural Decisions

1. **Swappable AI provider interface** (`packages/server/src/services/ai-provider.ts`): Must define an abstract interface so Codex can be used during development but product-facing AI features can use open-source or commercial models later.

2. **Flexible question source interface** for diagnosis: Architecture must support manual curation, AI-generated, or external import of diagnostic questions. Initial MVP can hardcode questions.

3. **Open skill tree interface**: Architecture must support manual curation, AI-generated, or external import of skill nodes. Initial MVP uses hardcoded seed data (`packages/server/src/db/seed.ts`).

4. **No `LearningSession` table or learning routes in MVP**: Learning sessions are deferred but the data model and API design in the prior PRD (`.archon/ralph/evolith-mvp/prd.md`) documents the intended future shape.

### Verification Status

| Item | Status |
|---|---|
| File paths in architecture | All **to be created** — no existing code to verify against |
| API endpoints | All **new** — no existing routes to extend |
| DB schema names | All **new** — no existing migrations or tables |
| Component names | All **to be created** — no existing React components |
| Tech stack compatibility with `.archon/config.yaml` | Verified — Codex model for dev-time only, matches config |

## 11. Implementation Phases

### Phase 1: Backend Foundation
**Status: Not started**

| Task | Creates | Depends On |
|---|---|---|
| Initialize monorepo (Bun workspace, tsconfig) | `package.json`, `tsconfig.json` | — |
| Set up Hono server skeleton | `packages/server/src/index.ts` | Monorepo |
| Define Drizzle schema + run migration | `packages/server/src/db/schema.ts` | Hono server |
| Seed skill tree data | `packages/server/src/db/seed.ts` | Schema |
| Implement JWT auth middleware | `packages/server/src/middleware/auth.ts` | Hono server |
| Implement auth routes | `packages/server/src/routes/auth.ts` | Auth middleware, schema |

### Phase 2: Diagnosis Core Loop
**Status: Not started**

| Task | Creates | Depends On |
|---|---|---|
| Implement diagnosis service (scoring algorithm) | `packages/server/src/services/diagnosis.ts` | Schema, auth |
| Implement AI provider interface | `packages/server/src/services/ai-provider.ts` | — |
| Implement profile routes | `packages/server/src/routes/profile.ts` | Diagnosis service, schema |

### Phase 3: Skill Graph & API
**Status: Not started**

| Task | Creates | Depends On |
|---|---|---|
| Implement skill routes | `packages/server/src/routes/skills.ts` | Schema, seed data |
| Implement unlock logic | Within skill routes or service | Skill routes, user progress |

### Phase 4: Frontend
**Status: Not started**

| Task | Creates | Depends On |
|---|---|---|
| Initialize Vite + React + Tailwind | `packages/web/` | — |
| Build Login/Register page | `packages/web/src/pages/Login.tsx` | Auth API |
| Build Dashboard with radar chart | `packages/web/src/pages/Dashboard.tsx`, `RadarChart.tsx`, `SkillList.tsx` | Profile API, Skills API |
| Build Diagnosis Q&A page | `packages/web/src/pages/Diagnosis.tsx` | Diagnosis API |

### Parallel Opportunities

- **Phase 1 tasks 2-3** (Hono skeleton + Drizzle schema) can run in parallel once monorepo is initialized
- **Phase 2 tasks 1-2** (diagnosis service + AI provider interface) can run in parallel
- **Phase 3** is independent of Phase 2 after Phase 1 completes
- **Phase 4 tasks 2-4** (all frontend pages) can run in parallel once APIs are stable; Dashboard and Diagnosis pages are independent of each other

### Implementation Priority

```
Phase 1 → Phase 2 + Phase 3 (parallel) → Phase 4
```

Phase 2 and 3 can execute concurrently since they depend only on Phase 1. Phase 4 can begin partially in parallel once API contracts are defined, even before full backend completion.

## 12. Decisions Log

| Decision | Rationale | Date |
|---|---|---|
| MVP scope = Register → Diagnosis → Radar Chart | Smallest loop that validates diagnostic→scoring produces trustworthy signal; learning sessions deferred | 2026-04-18 |
| Keep 5 cognitive dimensions unchanged | User confirmed: creativity, imagination, prompt precision, system decomposition, AI orchestration. Quantification method TBD but dimensions locked. | 2026-04-18 |
| No account management in MVP | Password reset, profile editing, admin dashboard all deferred — not needed for funding demo | 2026-04-18 |
| Codex is dev-time model only | `.archon/config.yaml` uses Codex (gpt-5.4) for development workflow; product AI features need swappable provider interface | 2026-04-18 |
| Flexible interfaces for questions & skill tree | Source of diagnostic questions and skill nodes is TBD; architecture must support manual curation, AI generation, or external import | 2026-04-18 |
| Prior PRD superseded | `.archon/ralph/evolith-mvp/prd.md` documented a broader MVP including learning sessions; this PRD narrows scope and incorporates user's guided inputs | 2026-04-18 |
| Bun + Hono + Drizzle + PostgreSQL + React/Vite/Tailwind | Matches prior PRD tech stack; proven combination (Hono used in Archon); greenfield so no conflicts | 2026-04-18 |
| Return-after-diagnosis as leading success metric | Direction correct; specific percentage TBD after baseline data collection | 2026-04-18 |
| Funding demo + open source, not production scale | User constraint: must produce demonstrable MVP before funding runs out; prioritize demo quality over production hardening | 2026-04-18 |

---

## Validation Notes

All technical references verified against codebase. This is a greenfield project — no application code exists. All file paths, API endpoints, DB schemas, and component names are **to be created**, not extended. The only existing files are configuration (`README.md`, `.archon/config.yaml`, `.archon/ralph/evolith-mvp/prd.md`, `.archon/workflows/archon-fix-github-issue.yaml`), none of which contain application logic to extend.

Verified:
- 0 existing file paths to extend (all new)
- 0 existing API endpoints to extend (all new)
- 0 existing DB tables/columns to verify (all new)
- 0 existing UI components to verify (all new)
- 1 existing config file verified: `.archon/config.yaml` confirms Codex model used for dev workflows only

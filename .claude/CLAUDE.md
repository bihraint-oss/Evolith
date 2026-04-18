# Evolith — Claude Project Instructions

## Memory System (IMPORTANT)

This project uses a structured memory system in `.claude/memory/`. **You MUST follow these rules in every conversation.**

### On Conversation Start
1. Read `.claude/memory/INDEX.md` first — it summarizes current project state
2. Read any memory files relevant to your current task (referenced in INDEX.md)
3. Use the memory to understand context before writing any code

### On Completing Work (Auto-Save Rules)

Update memory files automatically when any of these triggers fire:

| Trigger | File to Update | What to Write |
|---|---|---|
| Complete a task/subtask | `PROGRESS.md` | Mark task done, add completion date and notes |
| Start a new task | `PROGRESS.md` | Mark task as in-progress |
| Make a technical decision | `DECISIONS.md` | Decision, rationale, alternatives, impact |
| Encounter a bug/blocker | `ISSUES.md` | Description, root cause, resolution or status |
| Resolve a bug/blocker | `ISSUES.md` | Move from Active to Resolved, document solution |
| Discover a non-obvious pattern | `DETAILS.md` | Pattern, gotcha, or convention worth remembering |
| Add/modify/remove an API endpoint | `API-LOG.md` | Endpoint, method, change type, date |
| Identify new work needed | `TODOS.md` | Add to appropriate priority section |
| End of conversation | `INDEX.md` | Update summary with current state, focus, and next steps |

### Update Rules
- Always add new entries at the TOP of the relevant section (most recent first)
- Include dates in ISO format (YYYY-MM-DD)
- Keep entries concise but self-contained — future-you has no conversation context
- After updating any memory file, also update `INDEX.md` summary section
- Never delete entries — archive resolved items in their own section

## Memory Sync (Claude-to-Claude Protocol)

**This is the synchronization mechanism between collaborators' Claude instances.** Memory files are committed to git so any collaborator who pulls the repo gets the latest project state in their Claude session.

### Sync Rules (MANDATORY)

1. **After every memory update**: Commit changes with message format:
   ```
   git commit -m "memory: <brief description of what changed>"
   ```
   Examples: `memory: update progress — Phase 1 task 1.1 done`, `memory: add decision D-007 about auth flow`

2. **Push after commit**: Always `git push` after committing memory updates. This ensures collaborators' Claude instances see the latest state.

3. **On conversation start**: After reading memory files, run `git pull` to get any updates from collaborators before starting work.

4. **Separate memory commits from code commits**: Memory commits use `memory:` prefix. Code commits use conventional `feat:`, `fix:`, etc. Never mix memory and code in one commit.

### Conflict Resolution
- If `git pull` shows memory file conflicts: prefer the REMOTE version for PROGRESS/ISSUES/TODOS (collaborator may have newer state), merge DECISIONS/DETAILS/API-LOG (additive, never delete entries)
- Code conflicts: resolve normally

### File Visibility
- `.claude/` is tracked in git (NOT gitignored) — this is intentional
- `.claude/memory/` is the sync channel — it IS the product, not a side effect

## Git Safety (Project Protection)

**Goal: The project must NEVER be in an unrecoverable state.**

### Commit Frequency
- Commit after completing each subtask (not just at end of session)
- Every code change that compiles = a commit candidate
- Memory changes get their own `memory:` commit immediately

### Branch Strategy
- `main`: stable, always deployable. Only merge via PR from `dev`
- `dev`: working branch. All feature work happens here
- Feature branches: `feat/<name>` from `dev`, merge back to `dev`
- **NEVER** force push to `main` or `dev`
- **NEVER** run `git clean -fd` or `git reset --hard` without explicit user approval

### Before Risky Operations
- Create a safety branch first: `git branch safety/<name>`
- This ensures there's always a rollback point

### What Gets Committed
- All source code (packages/)
- Memory files (.claude/memory/) — with `memory:` prefix
- Config files (tsconfig, drizzle config, etc.)
- Migrations (packages/server/src/db/migrations/)

### What NEVER Gets Committed
- `.env` files (secrets)
- `node_modules/`
- Build output (`dist/`)
- Database files (`*.db`)

### Recovery
- If something breaks: `git log --oneline -20` to find last good commit
- `git revert <hash>` to undo (safe, preserves history)
- Safety branches can be merged back if needed

## Project Context

- **Type**: Greenfield MVP — AI-native capability evolution platform
- **Tech Stack**: Bun + TypeScript (strict) + Hono + SQLite + Drizzle ORM + React/Vite/Tailwind
- **PRD**: `.archon/ralph/evolith-mvp/prd.md`
- **Current backend state**: Phase 1 foundation and the Phase 2 diagnosis loop are implemented; authenticated `/api/profile` diagnosis routes are curl-testable.
- **Phase Order**: Phase 1 (Backend) → Phase 2+3 (parallel) → Phase 4 (Frontend)
- **Constraint**: Backend-first, all APIs curl-testable before frontend work
- **Constraint**: MVP quality for fundraising demo

## Code Style

- TypeScript strict mode, complete type annotations
- No `any` without explicit justification
- Prefer explicit over implicit
- Fail fast with clear error messages
- Structured logging with Pino (event format: `{domain}.{action}_{state}`)

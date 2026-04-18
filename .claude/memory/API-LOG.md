# API Change Log

_Track all API endpoint additions, modifications, and removals._

---

## Legend
- `+` Added
- `~` Modified
- `-` Removed

---

## [Unreleased] — Phase 2

### Activated Endpoints

- `+ GET /api/profile` — authenticated cognitive profile lookup is now mounted in `createApp`
- `+ POST /api/profile/diagnosis/start` — authenticated diagnosis-session start and resume flow is now mounted in `createApp`
- `+ GET /api/profile/diagnosis/:id` — authenticated diagnosis-session fetch is now mounted in `createApp`
- `+ POST /api/profile/diagnosis/:id/answer` — authenticated sequential-answer submission is now mounted in `createApp`

---

## [Unreleased] — Phase 1

Phase 1 shipped the initial health and auth surface that Phase 2 builds on.

### Delivered Endpoints

**Auth:**
- `+ POST /api/auth/register` — create user + empty cognitive profile
- `+ POST /api/auth/login` — return access + refresh JWT
- `+ POST /api/auth/refresh` — refresh access token

**Health:**
- `+ GET /api/health` — service health check

### Planned Endpoints (from PRD backlog)

**Profile:**
- `+ GET /api/profile` — cognitive profile + radar chart data
- `+ POST /api/profile/diagnosis/start` — create diagnosis session, return first question
- `+ POST /api/profile/diagnosis/:id/answer` — submit answer, return next question or completion
- `+ GET /api/profile/diagnosis/:id` — diagnosis result with dimension scores

**Skills (Phase 3):**
- `+ GET /api/skills` — skill tree with user progress
- `+ GET /api/skills/:id` — single anchor detail

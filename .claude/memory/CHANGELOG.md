# Changelog

All notable project changes will be recorded in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

## [0.1.0] — 2026-04-18

### Phase 0 — Planning & PRD
- Generated MVP PRD via `archon-interactive-prd` workflow
- Confirmed 5 cognitive dimensions: creativity, imagination, prompt precision, system decomposition, AI orchestration
- Defined MVP scope: Register → Diagnosis → Radar Chart
- Established tech stack: Bun + Hono + Drizzle + SQLite/PostgreSQL + React/Vite/Tailwind
- Created memory system with 7 tracking files

### Phase 1 — Backend Foundation
- Initialized Bun monorepo with `packages/server`, `packages/shared`
- Set up Hono server with Pino logging, env config
- Defined Drizzle schema (5 tables: users, skill_nodes, user_abilities, diagnosis_sessions, diagnosis_answers)
- Ran SQLite migration via Drizzle
- Seeded 25 skill nodes across 5 categories (Frontend, Backend, DevOps, Data, Soft Skills)
- Implemented JWT auth middleware (access 15m + refresh 7d TTL)
- Implemented auth routes (register/login/refresh + argon2 password hashing)
- Added health check endpoint `GET /api/health`
- Added automated smoke tests (9 tests)
- Created README runbook with curl verification guide
- PR #1 merged to main: https://github.com/bihraint-oss/Evolith/pull/1

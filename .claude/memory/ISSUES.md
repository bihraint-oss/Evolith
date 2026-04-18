# Issues & Blockers

_Entries in reverse chronological order (newest first)._

---

## Active Issues

_(None yet)_

---

## Resolved Issues

### 2026-04-19 — PR #2 diagnosis review follow-ups

- Corrupted in-progress diagnosis sessions could be returned as healthy on `GET /api/profile/diagnosis/:id` and `POST /api/profile/diagnosis/start`, then fail only on the next answer write.
- The diagnosis session table did not enforce one active in-progress session per user, so concurrent starts could hide duplicate rows.
- Added read/resume integrity guards, a partial unique index for active sessions, duplicate-session conflict handling, answer-body regression coverage, and a sanitized 500 fallback test for impossible persisted session state.

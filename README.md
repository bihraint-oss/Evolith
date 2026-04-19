# Evolith

Evolith is a Bun monorepo for the MVP capability-evolution loop:

- `packages/server`: Hono API with auth, profile, diagnosis, and skills routes
- `packages/shared`: shared TypeScript DTOs used by both server and web
- `packages/web`: React + Vite frontend for `/auth` -> `/diagnosis` -> `/dashboard`

The current Phase 4 goal is a working browser flow backed by the existing API contracts, without adding new endpoints.

## Prerequisites

- Bun 1.1+

## Setup

From the repo root:

```bash
bun install
cp .env.example .env
bun run db:migrate
bun run db:seed
```

The default `.env.example` values:

- start the API on `http://localhost:3000`
- store SQLite data at `packages/server/dev.db`
- set `VITE_API_BASE_URL=http://localhost:3000/api` for the web app

The repo-root `.env` is loaded when you use the root scripts such as `bun run dev:server` and `bun run dev:web`. If you run Vite directly inside `packages/web`, provide the same `VITE_API_BASE_URL` in that shell or in `packages/web/.env.local`.

## Run

Start the API in one shell:

```bash
bun run dev:server
```

Start the frontend in a second shell:

```bash
bun run dev:web
```

Then open the browser at the Vite URL, usually:

```text
http://localhost:5173/auth
```

You can still verify the API directly while the server is running:

```bash
curl -sS http://localhost:3000/api/health
```

Expected shape:

```json
{"data":{"status":"ok","service":"evolith-server","timestamp":"2026-04-18T00:00:00.000Z"}}
```

## Browser Flow

The MVP browser loop is:

1. Open `/auth` and register or log in.
2. The app stores the returned tokens and calls `GET /api/profile`.
3. Users without a completed diagnosis are sent to `/diagnosis`.
4. The diagnosis page resumes or creates the in-progress session, asks one question at a time, and redirects on completion.
5. Completed users land on `/dashboard`, which renders the saved radar chart and the authored skill list in API order.

Returning authenticated users are routed from `/auth` back to `/diagnosis` or `/dashboard` based on live profile state, not guessed client state.

## Auth Smoke Test

Use a clean shell while the server is running:

```bash
API_URL="http://localhost:3000/api"
EMAIL="ada@example.com"
PASSWORD="SuperSecret123"
DISPLAY_NAME="Ada Lovelace"
```

Register:

```bash
REGISTER_RESPONSE=$(curl -sS \
  -X POST "$API_URL/auth/register" \
  -H "content-type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"displayName\":\"$DISPLAY_NAME\"}")

printf '%s\n' "$REGISTER_RESPONSE"
```

Login:

```bash
LOGIN_RESPONSE=$(curl -sS \
  -X POST "$API_URL/auth/login" \
  -H "content-type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

printf '%s\n' "$LOGIN_RESPONSE"
```

Extract the access token and refresh token from the login response:

```bash
ACCESS_TOKEN=$(printf '%s' "$LOGIN_RESPONSE" | bun -e 'const input = await new Response(Bun.stdin.stream()).text(); const json = JSON.parse(input); console.log(json.data.tokens.accessToken);')

printf '%s\n' "$ACCESS_TOKEN"
```

```bash
REFRESH_TOKEN=$(printf '%s' "$LOGIN_RESPONSE" | bun -e 'const input = await new Response(Bun.stdin.stream()).text(); const json = JSON.parse(input); console.log(json.data.tokens.refreshToken);')

printf '%s\n' "$REFRESH_TOKEN"
```

Refresh:

```bash
curl -sS \
  -X POST "$API_URL/auth/refresh" \
  -H "content-type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}"
```

Duplicate registration should return `409`:

```bash
curl -i -sS \
  -X POST "$API_URL/auth/register" \
  -H "content-type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"displayName\":\"$DISPLAY_NAME\"}"
```

Invalid login should return `401`:

```bash
curl -i -sS \
  -X POST "$API_URL/auth/login" \
  -H "content-type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"wrong-password\"}"
```

Invalid refresh should return `401`:

```bash
curl -i -sS \
  -X POST "$API_URL/auth/refresh" \
  -H "content-type: application/json" \
  -d '{"refreshToken":"not-a-real-token"}'
```

## Profile & Diagnosis Smoke Test

Fetch the authenticated profile:

```bash
curl -sS \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "$API_URL/profile"
```

Start or resume a diagnosis session:

```bash
START_RESPONSE=$(curl -sS \
  -X POST "$API_URL/profile/diagnosis/start" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "content-type: application/json" \
  -d '{}')

printf '%s\n' "$START_RESPONSE"
```

Extract the session id:

```bash
SESSION_ID=$(printf '%s' "$START_RESPONSE" | bun -e 'const input = await new Response(Bun.stdin.stream()).text(); const json = JSON.parse(input); console.log(json.data.session.id);')

printf '%s\n' "$SESSION_ID"
```

Submit the first answer:

```bash
curl -sS \
  -X POST "$API_URL/profile/diagnosis/$SESSION_ID/answer" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "content-type: application/json" \
  -d '{"choiceId":"sequenced"}'
```

Inspect the session and profile again:

```bash
curl -sS \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "$API_URL/profile/diagnosis/$SESSION_ID"

curl -sS \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "$API_URL/profile"
```

Repeat `POST /api/profile/diagnosis/$SESSION_ID/answer` with the current question's `choiceId` until the session returns `"state":"completed"`.

## Skills Smoke Test

List the seeded skills for the authenticated user:

```bash
SKILLS_RESPONSE=$(curl -sS \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "$API_URL/skills")

printf '%s\n' "$SKILLS_RESPONSE"
```

Before diagnosis completes, every skill should report `"status":"locked"` even for root nodes. Fetch one skill directly:

```bash
SKILL_ID=$(printf '%s' "$SKILLS_RESPONSE" | bun -e 'const input = await new Response(Bun.stdin.stream()).text(); const json = JSON.parse(input); console.log(json.data.skills[0].id);')

curl -sS \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "$API_URL/skills/$SKILL_ID"
```

After the diagnosis session is completed, fetch the skills again. Root nodes now report `"status":"available"`, while deeper nodes remain `"locked"` until their prerequisites are completed.

```bash
curl -sS \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "$API_URL/skills"
```

All API responses use one of these envelopes:

```json
{"data":{...}}
```

```json
{"error":{"message":"...","code":"..."}}
```

## Development Commands

Run the API:

```bash
bun run dev:server
```

Run the web app:

```bash
bun run dev:web
```

Run package-local frontend validation:

```bash
bun run typecheck:web
bun run build:web
bun run test:web
bun run validate:web
```

Run repo-wide validation:

```bash
bun run typecheck
bun run lint
bun run test
bun run validate
```

Database utilities:

```bash
bun run db:generate
bun run db:migrate
bun run db:seed
```

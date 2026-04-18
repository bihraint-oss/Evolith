# Evolith Backend

Evolith provides a Bun workspace with a shared TypeScript package and a Hono API backed by SQLite + Drizzle. The current backend includes health and auth endpoints, authenticated `/api/profile` diagnosis routes, and authenticated `/api/skills` read endpoints that stay locked until diagnosis is complete.

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

The default `.env.example` values start the API on `http://localhost:3000` and store the SQLite database at `packages/server/dev.db`.

## Run

Start the server:

```bash
bun run dev:server
```

In another shell, verify the health endpoint:

```bash
curl -sS http://localhost:3000/api/health
```

Expected shape:

```json
{"data":{"status":"ok","service":"evolith-server","timestamp":"2026-04-18T00:00:00.000Z"}}
```

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

Run the test suite:

```bash
bun run test
```

Run the full validation script:

```bash
bun run validate
```

Regenerate SQL migrations after schema changes:

```bash
bun run db:generate
```

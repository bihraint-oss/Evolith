# Evolith Phase 1 Backend

Phase 1 provides a Bun workspace with a shared TypeScript package and a Hono API backed by SQLite + Drizzle. The current backend includes a health endpoint, deterministic skill-tree seeding, and curl-testable auth flows.

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

Extract the refresh token from the login response:

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

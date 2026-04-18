# Evolith

Evolith is a Bun monorepo for the MVP capability-evolution demo. It includes a Hono API, shared transport/types, and a React/Vite frontend that drives the register/login, diagnosis, and dashboard flow.

## Workspace Layout

- `packages/server`: Hono API, SQLite/Drizzle persistence, seed/migration scripts, repo validation entrypoint
- `packages/shared`: shared request/response DTOs and domain types
- `packages/web`: React/Vite frontend for `/auth`, `/diagnosis`, and `/dashboard`

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

Default local assumptions:

- API origin: `http://localhost:3000`
- SQLite database: `packages/server/dev.db`
- Vite dev server proxies `/api` to `http://localhost:3000`

## Development

Start the API in one shell:

```bash
bun run dev:server
```

Start the frontend in another shell:

```bash
bun run dev:web
```

Then open the Vite URL shown in the terminal, usually `http://localhost:5173`.

The frontend flow is:

1. `/auth`: register or log in
2. `/diagnosis`: start or resume the six-question diagnosis
3. `/dashboard`: view the backend-provided radar plus grouped skill statuses

The frontend assumes the API is reachable at `http://localhost:3000` during local development because [`packages/web/vite.config.ts`](/Users/bihrain/.archon/worktrees/my_factory/Evolith/archon/task-plan-phase4-frontend/packages/web/vite.config.ts:1) proxies `/api` there. If you change the API port, update that proxy or run the web app against a matching origin.

## Validation

Useful root commands:

```bash
bun run type-check
bun run lint
bun run test
bun run format:check
```

Final repo validation for handoff or merge:

```bash
bun run validate && bun run build
```

`bun run validate` runs the centralized repo typecheck/lint/test/format-check path through `packages/server`. `bun run build` adds the production Vite build for `packages/web`.

## API Smoke Check

If you want to verify the backend without the browser, start the server and use:

```bash
API_URL="http://localhost:3000/api"
EMAIL="ada@example.com"
PASSWORD="SuperSecret123"
DISPLAY_NAME="Ada Lovelace"
```

Health:

```bash
curl -sS "$API_URL/health"
```

Register:

```bash
curl -sS \
  -X POST "$API_URL/auth/register" \
  -H "content-type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"displayName\":\"$DISPLAY_NAME\"}"
```

Login:

```bash
LOGIN_RESPONSE=$(curl -sS \
  -X POST "$API_URL/auth/login" \
  -H "content-type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

printf '%s\n' "$LOGIN_RESPONSE"
```

Extract the access token:

```bash
ACCESS_TOKEN=$(printf '%s' "$LOGIN_RESPONSE" | bun -e 'const input = await new Response(Bun.stdin.stream()).text(); const json = JSON.parse(input); console.log(json.data.tokens.accessToken);')
```

Fetch the profile:

```bash
curl -sS \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "$API_URL/profile"
```

List skills:

```bash
curl -sS \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "$API_URL/skills"
```

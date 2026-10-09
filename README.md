# Ragnarok Idle

A web idle RPG inspired by Ragnarok Online. You configure a character's
farming strategy and the server simulates combat while the game is open (VIP
accounts keep progressing while away).

The server is authoritative: a pure, deterministic combat engine produces
discrete events, and the browser only presents them.

## Quick start

Requires Node 22+, pnpm 10 and Docker (Docker Desktop on Windows and macOS).

```bash
pnpm install
pnpm db:up                                   # PostgreSQL in Docker, see docker-compose.yml
cp apps/server/.env.example apps/server/.env # on Windows: copy apps\server\.env.example apps\server\.env
pnpm dev                                     # server on :3001, web on http://localhost:5173
```

The server applies database migrations on startup. Without `DATABASE_URL`
it still runs, but keeps characters in memory and forgets them on restart.

Open http://localhost:5173, create an account (email, password and character
name), and click **Farm Poring Meadow**. To try VIP offline progress locally:
`UPDATE accounts SET vip = true WHERE email = '...';`

In development, sprites come from the public ragassets instance. See
[docs/renderer.md](docs/renderer.md) to self-host a renderer or use
placeholders.

## Scripts

| Command                       | What it does                                    |
| ----------------------------- | ----------------------------------------------- |
| `pnpm dev`                    | Runs the game server and the web app            |
| `pnpm db:up` / `pnpm db:down` | Starts / stops PostgreSQL in Docker             |
| `pnpm db:generate`            | Writes a migration after a schema change        |
| `pnpm test`                   | Runs all unit, simulation and integration tests |
| `pnpm typecheck`              | Type-checks every package                       |
| `pnpm lint` / `pnpm format`   | ESLint / Prettier                               |
| `pnpm simulate --duration 1h` | Balance simulator (see flags below)             |

```bash
pnpm simulate --map prontera_field --duration 1h --runs 100 --seed 1
```

## Layout

```text
apps/
  web/             React + Vite + Zustand + Tailwind client (presentation only)
  server/          Fastify + WebSocket game server
packages/
  shared/          Domain types: stats, content definitions, combat events
  game-data/       Data-driven content: classes, skills, monsters, items, maps
  combat-engine/   Pure deterministic simulation (seeded RNG, no I/O)
  protocol/        WebSocket messages and zod validation
  renderer-client/ ragassets/zrenderer clients and sprite cache
  ui/              Design system: tokens, fonts and React components
tooling/zrenderer/ Docker setup for the sprite renderer
docs/              Architecture, renderer and design system notes
```

See [docs/architecture.md](docs/architecture.md) for how the pieces fit
together and what is still to come.

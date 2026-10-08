# Ragnarok Idle

A web idle RPG inspired by Ragnarok Online. You configure a character's
farming strategy and the server simulates combat, including while you are away.

The server is authoritative: a pure, deterministic combat engine produces
discrete events, and the browser only presents them.

## Quick start

Requires Node 22+ and pnpm 10.

```bash
pnpm install
pnpm dev          # server on :3001, web on http://localhost:5173
```

Open http://localhost:5173 and click **Farm Poring Meadow**.

In development, sprites come from the public ragassets instance. See
[docs/renderer.md](docs/renderer.md) to self-host a renderer or use
placeholders.

## Scripts

| Command                       | What it does                                    |
| ----------------------------- | ----------------------------------------------- |
| `pnpm dev`                    | Runs the game server and the web app            |
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
  web/             React + Vite + Zustand client (presentation only)
  server/          Fastify + WebSocket game server
packages/
  shared/          Domain types: stats, content definitions, combat events
  game-data/       Data-driven content: classes, skills, monsters, items, maps
  combat-engine/   Pure deterministic simulation (seeded RNG, no I/O)
  protocol/        WebSocket messages and zod validation
  renderer-client/ ragassets/zrenderer clients and sprite cache
tooling/zrenderer/ Docker setup for the sprite renderer
docs/              Architecture and renderer notes
```

See [docs/architecture.md](docs/architecture.md) for how the pieces fit
together and what is still to come.

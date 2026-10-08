# Sprite renderer

Combat sprites are rendered by [zrenderer](https://github.com/zhad3/zrenderer),
running as a separate service. The game works without it: when no renderer is
configured the web client draws SVG placeholders.

## How it fits together

```text
Browser ── GET /assets/render/player/{appearance}/{action} ──► game server
        ── GET /assets/render/monster/{monsterId}/{action} ──►     │
                                                                    │ cache miss
                                                                    ▼
                                         zrenderer  POST /render (animated PNG)
```

- `packages/renderer-client` is the only code that knows the zrenderer API:
  action indices, request bodies, the HTTP client and the sprite cache.
- The game server renders each distinct sprite once and stores it on disk
  (`ASSET_CACHE_DIR`), keyed by a hash of the full render request.
- Player sprite URLs use an appearance hash issued by the server in each state
  snapshot, so clients cannot make the renderer draw arbitrary combinations.
- Every sprite is drawn on the same 200x200 canvas with the feet at (100, 170),
  so switching between idle, attack, hit and die never shifts the sprite.
- The client fetches each sprite once and restarts the animation on every
  play. Attack and hit return to idle after a short time; die stays.

Sprite ids live in game data: `SpriteDefinition.jobId` (Swordman 1, Poring
1002, Fabre 1007, Lunatic 1063) and `equipment.viewId` for weapons (Knife 1,
Sword 2).

## Running zrenderer locally

You need your own Ragnarok Online client. Its data is copyrighted by Gravity
and is never committed to this repository.

1. Extract the files listed in zrenderer's
   [RESOURCES.md](https://github.com/zhad3/zrenderer/blob/main/RESOURCES.md)
   from the client's `data.grf` with
   [zextractor](https://github.com/zhad3/zextractor), into
   `tooling/zrenderer/resources/` (so you get `resources/data/sprite/...`).
2. Start the renderer:

   ```bash
   cd tooling/zrenderer
   docker compose up -d
   docker compose logs zrenderer   # first start prints the admin access token
   ```

3. Configure the game server (`apps/server/.env` or your shell):

   ```bash
   RENDERER_URL=http://localhost:11011
   RENDERER_TOKEN=<token from the logs>
   ```

4. `pnpm dev` and start farming. The first time a sprite is needed it is
   rendered; afterwards it comes from `ASSET_CACHE_DIR`.

Check it with `curl localhost:3001/health`: `"renderer": true` means the
server is configured to use it.

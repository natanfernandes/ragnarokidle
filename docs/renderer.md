# Sprite renderer

Combat sprites come from a sprite renderer service. Two are supported, with
the same action indices and output:

- [ragassets](https://github.com/adsonpleal/ragassets) (default): a single Go
  binary that renders from GET query parameters. Its author runs a free public
  instance at `https://assets.latam-tools.com.br` (best effort, no SLA).
- [zrenderer](https://github.com/zhad3/zrenderer): the original D renderer
  ragassets is ported from, run as a Docker container.

The game works without either: when no renderer is configured the web client
draws SVG placeholders.

## Development default

Outside production (`NODE_ENV !== 'production'`), the server uses the public
ragassets instance unless `RENDERER_URL` says otherwise, so `pnpm dev` shows
real sprites with no setup. Set `RENDERER_URL=` (empty) to use placeholders.

Each sprite is fetched once and then served from `ASSET_CACHE_DIR`, so the
public instance only sees a handful of requests. Production has no default:
self-host a renderer instead of relying on someone else's hobby server.

## What decides how the player looks

`appearanceOf` (apps/server/src/assets/appearance.ts) turns a character into
the renderer's terms. Any change to these gives a new appearance hash, so the
client fetches the new sprites as soon as the next snapshot arrives:

| Character data                      | Renderer parameter                |
| ----------------------------------- | --------------------------------- |
| class `sprite.jobId`                | `job`                             |
| `appearance.gender`                 | `gender`                          |
| `appearance.hairStyle`              | `head`                            |
| `appearance.hairColor`              | `headPalette`                     |
| `appearance.clothesColor`           | `bodyPalette`                     |
| `equipment.weapon` item `viewId`    | `weapon`                          |
| `equipment.shield` item `viewId`    | `shield`                          |
| `equipment.garment` item `viewId`   | `garment`                         |
| `equipment.headTop/headMid/headLow` | `headgear` (upper, middle, lower) |

Armor, footgear and accessories are not drawn. Monsters use their
`sprite.jobId`.

## Caching

- Server: each distinct render is stored once in `ASSET_CACHE_DIR`.
- Browser: player sprite URLs contain the appearance hash, so they are served
  as `immutable` for a year. Monster URLs are by id, cached for a day and
  revalidated with `ETag` / `304`. Within a page, each sprite is fetched once.

## How it fits together

```text
Browser ── GET /assets/render/player/{appearance}/{action} ──► game server
        ── GET /assets/render/monster/{monsterId}/{action} ──►     │
                                                                    │ cache miss
                                                                    ▼
                         ragassets GET /image  or  zrenderer POST /render
                                                (animated PNG)
```

- `packages/renderer-client` is the only code that knows the renderer APIs:
  action indices, request bodies, the two HTTP clients and the sprite cache.
- The game server renders each distinct sprite once and stores it on disk
  (`ASSET_CACHE_DIR`), keyed by a hash of the full render request.
- Player sprite URLs use an appearance hash issued by the server in each state
  snapshot, so clients cannot make the renderer draw arbitrary combinations.
- Every sprite is drawn on the same 200x200 canvas with the feet at (100, 170),
  so switching between idle, attack, hit and die never shifts the sprite.
- The client fetches each sprite once and restarts the animation on every
  play, decoding the next image before swapping it in. Attack and hit return
  to idle after one loop of the APNG (read from its frame delays); die stays.
- Players attack with motion 88 when armed (it draws the weapon layer) and 80
  when unarmed.

Sprite ids live in game data: `SpriteDefinition.jobId` (Swordman 1, Poring
1002, Fabre 1007, Lunatic 1063) and `equipment.viewId` for weapons (Knife 1,
Sword 2).

## Self-hosting ragassets

You need your own Ragnarok Online client. Its data is copyrighted by Gravity
and is never committed to this repository. Follow ragassets' README: extract
the sprite data with its `extract-grf.mjs` (which also handles recent encrypted
GRFs), `go build` the gateway, and run it with `RESOURCE_DIR` set. Then:

```bash
RENDERER_KIND=ragassets
RENDERER_URL=http://localhost:8080
```

## Running zrenderer locally

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
   RENDERER_KIND=zrenderer
   RENDERER_URL=http://localhost:11011
   RENDERER_TOKEN=<token from the logs>
   ```

4. `pnpm dev` and start farming. The first time a sprite is needed it is
   rendered; afterwards it comes from `ASSET_CACHE_DIR`.

Check it with `curl localhost:3001/health`: `"renderer": true` means the
server is configured to use it.

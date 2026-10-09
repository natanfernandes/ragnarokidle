import { afterEach, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import {
  MemoryAssetStore,
  RendererError,
  type RenderRequest,
  SpriteService,
} from '@ragidle/renderer-client';
import { buildApp } from '../app';
import { openGame, signUp } from '../test-support';

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]);

let app: FastifyInstance | undefined;
afterEach(async () => {
  await app?.close();
  app = undefined;
});

async function start(render: (request: RenderRequest) => Promise<Uint8Array>) {
  const renderer = { render: vi.fn(render) };
  app = await buildApp({
    config: { maxOfflineMs: 3_600_000 },
    sprites: new SpriteService(renderer, new MemoryAssetStore()),
  });
  await app.ready();
  return { app, renderer };
}

/** Signs up, opens the game and returns the first state snapshot. */
async function snapshot(instance: FastifyInstance) {
  const { socket, inbox } = await openGame(instance, await signUp(instance, 'Sprites'));
  const result = await inbox.next('state.snapshot');
  socket.terminate();
  return result;
}

describe('sprite routes', () => {
  it('renders a monster sprite once and serves it from cache afterwards', async () => {
    const { app, renderer } = await start(async () => PNG);
    const first = await app.inject({ url: '/assets/render/monster/poring/idle/1' });
    expect(first.statusCode).toBe(200);
    expect(first.headers['content-type']).toBe('image/png');
    expect(new Uint8Array(first.rawPayload)).toEqual(PNG);

    await app.inject({ url: '/assets/render/monster/poring/idle/1' });
    expect(renderer.render).toHaveBeenCalledTimes(1);
    expect(renderer.render.mock.calls[0]![0]).toMatchObject({ job: ['1002'], action: 1 });
  });

  it('serves player sprites for appearances issued in snapshots', async () => {
    const { app, renderer } = await start(async () => PNG);
    const { assets } = await snapshot(app);
    expect(assets.rendererEnabled).toBe(true);

    const response = await app.inject({
      url: `/assets/render/player/${assets.playerAppearance}/attack/7`,
    });
    expect(response.statusCode).toBe(200);
    // Swordman (job 1) holding a Knife (dagger view 1), attack (armed motion) facing south-east (7).
    expect(renderer.render.mock.calls[0]![0]).toMatchObject({ job: ['1'], weapon: 1, action: 95 });
  });

  it('lets browsers cache player sprites forever and revalidate monster sprites', async () => {
    const { app, renderer } = await start(async () => PNG);
    const { assets } = await snapshot(app);
    const player = await app.inject({
      url: `/assets/render/player/${assets.playerAppearance}/idle/7`,
    });
    expect(player.headers['cache-control']).toBe('public, max-age=31536000, immutable');

    const monster = await app.inject({ url: '/assets/render/monster/poring/idle/1' });
    expect(monster.headers['cache-control']).toBe('public, max-age=86400');
    const etag = monster.headers.etag as string;

    const revalidated = await app.inject({
      url: '/assets/render/monster/poring/idle/1',
      headers: { 'if-none-match': etag },
    });
    expect(revalidated.statusCode).toBe(304);
    expect(revalidated.body).toBe('');
    expect(renderer.render).toHaveBeenCalledTimes(2);
  });

  it('rejects unknown appearances, monsters and actions', async () => {
    const { app, renderer } = await start(async () => PNG);
    for (const url of [
      '/assets/render/player/not-issued/idle/0',
      '/assets/render/monster/baphomet/idle/0',
      '/assets/render/monster/poring/idle/8',
      '/assets/render/monster/poring/idle',
      '/assets/render/monster/poring/dance/0',
    ]) {
      expect((await app.inject({ url })).statusCode, url).toBe(404);
    }
    expect(renderer.render).not.toHaveBeenCalled();
  });

  it('returns 502 when the renderer fails', async () => {
    const { app } = await start(async () => {
      throw new RendererError('down');
    });
    expect((await app.inject({ url: '/assets/render/monster/poring/idle/1' })).statusCode).toBe(
      502,
    );
  });

  it('returns 404 and tells clients to use placeholders when no renderer is configured', async () => {
    app = await buildApp({ config: { maxOfflineMs: 3_600_000 } });
    await app.ready();
    expect((await app.inject({ url: '/assets/render/monster/poring/idle/1' })).statusCode).toBe(
      404,
    );
    expect((await snapshot(app)).assets.rendererEnabled).toBe(false);
  });
});

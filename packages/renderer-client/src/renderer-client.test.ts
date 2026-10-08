import { mkdtemp, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  Direction,
  FileAssetStore,
  MemoryAssetStore,
  type PlayerAppearance,
  RendererError,
  type RenderRequest,
  SpriteService,
  ZRendererClient,
  actionIndex,
  hashOf,
  monsterRenderRequest,
  playerRenderRequest,
} from './index';

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);

const swordman: PlayerAppearance = {
  jobId: 1,
  gender: 'male',
  head: 1,
  headPalette: -1,
  bodyPalette: -1,
  weaponViewId: 1,
  shieldViewId: 0,
  garmentViewId: 0,
  headgear: [0, 0, 0],
};

describe('action indices', () => {
  it('matches the RO ACT layout used by zrenderer', () => {
    expect(actionIndex('player', 'idle', Direction.south)).toBe(0);
    expect(actionIndex('player', 'attack', Direction.southEast)).toBe(95);
    expect(actionIndex('player', 'attack', Direction.south, { armed: false })).toBe(80);
    expect(actionIndex('player', 'die', Direction.south)).toBe(64);
    expect(actionIndex('monster', 'attack', Direction.southWest)).toBe(17);
    expect(actionIndex('monster', 'die', Direction.south)).toBe(32);
  });
});

describe('render requests', () => {
  it('builds a player request with appearance and a fixed canvas', () => {
    expect(playerRenderRequest(swordman, 'attack', Direction.southEast)).toMatchObject({
      job: ['1'],
      action: 95,
      frame: -1,
      gender: 1,
      weapon: 1,
      canvas: '200x200+100+170',
    });
  });

  it('sends headgear in upper, middle, lower order without trailing empty slots', () => {
    const withHeadgear = { ...swordman, headgear: [0, 125, 0] as PlayerAppearance['headgear'] };
    expect(playerRenderRequest(swordman, 'idle', 0).headgear).toEqual([]);
    expect(playerRenderRequest(withHeadgear, 'idle', 0).headgear).toEqual([0, 125]);
  });

  it('uses the unarmed attack motion without a weapon', () => {
    const unarmed = { ...swordman, weaponViewId: 0 };
    expect(playerRenderRequest(unarmed, 'attack', Direction.southEast).action).toBe(87);
  });

  it('builds a monster request', () => {
    expect(monsterRenderRequest(1002, 'idle', Direction.southWest)).toMatchObject({
      job: ['1002'],
      action: 1,
    });
  });
});

describe('hashOf', () => {
  it('ignores key order and changes with content', () => {
    expect(hashOf({ a: 1, b: [1, 2] })).toBe(hashOf({ b: [1, 2], a: 1 }));
    expect(hashOf({ a: 1 })).not.toBe(hashOf({ a: 2 }));
    expect(hashOf({ a: 1 })).toMatch(/^[A-Za-z0-9_-]{22}$/);
  });
});

describe('ZRendererClient', () => {
  it('posts the request with the access token and returns the PNG', async () => {
    const fetch = vi.fn(
      async () => new Response(PNG, { headers: { 'content-type': 'image/png' } }),
    );
    const client = new ZRendererClient({
      baseUrl: 'http://renderer:11011',
      accessToken: 'secret',
      fetch: fetch as typeof globalThis.fetch,
    });
    const request = monsterRenderRequest(1002, 'idle', Direction.south);

    expect(await client.render(request)).toEqual(PNG);
    const [url, init] = fetch.mock.calls[0] as unknown as [URL, RequestInit];
    expect(url.toString()).toBe('http://renderer:11011/render?downloadimage=');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['x-accesstoken']).toBe('secret');
    expect(JSON.parse(init.body as string)).toEqual(request);
  });

  it('turns HTTP errors into RendererError', async () => {
    const client = new ZRendererClient({
      baseUrl: 'http://renderer:11011',
      accessToken: 'bad',
      fetch: (async () => new Response('Unauthorized', { status: 401 })) as typeof fetch,
    });
    await expect(client.render(monsterRenderRequest(1002, 'idle', 0))).rejects.toMatchObject({
      status: 401,
    });
  });

  it('turns network failures into RendererError', async () => {
    const client = new ZRendererClient({
      baseUrl: 'http://renderer:11011',
      accessToken: 't',
      fetch: (async () => {
        throw new TypeError('fetch failed');
      }) as typeof fetch,
    });
    await expect(client.render(monsterRenderRequest(1002, 'idle', 0))).rejects.toBeInstanceOf(
      RendererError,
    );
  });
});

describe('SpriteService', () => {
  const request: RenderRequest = monsterRenderRequest(1002, 'idle', Direction.south);

  it('renders a sprite once and serves it from the store afterwards', async () => {
    const renderer = { render: vi.fn(async () => PNG) };
    const service = new SpriteService(renderer, new MemoryAssetStore());

    const first = await service.get(request);
    const second = await service.get(request);
    expect(first).toEqual(second);
    expect(renderer.render).toHaveBeenCalledTimes(1);
  });

  it('shares one render between concurrent requests', async () => {
    let resolve!: (bytes: Uint8Array) => void;
    const renderer = { render: vi.fn(() => new Promise<Uint8Array>((r) => (resolve = r))) };
    const service = new SpriteService(renderer, new MemoryAssetStore());

    const pending = Promise.all([service.get(request), service.get(request)]);
    await new Promise((r) => setTimeout(r, 0));
    resolve(PNG);
    await pending;
    expect(renderer.render).toHaveBeenCalledTimes(1);
  });

  it('retries after a failed render', async () => {
    const renderer = {
      render: vi.fn().mockRejectedValueOnce(new RendererError('down')).mockResolvedValue(PNG),
    };
    const service = new SpriteService(renderer, new MemoryAssetStore());
    await expect(service.get(request)).rejects.toThrow('down');
    await expect(service.get(request)).resolves.toMatchObject({ bytes: PNG });
  });
});

describe('FileAssetStore', () => {
  it('persists assets on disk', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ragidle-assets-'));
    const store = new FileAssetStore(dir);
    expect(await store.get('abc')).toBeNull();
    await store.put('abc', PNG);
    expect(await new FileAssetStore(dir).get('abc')).toEqual(PNG);
    expect(await readdir(dir)).toEqual(['abc.png']);
  });

  it('rejects keys that could escape the directory', async () => {
    const store = new FileAssetStore(tmpdir());
    await expect(store.get('../etc/passwd')).rejects.toThrow('Invalid asset key');
  });
});

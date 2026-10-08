import { describe, expect, it, vi } from 'vitest';
import {
  Direction,
  RagassetsClient,
  RendererError,
  monsterRenderRequest,
  playerRenderRequest,
  toQuery,
} from './index';

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);

describe('toQuery', () => {
  it('maps a player request onto /image query parameters', () => {
    const request = playerRenderRequest(
      {
        jobId: 1,
        gender: 'female',
        head: 4,
        headPalette: -1,
        bodyPalette: 2,
        weaponViewId: 2,
        shieldViewId: 0,
        garmentViewId: 1,
        headgear: [4, 125, 0],
      },
      'attack',
      Direction.southEast,
    );
    expect(toQuery(request)).toEqual({
      job: '1',
      action: '95',
      frame: '-1',
      gender: 'female',
      head: '4',
      headPalette: '-1',
      bodyPalette: '2',
      weapon: '2',
      shield: '0',
      garment: '1',
      headgear: '4,125',
      headdir: '0',
      enableShadow: 'true',
      canvas: '200x200+100+170',
      outputFormat: '0',
    });
  });
});

describe('RagassetsClient', () => {
  it('requests GET /image and returns the PNG', async () => {
    const fetch = vi.fn(
      async () => new Response(PNG, { headers: { 'content-type': 'image/png' } }),
    );
    const client = new RagassetsClient({
      baseUrl: 'https://assets.example.com',
      fetch: fetch as typeof globalThis.fetch,
    });

    expect(await client.render(monsterRenderRequest(1002, 'idle', Direction.southWest))).toEqual(
      PNG,
    );
    const [url] = fetch.mock.calls[0] as unknown as [URL];
    expect(url.pathname).toBe('/image');
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      job: '1002',
      action: '1',
      frame: '-1',
      canvas: '200x200+100+170',
    });
  });

  it('turns HTTP errors into RendererError', async () => {
    const client = new RagassetsClient({
      baseUrl: 'https://assets.example.com',
      fetch: (async () => new Response('render failed', { status: 500 })) as typeof fetch,
    });
    await expect(client.render(monsterRenderRequest(9999, 'idle', 0))).rejects.toBeInstanceOf(
      RendererError,
    );
  });
});

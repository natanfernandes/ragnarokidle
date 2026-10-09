import { describe, expect, it } from 'vitest';
import { PUBLIC_RAGASSETS_URL, loadConfig } from './config';

describe('loadConfig', () => {
  it('uses the public ragassets instance in development', () => {
    expect(loadConfig({}).renderer).toMatchObject({ kind: 'ragassets', url: PUBLIC_RAGASSETS_URL });
  });

  it('has no renderer by default in production', () => {
    const production = { NODE_ENV: 'production', DATABASE_URL: 'postgres://db/ragidle' };
    expect(loadConfig(production).renderer.url).toBeNull();
  });

  it('requires a database in production only', () => {
    expect(() => loadConfig({ NODE_ENV: 'production' })).toThrow(/DATABASE_URL/);
    expect(loadConfig({}).databaseUrl).toBeNull();
    expect(loadConfig({ DATABASE_URL: 'postgres://db/x' }).databaseUrl).toBe('postgres://db/x');
  });

  it('turns rendering off with an empty RENDERER_URL', () => {
    expect(loadConfig({ RENDERER_URL: '' }).renderer.url).toBeNull();
  });

  it('selects zrenderer explicitly', () => {
    const { renderer } = loadConfig({
      RENDERER_KIND: 'zrenderer',
      RENDERER_URL: 'http://localhost:11011',
      RENDERER_TOKEN: 't',
    });
    expect(renderer).toMatchObject({
      kind: 'zrenderer',
      url: 'http://localhost:11011',
      accessToken: 't',
    });
  });
});

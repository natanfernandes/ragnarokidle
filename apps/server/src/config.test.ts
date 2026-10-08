import { describe, expect, it } from 'vitest';
import { PUBLIC_RAGASSETS_URL, loadConfig } from './config';

describe('loadConfig', () => {
  it('uses the public ragassets instance in development', () => {
    expect(loadConfig({}).renderer).toMatchObject({ kind: 'ragassets', url: PUBLIC_RAGASSETS_URL });
  });

  it('has no renderer by default in production', () => {
    expect(loadConfig({ NODE_ENV: 'production' }).renderer.url).toBeNull();
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

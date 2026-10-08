import type { AssetStore } from './asset-store';
import { hashOf } from './hash';
import type { RenderRequest } from './requests';
import type { SpriteRenderer } from './zrenderer-client';

/**
 * Renders each distinct sprite once. The cache key is a hash of the full
 * render request (appearance + action + direction + canvas), so any change in
 * what is drawn produces a new key. Concurrent requests for the same sprite
 * share a single render.
 */
export class SpriteService {
  private readonly inFlight = new Map<string, Promise<Uint8Array>>();

  constructor(
    private readonly renderer: SpriteRenderer,
    private readonly store: AssetStore,
  ) {}

  /** Cache key of a request, without rendering it. */
  keyOf(request: RenderRequest): string {
    return hashOf(request);
  }

  async get(request: RenderRequest): Promise<{ key: string; bytes: Uint8Array }> {
    const key = this.keyOf(request);
    const cached = await this.store.get(key);
    if (cached) return { key, bytes: cached };

    let pending = this.inFlight.get(key);
    if (!pending) {
      pending = this.renderAndStore(key, request).finally(() => this.inFlight.delete(key));
      this.inFlight.set(key, pending);
    }
    return { key, bytes: await pending };
  }

  private async renderAndStore(key: string, request: RenderRequest): Promise<Uint8Array> {
    const bytes = await this.renderer.render(request);
    await this.store.put(key, bytes);
    return bytes;
  }
}

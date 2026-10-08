import { SPRITE_ASSET_PATH } from '@ragidle/protocol';
import { apngDurationMs } from './apng';

/** Sprite actions served by the game server (see @ragidle/renderer-client). */
export type RenderedAction = 'idle' | 'attack' | 'hit' | 'die';

export const RENDERED_ACTIONS: RenderedAction[] = ['idle', 'attack', 'hit', 'die'];

export const playerSpriteUrl = (appearance: string, action: RenderedAction) =>
  `${SPRITE_ASSET_PATH}/player/${encodeURIComponent(appearance)}/${action}`;

export const monsterSpriteUrl = (monsterId: string, action: RenderedAction) =>
  `${SPRITE_ASSET_PATH}/monster/${encodeURIComponent(monsterId)}/${action}`;

export interface LoadedSprite {
  blob: Blob;
  /** Length of one animation loop; null for still images. */
  durationMs: number | null;
}

const sprites = new Map<string, Promise<LoadedSprite | null>>();

async function fetchSprite(url: string): Promise<LoadedSprite | null> {
  const response = await fetch(url);
  if (!response.ok || !response.headers.get('content-type')?.startsWith('image/png')) return null;
  const blob = await response.blob();
  return { blob, durationMs: apngDurationMs(new Uint8Array(await blob.arrayBuffer())) };
}

/**
 * Fetches a sprite once per page load. Resolves to null when the sprite is
 * unavailable, in which case callers draw the placeholder instead.
 */
export function loadSprite(url: string): Promise<LoadedSprite | null> {
  let sprite = sprites.get(url);
  if (!sprite) {
    sprite = fetchSprite(url).catch(() => null);
    sprites.set(url, sprite);
  }
  return sprite;
}

export function preloadSprites(urls: string[]): void {
  for (const url of urls) void loadSprite(url);
}

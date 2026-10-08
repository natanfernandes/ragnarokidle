import { SPRITE_ASSET_PATH } from '@ragidle/protocol';

/** Sprite actions served by the game server (see @ragidle/renderer-client). */
export type RenderedAction = 'idle' | 'attack' | 'hit' | 'die';

export const RENDERED_ACTIONS: RenderedAction[] = ['idle', 'attack', 'hit', 'die'];

export const playerSpriteUrl = (appearance: string, action: RenderedAction) =>
  `${SPRITE_ASSET_PATH}/player/${encodeURIComponent(appearance)}/${action}`;

export const monsterSpriteUrl = (monsterId: string, action: RenderedAction) =>
  `${SPRITE_ASSET_PATH}/monster/${encodeURIComponent(monsterId)}/${action}`;

const sprites = new Map<string, Promise<Blob | null>>();

/**
 * Fetches a sprite once per page load. Resolves to null when the sprite is
 * unavailable, in which case callers draw the placeholder instead.
 */
export function loadSprite(url: string): Promise<Blob | null> {
  let sprite = sprites.get(url);
  if (!sprite) {
    sprite = fetch(url)
      .then((response) =>
        response.ok && response.headers.get('content-type')?.startsWith('image/png')
          ? response.blob()
          : null,
      )
      .catch(() => null);
    sprites.set(url, sprite);
  }
  return sprite;
}

export function preloadSprites(urls: string[]): void {
  for (const url of urls) void loadSprite(url);
}

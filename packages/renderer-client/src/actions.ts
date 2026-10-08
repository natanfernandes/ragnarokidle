/**
 * Sprite actions as the game understands them, and their mapping to the
 * action indices used in Ragnarok Online ACT files (and by zrenderer).
 * An ACT action index is `baseAction + direction`.
 */
export const SPRITE_ACTIONS = ['idle', 'ready', 'attack', 'hit', 'die', 'cast'] as const;

export type SpriteAction = (typeof SPRITE_ACTIONS)[number];

export type SpriteKind = 'player' | 'monster';

/** RO directions, counter-clockwise from facing the camera. */
export const Direction = {
  south: 0,
  southWest: 1,
  west: 2,
  northWest: 3,
  north: 4,
  northEast: 5,
  east: 6,
  southEast: 7,
} as const;

export type Direction = (typeof Direction)[keyof typeof Direction];

const PLAYER_ACTIONS: Record<SpriteAction, number> = {
  idle: 0,
  ready: 32,
  attack: 40,
  hit: 48,
  die: 64,
  cast: 96,
};

const MONSTER_ACTIONS: Record<SpriteAction, number> = {
  idle: 0,
  ready: 0,
  attack: 16,
  hit: 24,
  die: 32,
  cast: 16,
};

export function isSpriteAction(value: string): value is SpriteAction {
  return (SPRITE_ACTIONS as readonly string[]).includes(value);
}

export function actionIndex(kind: SpriteKind, action: SpriteAction, direction: Direction): number {
  const base = kind === 'player' ? PLAYER_ACTIONS[action] : MONSTER_ACTIONS[action];
  return base + direction;
}

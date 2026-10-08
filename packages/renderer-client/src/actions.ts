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

/**
 * Player attack motions. The body ACT has three weapon attack blocks (80, 88,
 * 96) besides the plain one at 40, and weapon sprites are drawn in step with
 * them; rendering a weapon on block 40 makes it flicker or vanish mid-swing.
 * Following the client (and zrenderer's own sword example, action 93), armed
 * attacks use 88 and unarmed ones 80.
 */
export const PLAYER_ATTACK_UNARMED = 80;
export const PLAYER_ATTACK_ARMED = 88;

const PLAYER_ACTIONS: Record<SpriteAction, number> = {
  idle: 0,
  ready: 32,
  attack: PLAYER_ATTACK_ARMED,
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

export function actionIndex(
  kind: SpriteKind,
  action: SpriteAction,
  direction: Direction,
  options: { armed?: boolean } = {},
): number {
  if (kind === 'player' && action === 'attack') {
    return (options.armed === false ? PLAYER_ATTACK_UNARMED : PLAYER_ATTACK_ARMED) + direction;
  }
  const base = kind === 'player' ? PLAYER_ACTIONS[action] : MONSTER_ACTIONS[action];
  return base + direction;
}

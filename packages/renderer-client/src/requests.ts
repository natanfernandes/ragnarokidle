import { type Direction, type SpriteAction, type SpriteKind, actionIndex } from './actions';

/** Body of zrenderer's POST /render (API 1.3). Only the fields we use. */
export interface RenderRequest {
  job: string[];
  action: number;
  frame: number;
  gender?: 0 | 1;
  head?: number;
  headgear?: number[];
  garment?: number;
  weapon?: number;
  shield?: number;
  bodyPalette?: number;
  headPalette?: number;
  headdir?: 0 | 1 | 2 | 3;
  enableShadow?: boolean;
  canvas?: string;
  outputFormat?: 0 | 1;
}

/** What a player looks like; independent of class stats and equipment bonuses. */
export interface PlayerAppearance {
  jobId: number;
  gender: 'male' | 'female';
  head: number;
  headPalette: number;
  bodyPalette: number;
  weaponViewId: number;
  shieldViewId: number;
  headgear: number[];
}

/**
 * Every sprite is drawn on the same canvas with the same origin (the actor's
 * feet), so switching actions never makes the sprite jump around.
 */
export const SPRITE_CANVAS = { width: 200, height: 200, originX: 100, originY: 170 } as const;

const canvas = () =>
  `${SPRITE_CANVAS.width}x${SPRITE_CANVAS.height}+${SPRITE_CANVAS.originX}+${SPRITE_CANVAS.originY}`;

const baseRequest = (kind: SpriteKind, action: SpriteAction, direction: Direction) => ({
  action: actionIndex(kind, action, direction),
  // -1 renders every frame of the action as one animated PNG.
  frame: -1,
  enableShadow: true,
  canvas: canvas(),
  outputFormat: 0 as const,
});

export function playerRenderRequest(
  appearance: PlayerAppearance,
  action: SpriteAction,
  direction: Direction,
): RenderRequest {
  return {
    ...baseRequest('player', action, direction),
    job: [String(appearance.jobId)],
    gender: appearance.gender === 'male' ? 1 : 0,
    head: appearance.head,
    headPalette: appearance.headPalette,
    bodyPalette: appearance.bodyPalette,
    weapon: appearance.weaponViewId,
    shield: appearance.shieldViewId,
    headgear: appearance.headgear,
    headdir: 0,
  };
}

export function monsterRenderRequest(
  jobId: number,
  action: SpriteAction,
  direction: Direction,
): RenderRequest {
  return { ...baseRequest('monster', action, direction), job: [String(jobId)] };
}

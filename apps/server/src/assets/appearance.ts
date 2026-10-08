import type { PlayerAppearance } from '@ragidle/renderer-client';
import { hashOf } from '@ragidle/renderer-client';
import { type GameData, gameData } from '@ragidle/game-data';
import type { CharacterState } from '@ragidle/shared';

export function appearanceOf(
  character: CharacterState,
  data: GameData = gameData,
): PlayerAppearance {
  const viewId = (itemId: string | undefined) =>
    (itemId && data.items[itemId]?.equipment?.viewId) || 0;
  return {
    jobId: data.classes[character.classId]?.sprite.jobId ?? 0,
    gender: character.appearance.gender,
    head: character.appearance.head,
    headPalette: character.appearance.headPalette,
    bodyPalette: character.appearance.bodyPalette,
    weaponViewId: viewId(character.equipment.weapon),
    shieldViewId: 0,
    headgear: [],
  };
}

/**
 * Maps appearance hashes (used in public sprite URLs) back to appearances.
 * Clients can only request sprites for appearances the server has issued, so
 * they cannot make the renderer draw arbitrary combinations.
 */
export class AppearanceRegistry {
  private readonly appearances = new Map<string, PlayerAppearance>();

  register(appearance: PlayerAppearance): string {
    const key = hashOf(appearance);
    this.appearances.set(key, appearance);
    return key;
  }

  get(key: string): PlayerAppearance | undefined {
    return this.appearances.get(key);
  }
}

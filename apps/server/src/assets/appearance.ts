import type { PlayerAppearance } from '@ragidle/renderer-client';
import { hashOf } from '@ragidle/renderer-client';
import { type GameData, gameData } from '@ragidle/game-data';
import type { CharacterState, EquipmentSlot } from '@ragidle/shared';

/** Everything that changes how the character is drawn: class, look and visible equipment. */
export function appearanceOf(
  character: CharacterState,
  data: GameData = gameData,
): PlayerAppearance {
  const view = (slot: EquipmentSlot) => {
    const itemId = character.equipment[slot];
    return (itemId && data.items[itemId]?.equipment?.viewId) || 0;
  };
  return {
    jobId: data.classes[character.classId]?.sprite.jobId ?? 0,
    gender: character.appearance.gender,
    head: character.appearance.hairStyle,
    headPalette: character.appearance.hairColor,
    bodyPalette: character.appearance.clothesColor,
    weaponViewId: view('weapon'),
    shieldViewId: view('shield'),
    garmentViewId: view('garment'),
    headgear: [view('headTop'), view('headMid'), view('headLow')],
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

import type { CharacterState, CombatConfig } from '@ragidle/shared';
import { type GameData, gameData } from '@ragidle/game-data';
import { deriveStats } from './formulas';

export function createDefaultCombatConfig(): CombatConfig {
  return {
    targetMode: 'nearest',
    skills: [{ skillId: 'bash', enabled: true, priority: 1, conditions: { minSpPercent: 50 } }],
    potions: {
      hp: { itemId: 'red_potion', enabled: true, belowPercent: 40 },
      sp: { itemId: 'blue_potion', enabled: false, belowPercent: 10 },
    },
    loot: {
      pickupCategories: ['consumable', 'material', 'equipment', 'card'],
      alwaysPickup: [],
      ignore: [],
    },
  };
}

export function createCharacter(
  params: { id: string; name: string; classId?: string; now: number; mapId?: string },
  data: GameData = gameData,
): CharacterState {
  const classId = params.classId ?? 'swordman';
  const cls = data.classes[classId];
  if (!cls) throw new Error(`Unknown class: ${classId}`);

  const character: CharacterState = {
    id: params.id,
    name: params.name,
    classId,
    level: 1,
    experience: 0,
    zeny: 0,
    baseStats: { ...cls.startingStats },
    appearance: { gender: 'male', hairStyle: 1, hairColor: -1, clothesColor: -1 },
    hp: 0,
    sp: 0,
    equipment: { weapon: 'knife', armor: 'cotton_shirt' },
    inventory: { red_potion: 10, blue_potion: 3 },
    combatConfig: createDefaultCombatConfig(),
    currentMapId: params.mapId ?? 'prontera_field',
    lastSimulationAt: params.now,
  };
  const derived = deriveStats(character, data);
  character.hp = derived.maxHp;
  character.sp = derived.maxSp;
  return character;
}

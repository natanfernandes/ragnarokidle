import type { CharacterState, DerivedStats } from '@ragidle/shared';
import { clamp } from '@ragidle/shared';
import { type GameData, gameData } from '@ragidle/game-data';

export const CRITICAL_MULTIPLIER = 1.4;
/** Damage rolls are multiplied by a factor in [1 - V, 1 + V). */
export const DAMAGE_VARIANCE = 0.1;
export const MIN_ATTACK_INTERVAL_MS = 400;

export function deriveStats(character: CharacterState, data: GameData = gameData): DerivedStats {
  const cls = data.classes[character.classId];
  if (!cls) throw new Error(`Unknown class: ${character.classId}`);
  const { str, agi, vit, int, dex, luk } = character.baseStats;
  const level = character.level;

  let weaponAttack = 0;
  let armorDefense = 0;
  for (const itemId of Object.values(character.equipment)) {
    const equipment = itemId ? data.items[itemId]?.equipment : undefined;
    weaponAttack += equipment?.attack ?? 0;
    armorDefense += equipment?.defense ?? 0;
  }

  return {
    maxHp: Math.floor((cls.hpBase + cls.hpPerLevel * (level - 1)) * (1 + vit * 0.01)),
    maxSp: Math.floor((cls.spBase + cls.spPerLevel * (level - 1)) * (1 + int * 0.01)),
    atk: Math.floor(cls.baseAttack + str * 2 + weaponAttack + level * 0.5),
    matk: Math.floor(int * 1.5),
    def: Math.floor(vit * 0.5) + armorDefense,
    mdef: int,
    hit: level + dex,
    flee: level + agi,
    crit: 1 + luk * 0.3,
    attackIntervalMs: Math.max(
      MIN_ATTACK_INTERVAL_MS,
      Math.round(cls.baseAttackIntervalMs - agi * 12 - dex * 4),
    ),
  };
}

/** RO-style hit rate: 80% + HIT - FLEE, clamped to [5%, 100%]. */
export function hitChance(hit: number, flee: number): number {
  return clamp(80 + hit - flee, 5, 100) / 100;
}

export function critChance(crit: number): number {
  return clamp(crit, 0, 100) / 100;
}

/**
 * Physical damage after defense.
 * `roll` is a variance factor around 1 (see DAMAGE_VARIANCE).
 * Critical hits ignore defense.
 */
export function physicalDamage(params: {
  attack: number;
  multiplier: number;
  flatBonus: number;
  defense: number;
  roll: number;
  critical: boolean;
}): number {
  const raw = (params.attack * params.multiplier + params.flatBonus) * params.roll;
  if (params.critical) return Math.max(1, Math.floor(raw * CRITICAL_MULTIPLIER));
  return Math.max(1, Math.floor(raw - params.defense));
}

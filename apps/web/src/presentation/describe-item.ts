import { gameData } from '@ragidle/game-data';
import type { CharacterState, ItemDefinition, StatKey } from '@ragidle/shared';
import { STAT_KEYS } from '@ragidle/shared';

type Bonuses = Record<'atk' | 'def' | StatKey, number>;

function bonuses(item: ItemDefinition | undefined): Bonuses {
  const equipment = item?.equipment;
  const result = { atk: equipment?.attack ?? 0, def: equipment?.defense ?? 0 } as Bonuses;
  for (const key of STAT_KEYS) result[key] = equipment?.stats?.[key] ?? 0;
  return result;
}

const LABELS: Record<keyof Bonuses, string> = {
  atk: 'ATK',
  def: 'DEF',
  str: 'STR',
  agi: 'AGI',
  vit: 'VIT',
  int: 'INT',
  dex: 'DEX',
  luk: 'LUK',
};

export const signed = (value: number) => (value > 0 ? `+${value}` : String(value));

/** "ATK +10, DEF +1" for an item's bonuses. */
export function describeBonuses(itemId: string): string {
  const values = bonuses(gameData.items[itemId]);
  return (Object.keys(LABELS) as (keyof Bonuses)[])
    .filter((key) => values[key] !== 0)
    .map((key) => `${LABELS[key]} ${signed(values[key])}`)
    .join(', ');
}

export interface EquipPreview {
  /** Changes against what is worn in the same slot, e.g. "ATK +15". */
  changes: { label: string; delta: number }[];
  /** Why it cannot be worn; the server has the final say. */
  blockedBy: string | null;
}

export function previewEquip(character: CharacterState, itemId: string): EquipPreview {
  const item = gameData.items[itemId];
  const equipment = item?.equipment;
  if (!item || !equipment) return { changes: [], blockedBy: 'Not equipment' };

  const next = bonuses(item);
  const current = bonuses(gameData.items[character.equipment[equipment.slot] ?? '']);
  const changes = (Object.keys(LABELS) as (keyof Bonuses)[])
    .map((key) => ({ label: LABELS[key], delta: next[key] - current[key] }))
    .filter((change) => change.delta !== 0);

  let blockedBy: string | null = null;
  if (equipment.requiredLevel && character.level < equipment.requiredLevel) {
    blockedBy = `Requires base level ${equipment.requiredLevel}`;
  } else if (equipment.classes && !equipment.classes.includes(character.classId)) {
    blockedBy = 'Your class cannot wear this';
  }
  return { changes, blockedBy };
}

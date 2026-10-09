import { describe, expect, it } from 'vitest';
import type { CharacterState } from '@ragidle/shared';
import { type GameData, gameData } from '@ragidle/game-data';
import { createCharacter } from './character';
import { EquipmentError, equipItem, unequipItem } from './equipment';
import { deriveStats } from './formulas';

const data: GameData = {
  ...gameData,
  items: {
    ...gameData.items,
    vit_ring: {
      id: 'vit_ring',
      name: 'Vit Ring',
      category: 'equipment',
      sellPrice: 1,
      equipment: { slot: 'accessory1', stats: { vit: 50 } },
    },
    acolyte_rod: {
      id: 'acolyte_rod',
      name: 'Acolyte Rod',
      category: 'equipment',
      sellPrice: 1,
      equipment: { slot: 'weapon', classes: ['acolyte'] },
    },
  },
};

function hero(changes: Partial<CharacterState> = {}): CharacterState {
  return { ...createCharacter({ id: 'c1', name: 'Hero', now: 0 }, data), ...changes };
}

function reason(run: () => unknown): string | undefined {
  try {
    run();
  } catch (error) {
    if (error instanceof EquipmentError) return error.reason;
    throw error;
  }
  return undefined;
}

describe('equipment', () => {
  it('swaps the worn item back into the inventory', () => {
    const character = hero({ level: 5, inventory: { sword: 1, red_potion: 3 } });
    const next = equipItem(character, 'sword', data);

    expect(next.equipment.weapon).toBe('sword');
    expect(next.inventory).toEqual({ knife: 1, red_potion: 3 });
    expect(deriveStats(next, data).atk).toBe(deriveStats(character, data).atk + 15);
    expect(character.equipment.weapon).toBe('knife');
  });

  it('unequips into the inventory', () => {
    const next = unequipItem(hero(), 'armor', data);
    expect(next.equipment.armor).toBeUndefined();
    expect(next.inventory.cotton_shirt).toBe(1);
    expect(reason(() => unequipItem(next, 'armor', data))).toBe('slot_empty');
  });

  it('enforces ownership, level and class', () => {
    expect(reason(() => equipItem(hero(), 'sword', data))).toBe('not_owned');
    expect(reason(() => equipItem(hero({ inventory: { sword: 1 } }), 'sword', data))).toBe(
      'level_too_low',
    );
    expect(reason(() => equipItem(hero({ inventory: { jellopy: 1 } }), 'jellopy', data))).toBe(
      'not_equipment',
    );
    expect(
      reason(() => equipItem(hero({ inventory: { acolyte_rod: 1 } }), 'acolyte_rod', data)),
    ).toBe('wrong_class');
  });

  it('applies stat bonuses and clamps HP when they are removed', () => {
    const base = hero({ inventory: { vit_ring: 1 } });
    const worn = equipItem(base, 'vit_ring', data);
    const maxHp = deriveStats(worn, data).maxHp;
    expect(maxHp).toBeGreaterThan(deriveStats(base, data).maxHp);

    const removed = unequipItem({ ...worn, hp: maxHp }, 'accessory1', data);
    expect(removed.hp).toBe(deriveStats(removed, data).maxHp);
  });
});

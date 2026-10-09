import type { CharacterState, EquipmentSlot } from '@ragidle/shared';
import { type GameData, gameData } from '@ragidle/game-data';
import { deriveStats } from './formulas';

export type EquipmentErrorReason =
  'not_owned' | 'not_equipment' | 'level_too_low' | 'wrong_class' | 'slot_empty';

export class EquipmentError extends Error {
  constructor(
    readonly reason: EquipmentErrorReason,
    message: string,
  ) {
    super(message);
  }
}

/** Why the character cannot wear the item, or null if it can. Ignores ownership. */
export function equipRestriction(
  character: CharacterState,
  itemId: string,
  data: GameData = gameData,
): EquipmentError | null {
  const item = data.items[itemId];
  const equipment = item?.equipment;
  if (!item || !equipment) {
    return new EquipmentError('not_equipment', `${item?.name ?? itemId} cannot be equipped`);
  }
  if (equipment.requiredLevel && character.level < equipment.requiredLevel) {
    return new EquipmentError(
      'level_too_low',
      `${item.name} requires base level ${equipment.requiredLevel}`,
    );
  }
  if (equipment.classes && !equipment.classes.includes(character.classId)) {
    const className = data.classes[character.classId]?.name ?? character.classId;
    return new EquipmentError('wrong_class', `${className} cannot wear ${item.name}`);
  }
  return null;
}

/**
 * Wears an item from the inventory; whatever was in its slot goes back to the
 * inventory. Throws EquipmentError when that is not allowed. Pure.
 */
export function equipItem(
  character: CharacterState,
  itemId: string,
  data: GameData = gameData,
): CharacterState {
  if (!character.inventory[itemId]) {
    throw new EquipmentError(
      'not_owned',
      `${data.items[itemId]?.name ?? itemId} is not in the inventory`,
    );
  }
  const restriction = equipRestriction(character, itemId, data);
  if (restriction) throw restriction;

  const slot = data.items[itemId]!.equipment!.slot;
  const next = structuredClone(character);
  removeFromInventory(next, itemId);
  const previous = next.equipment[slot];
  if (previous) addToInventory(next, previous);
  next.equipment[slot] = itemId;
  return clampResources(next, data);
}

/** Moves the item in `slot` back to the inventory. Pure. */
export function unequipItem(
  character: CharacterState,
  slot: EquipmentSlot,
  data: GameData = gameData,
): CharacterState {
  const itemId = character.equipment[slot];
  if (!itemId) throw new EquipmentError('slot_empty', `Nothing is equipped in ${slot}`);
  const next = structuredClone(character);
  delete next.equipment[slot];
  addToInventory(next, itemId);
  return clampResources(next, data);
}

function addToInventory(character: CharacterState, itemId: string): void {
  character.inventory[itemId] = (character.inventory[itemId] ?? 0) + 1;
}

function removeFromInventory(character: CharacterState, itemId: string): void {
  const quantity = (character.inventory[itemId] ?? 0) - 1;
  if (quantity > 0) character.inventory[itemId] = quantity;
  else delete character.inventory[itemId];
}

/** Losing a VIT or INT bonus can lower the maximums below the current values. */
function clampResources(character: CharacterState, data: GameData): CharacterState {
  const { maxHp, maxSp } = deriveStats(character, data);
  character.hp = Math.min(character.hp, maxHp);
  character.sp = Math.min(character.sp, maxSp);
  return character;
}

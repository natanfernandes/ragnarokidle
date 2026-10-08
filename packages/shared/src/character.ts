import type { CombatConfig } from './combat-config';
import type { EquipmentSlot } from './definitions';
import type { Stats } from './stats';

/** itemId -> quantity */
export type InventoryState = Record<string, number>;

export type EquipmentState = Partial<Record<EquipmentSlot, string>>;

/** Cosmetic look of a character; what it wears comes from `equipment`. */
export interface CharacterAppearance {
  gender: 'male' | 'female';
  /** Ragnarok Online head (hair style) id. */
  hairStyle: number;
  /** Ragnarok Online hair palette id; -1 keeps the sprite's own colors. */
  hairColor: number;
  /** Ragnarok Online body palette (clothes dye) id; -1 keeps the sprite's own colors. */
  clothesColor: number;
}

export interface CharacterState {
  id: string;
  name: string;
  classId: string;
  level: number;
  /** Experience accumulated towards the next level. */
  experience: number;
  zeny: number;
  baseStats: Stats;
  appearance: CharacterAppearance;
  hp: number;
  sp: number;
  equipment: EquipmentState;
  inventory: InventoryState;
  combatConfig: CombatConfig;
  currentMapId: string;
  /** Epoch ms of the last processed simulation instant. */
  lastSimulationAt: number;
}

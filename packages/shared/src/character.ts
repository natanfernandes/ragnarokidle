import type { CombatConfig } from './combat-config';
import type { EquipmentSlot } from './definitions';
import type { Stats } from './stats';

/** itemId -> quantity */
export type InventoryState = Record<string, number>;

export type EquipmentState = Partial<Record<EquipmentSlot, string>>;

export interface CharacterAppearance {
  gender: 'male' | 'female';
  head: number;
  headPalette: number;
  bodyPalette: number;
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

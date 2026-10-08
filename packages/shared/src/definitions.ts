import type { StatKey, Stats } from './stats';

export type ItemCategory = 'consumable' | 'material' | 'equipment' | 'card' | 'currency' | 'quest';

export type EquipmentSlot = 'weapon' | 'armor';

export interface ItemEffect {
  restoreHp?: number;
  restoreSp?: number;
}

export interface ItemDefinition {
  id: string;
  name: string;
  category: ItemCategory;
  /** Zeny value when sold to an NPC. */
  sellPrice: number;
  /** Present on consumables. */
  effect?: ItemEffect;
  /** Present on equipment. */
  equipment?: {
    slot: EquipmentSlot;
    attack?: number;
    defense?: number;
  };
}

export interface DropDefinition {
  itemId: string;
  /** Probability in the range [0, 1]. */
  chance: number;
  minQuantity: number;
  maxQuantity: number;
}

/** Placeholder until the renderer is integrated: the client draws a simple shape. */
export interface SpriteDefinition {
  placeholder: {
    shape: 'blob' | 'bug' | 'rabbit' | 'humanoid';
    color: string;
  };
}

export interface MonsterDefinition {
  id: string;
  name: string;
  level: number;
  hp: number;
  attack: number;
  defense: number;
  hit: number;
  flee: number;
  attackIntervalMs: number;
  experience: number;
  zeny: { min: number; max: number };
  drops: DropDefinition[];
  sprite: SpriteDefinition;
}

export interface ClassDefinition {
  id: string;
  name: string;
  baseAttack: number;
  hpBase: number;
  hpPerLevel: number;
  spBase: number;
  spPerLevel: number;
  /** Attack interval before AGI/DEX reductions. */
  baseAttackIntervalMs: number;
  startingStats: Stats;
  skills: string[];
  sprite: SpriteDefinition;
}

export interface SkillDefinition {
  id: string;
  name: string;
  spCost: number;
  cooldownMs: number;
  targeting: 'single' | 'aoe';
  damage: {
    multiplier: number;
    /** Extra flat damage per point of a stat. */
    statScaling: Partial<Record<StatKey, number>>;
    /** Added to the attacker's HIT for this skill. */
    hitBonus?: number;
  };
}

export interface MapDefinition {
  id: string;
  name: string;
  monsters: { monsterId: string; weight: number }[];
  /** Delay between a kill and the next monster appearing. */
  encounterIntervalMs: { min: number; max: number };
}

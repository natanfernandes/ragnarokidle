import type { GridPosition } from './position';
import type { StatKey, Stats } from './stats';

export type ItemCategory = 'consumable' | 'material' | 'equipment' | 'card' | 'currency' | 'quest';

export const EQUIPMENT_SLOTS = [
  'weapon',
  'shield',
  'armor',
  'garment',
  'footgear',
  'headTop',
  'headMid',
  'headLow',
  'accessory1',
  'accessory2',
] as const;

export type EquipmentSlot = (typeof EQUIPMENT_SLOTS)[number];

/** Display names for equipment slots. */
export const EQUIPMENT_SLOT_NAMES: Record<EquipmentSlot, string> = {
  weapon: 'Weapon',
  shield: 'Shield',
  armor: 'Armor',
  garment: 'Garment',
  footgear: 'Footgear',
  headTop: 'Upper headgear',
  headMid: 'Middle headgear',
  headLow: 'Lower headgear',
  accessory1: 'Accessory',
  accessory2: 'Accessory',
};

/** Slots that change how the character is drawn. */
export const VISIBLE_EQUIPMENT_SLOTS = [
  'weapon',
  'shield',
  'garment',
  'headTop',
  'headMid',
  'headLow',
] as const satisfies readonly EquipmentSlot[];

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
    /**
     * Ragnarok Online view id, used by the sprite renderer for visible slots:
     * weapon type or weapon view (weapon), shield view (shield), robe id
     * (garment) and accessory view (headTop/headMid/headLow). Omit for
     * equipment that is not drawn.
     */
    viewId?: number;
    attack?: number;
    defense?: number;
    /** Added to the wearer's primary stats. */
    stats?: Partial<Stats>;
    /** Minimum base level to wear it. */
    requiredLevel?: number;
    /** Class ids that can wear it; every class when omitted. */
    classes?: string[];
  };
}

export interface DropDefinition {
  itemId: string;
  /** Probability in the range [0, 1]. */
  chance: number;
  minQuantity: number;
  maxQuantity: number;
}

export interface SpriteDefinition {
  /** Ragnarok Online job or monster id, used by the sprite renderer. */
  jobId?: number;
  /** Drawn by the client when no rendered sprite is available. */
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
  /** Time to walk one cell (RO "speed"). */
  moveSpeedMs: number;
  /** Cells from which the monster can attack. */
  attackRange: number;
  /**
   * Set on aggressive monsters: they walk up to a player within this many
   * cells. Passive monsters wait for the player to come to them.
   */
  aggroRange?: number;
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
  /** Time to walk one cell (RO "speed"). */
  moveSpeedMs: number;
  /** Cells from which the class attacks: 1 for melee. */
  attackRange: number;
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
  /** Size of the field in cells. */
  size: { width: number; height: number };
  /** Where players appear when they enter the map or respawn. */
  spawnPoint: GridPosition;
  /** Delay between a kill and the next monster appearing. */
  encounterIntervalMs: { min: number; max: number };
}

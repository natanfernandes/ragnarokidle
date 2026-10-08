import type { ItemCategory } from './definitions';

export type TargetMode = 'nearest' | 'lowest_hp' | 'highest_xp' | 'specific';

export interface SkillStrategy {
  skillId: string;
  enabled: boolean;
  /** Lower number = evaluated first. */
  priority: number;
  conditions?: {
    minHpPercent?: number;
    maxHpPercent?: number;
    minSpPercent?: number;
    minTargets?: number;
  };
}

export interface PotionRule {
  itemId: string;
  enabled: boolean;
  /** Use the potion when the resource is strictly below this percent. */
  belowPercent: number;
}

export interface PotionStrategy {
  hp: PotionRule;
  sp: PotionRule;
}

export interface LootStrategy {
  /** Categories that are picked up. */
  pickupCategories: ItemCategory[];
  /** Item ids always picked up regardless of category. */
  alwaysPickup: string[];
  /** Item ids never picked up regardless of category. */
  ignore: string[];
}

export interface CombatConfig {
  targetMode: TargetMode;
  targetMonsterId?: string;
  skills: SkillStrategy[];
  potions: PotionStrategy;
  loot: LootStrategy;
}

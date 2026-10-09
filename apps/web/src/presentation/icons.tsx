import type { EquipmentSlot, ItemCategory, ItemDefinition, StatKey } from '@ragidle/shared';
import {
  Brain,
  Clover,
  Coins,
  Crosshair,
  Crown,
  Dumbbell,
  FlaskConical,
  Footprints,
  Gem,
  Glasses,
  Heart,
  Layers,
  type LucideIcon,
  Package,
  ScrollText,
  Shield,
  Shirt,
  Smile,
  Sparkles,
  Sword,
  Wind,
} from 'lucide-react';

/** Icon per item category, until item icons come from the renderer. */
export const CATEGORY_ICON: Record<ItemCategory, LucideIcon> = {
  consumable: FlaskConical,
  material: Package,
  equipment: Sword,
  card: Layers,
  currency: Coins,
  quest: ScrollText,
};

/** Text color for an item: SP potions are blue, HP potions red, cards pink. */
export function itemTextClass(item: ItemDefinition | undefined): string {
  if (!item) return 'text-text-soft';
  if (item.category === 'consumable' && item.effect?.restoreSp) return 'text-sp';
  return CATEGORY_TEXT[item.category];
}

/** Text color per item category. Cards are the rare, celebrated drop. */
export const CATEGORY_TEXT: Record<ItemCategory, string> = {
  consumable: 'text-hp',
  material: 'text-text-soft',
  equipment: 'text-loot',
  card: 'text-card',
  currency: 'text-zeny',
  quest: 'text-primary',
};

export const STAT_ICON: Record<StatKey, LucideIcon> = {
  str: Dumbbell,
  agi: Wind,
  vit: Heart,
  int: Brain,
  dex: Crosshair,
  luk: Clover,
};

export const STAT_LABEL: Record<StatKey, string> = {
  str: 'Strength',
  agi: 'Agility',
  vit: 'Vitality',
  int: 'Intelligence',
  dex: 'Dexterity',
  luk: 'Luck',
};

export const SLOT_ICON: Record<EquipmentSlot, LucideIcon> = {
  weapon: Sword,
  shield: Shield,
  armor: Shirt,
  garment: Sparkles,
  footgear: Footprints,
  headTop: Crown,
  headMid: Glasses,
  headLow: Smile,
  accessory1: Gem,
  accessory2: Gem,
};

export const SLOT_LABEL: Record<EquipmentSlot, string> = {
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

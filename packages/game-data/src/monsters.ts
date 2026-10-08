import type { MonsterDefinition } from '@ragidle/shared';

export const poring: MonsterDefinition = {
  id: 'poring',
  name: 'Poring',
  level: 1,
  hp: 55,
  attack: 7,
  defense: 0,
  hit: 7,
  flee: 2,
  attackIntervalMs: 1800,
  moveSpeedMs: 400,
  attackRange: 1,
  experience: 10,
  zeny: { min: 1, max: 3 },
  drops: [
    { itemId: 'jellopy', chance: 0.7, minQuantity: 1, maxQuantity: 1 },
    { itemId: 'apple', chance: 0.1, minQuantity: 1, maxQuantity: 1 },
    { itemId: 'red_potion', chance: 0.02, minQuantity: 1, maxQuantity: 1 },
    { itemId: 'poring_card', chance: 0.0001, minQuantity: 1, maxQuantity: 1 },
  ],
  sprite: { jobId: 1002, placeholder: { shape: 'blob', color: '#f48fb1' } },
};

export const fabre: MonsterDefinition = {
  id: 'fabre',
  name: 'Fabre',
  level: 2,
  hp: 63,
  attack: 9,
  defense: 0,
  hit: 9,
  flee: 4,
  attackIntervalMs: 1700,
  moveSpeedMs: 400,
  attackRange: 1,
  experience: 14,
  zeny: { min: 2, max: 4 },
  drops: [
    { itemId: 'fluff', chance: 0.65, minQuantity: 1, maxQuantity: 1 },
    { itemId: 'red_potion', chance: 0.03, minQuantity: 1, maxQuantity: 1 },
    { itemId: 'sword', chance: 0.005, minQuantity: 1, maxQuantity: 1 },
  ],
  sprite: { jobId: 1007, placeholder: { shape: 'bug', color: '#9ccc65' } },
};

export const lunatic: MonsterDefinition = {
  id: 'lunatic',
  name: 'Lunatic',
  level: 3,
  hp: 60,
  attack: 11,
  defense: 1,
  hit: 12,
  flee: 8,
  attackIntervalMs: 1500,
  moveSpeedMs: 200,
  attackRange: 1,
  experience: 18,
  zeny: { min: 3, max: 6 },
  drops: [
    { itemId: 'clover', chance: 0.65, minQuantity: 1, maxQuantity: 1 },
    { itemId: 'feather', chance: 0.2, minQuantity: 1, maxQuantity: 2 },
    { itemId: 'cotton_shirt', chance: 0.01, minQuantity: 1, maxQuantity: 1 },
  ],
  sprite: { jobId: 1063, placeholder: { shape: 'rabbit', color: '#f5f5f5' } },
};

export const monsters: Record<string, MonsterDefinition> = {
  [poring.id]: poring,
  [fabre.id]: fabre,
  [lunatic.id]: lunatic,
};

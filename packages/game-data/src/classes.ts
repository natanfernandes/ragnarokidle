import type { ClassDefinition } from '@ragidle/shared';

export const swordman: ClassDefinition = {
  id: 'swordman',
  name: 'Swordman',
  baseAttack: 5,
  hpBase: 60,
  hpPerLevel: 18,
  spBase: 12,
  spPerLevel: 3,
  baseAttackIntervalMs: 1400,
  startingStats: { str: 9, agi: 5, vit: 7, int: 1, dex: 5, luk: 3 },
  skills: ['bash'],
  sprite: { jobId: 1, placeholder: { shape: 'humanoid', color: '#3b6fd8' } },
};

export const classes: Record<string, ClassDefinition> = {
  [swordman.id]: swordman,
};

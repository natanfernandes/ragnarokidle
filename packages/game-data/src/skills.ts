import type { SkillDefinition } from '@ragidle/shared';

export const bash: SkillDefinition = {
  id: 'bash',
  name: 'Bash',
  spCost: 8,
  cooldownMs: 0,
  targeting: 'single',
  damage: {
    multiplier: 2,
    statScaling: {},
    hitBonus: 10,
  },
};

export const skills: Record<string, SkillDefinition> = {
  [bash.id]: bash,
};

import { describe, expect, it } from 'vitest';
import { createCharacter } from '@ragidle/combat-engine';
import { AppearanceRegistry, appearanceOf } from './appearance';

const swordman = () => createCharacter({ id: 'c1', name: 'Tester', now: 0 });

describe('appearanceOf', () => {
  it('maps class, look and every visible equipment slot', () => {
    const character = swordman();
    character.appearance = { gender: 'female', hairStyle: 4, hairColor: 2, clothesColor: 1 };
    character.equipment = {
      weapon: 'sword',
      shield: 'guard',
      armor: 'cotton_shirt',
      headTop: 'flower',
    };

    expect(appearanceOf(character)).toEqual({
      jobId: 1,
      gender: 'female',
      head: 4,
      headPalette: 2,
      bodyPalette: 1,
      weaponViewId: 2,
      shieldViewId: 1,
      garmentViewId: 0,
      headgear: [4, 0, 0],
    });
  });

  it('gives a new sprite key when visible equipment changes, but not for hidden slots', () => {
    const registry = new AppearanceRegistry();
    const character = swordman();
    const base = registry.register(appearanceOf(character));

    const withSword = { ...character, equipment: { ...character.equipment, weapon: 'sword' } };
    expect(registry.register(appearanceOf(withSword))).not.toBe(base);

    const withoutArmor = { ...character, equipment: { weapon: character.equipment.weapon } };
    expect(registry.register(appearanceOf(withoutArmor))).toBe(base);
  });
});

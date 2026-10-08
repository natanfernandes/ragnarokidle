import { describe, expect, it } from 'vitest';
import { experienceToNextLevel, gameData } from './index';

describe('game data integrity', () => {
  it('references only existing items in drop tables', () => {
    for (const monster of Object.values(gameData.monsters)) {
      for (const drop of monster.drops) {
        expect(gameData.items[drop.itemId], `${monster.id} -> ${drop.itemId}`).toBeDefined();
        expect(drop.chance).toBeGreaterThan(0);
        expect(drop.chance).toBeLessThanOrEqual(1);
        expect(drop.minQuantity).toBeLessThanOrEqual(drop.maxQuantity);
      }
    }
  });

  it('references only existing monsters in maps', () => {
    for (const map of Object.values(gameData.maps)) {
      expect(map.monsters.length).toBeGreaterThan(0);
      for (const spawn of map.monsters) {
        expect(gameData.monsters[spawn.monsterId], `${map.id} -> ${spawn.monsterId}`).toBeDefined();
      }
    }
  });

  it('places spawn points inside their maps', () => {
    for (const map of Object.values(gameData.maps)) {
      const { x, y } = map.spawnPoint;
      expect(x >= 0 && x < map.size.width && y >= 0 && y < map.size.height, map.id).toBe(true);
    }
  });

  it('references only existing skills in classes', () => {
    for (const cls of Object.values(gameData.classes)) {
      for (const skillId of cls.skills) expect(gameData.skills[skillId]).toBeDefined();
    }
  });

  it('has a strictly increasing experience curve', () => {
    for (let level = 2; level < 99; level++) {
      expect(experienceToNextLevel(level)).toBeGreaterThan(experienceToNextLevel(level - 1));
    }
  });
});

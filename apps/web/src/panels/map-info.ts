import { gameData } from '@ragidle/game-data';
import type { MapDefinition } from '@ragidle/shared';

/** "1 - 3": the level range of the monsters that spawn on a map. */
export function mapLevelRange(map: MapDefinition): string {
  const levels = map.monsters
    .map((m) => gameData.monsters[m.monsterId]?.level)
    .filter((l): l is number => l !== undefined);
  if (levels.length === 0) return '?';
  const min = Math.min(...levels);
  const max = Math.max(...levels);
  return min === max ? `${min}` : `${min} - ${max}`;
}

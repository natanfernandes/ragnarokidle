import type { CharacterState, GridPosition, Movement } from '@ragidle/shared';

export interface MonsterInstance {
  instanceId: string;
  monsterId: string;
  hp: number;
  maxHp: number;
  nextActionAt: number;
  /** Where the monster stands, or will stand once its current walk ends. */
  position: GridPosition;
  /** The monster's latest walk; it may already be over. */
  movement: Movement | null;
}

export interface PlayerCombatState {
  nextActionAt: number;
  /** Where the player stands, or will stand once the current walk ends. */
  position: GridPosition;
  /** The player's latest walk; it may already be over. */
  movement: Movement | null;
  /** Set while the player is dead; the player respawns at this time. */
  respawnAt: number | null;
  nextRegenAt: number;
  potionReadyAt: number;
  /** skillId -> time the skill becomes available again. */
  skillReadyAt: Record<string, number>;
}

export interface SimulationStatistics {
  kills: number;
  deaths: number;
  experienceGained: number;
  zenyGained: number;
  levelsGained: number;
  damageDealt: number;
  damageTaken: number;
  attacks: number;
  misses: number;
  criticals: number;
  skillsCast: Record<string, number>;
  potionsUsed: Record<string, number>;
  itemsLooted: Record<string, number>;
  itemsDiscarded: Record<string, number>;
}

/** Complete, serializable state of one character's combat simulation. */
export interface CombatState {
  /** Simulation time (epoch ms) up to which events have been processed. */
  time: number;
  rngState: number;
  mapId: string;
  character: CharacterState;
  player: PlayerCombatState;
  monster: MonsterInstance | null;
  /** When the next monster appears; null while a monster is present or the player is dead. */
  nextSpawnAt: number | null;
  spawnCounter: number;
  statistics: SimulationStatistics;
}

export function emptyStatistics(): SimulationStatistics {
  return {
    kills: 0,
    deaths: 0,
    experienceGained: 0,
    zenyGained: 0,
    levelsGained: 0,
    damageDealt: 0,
    damageTaken: 0,
    attacks: 0,
    misses: 0,
    criticals: 0,
    skillsCast: {},
    potionsUsed: {},
    itemsLooted: {},
    itemsDiscarded: {},
  };
}

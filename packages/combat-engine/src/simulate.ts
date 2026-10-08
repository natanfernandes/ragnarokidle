import type { CharacterState, CombatConfig, CombatEvent } from '@ragidle/shared';
import { type GameData, gameData } from '@ragidle/game-data';
import { advanceCombat, createCombatState } from './engine';
import type { CombatState, SimulationStatistics } from './state';

export interface SimulationInput {
  character: CharacterState;
  config?: CombatConfig;
  mapId?: string;
  /** Epoch ms; defaults to the character's lastSimulationAt. */
  startAt?: number;
  durationMs: number;
  seed?: number;
  recordEvents?: boolean;
  data?: GameData;
}

export interface RewardSummary {
  experience: number;
  zeny: number;
  levels: number;
  items: Record<string, number>;
}

export interface SimulationResult {
  finalState: CombatState;
  events: CombatEvent[];
  rewards: RewardSummary;
  statistics: SimulationStatistics;
}

/** Runs a self-contained simulation from scratch for `durationMs`. */
export function simulateCombat(input: SimulationInput): SimulationResult {
  const data = input.data ?? gameData;
  const character = input.config
    ? { ...input.character, combatConfig: input.config }
    : input.character;
  const startAt = input.startAt ?? character.lastSimulationAt;
  const initial = createCombatState(
    { character, mapId: input.mapId, startAt, seed: input.seed ?? 1 },
    data,
  );
  const { state, events } = advanceCombat(initial, startAt + input.durationMs, {
    recordEvents: input.recordEvents,
    data,
  });
  return {
    finalState: state,
    events,
    rewards: summarizeRewards(state.statistics),
    statistics: state.statistics,
  };
}

export function summarizeRewards(statistics: SimulationStatistics): RewardSummary {
  return {
    experience: statistics.experienceGained,
    zeny: statistics.zenyGained,
    levels: statistics.levelsGained,
    items: { ...statistics.itemsLooted },
  };
}

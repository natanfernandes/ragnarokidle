import { randomInt } from 'node:crypto';
import {
  type CombatState,
  type SimulationStatistics,
  advanceCombat,
  createCombatState,
  deriveStats,
  nextScheduledAt,
  resumeCombat,
  withCombatConfig,
} from '@ragidle/combat-engine';
import { gameData } from '@ragidle/game-data';
import type { CombatSnapshot, OfflineRewards, ServerMessage } from '@ragidle/protocol';
import type { CharacterState, CombatConfig, CombatEvent, DerivedStats } from '@ragidle/shared';
import type { CharacterRepository, StoredCharacter } from '../characters/character-repository';
import { SaveScheduler } from './save-scheduler';

/**
 * Gaps shorter than this (a reload, a network blip) are simulated and streamed
 * as live events for everyone; longer ones are offline time.
 */
export const OFFLINE_THRESHOLD_MS = 10_000;

export type SessionListener = (message: ServerMessage) => void;

export class GameRuleError extends Error {
  constructor(
    readonly code: 'invalid_state' | 'invalid_config' | 'unknown_map',
    message: string,
  ) {
    super(message);
  }
}

/** Routine progress is saved at most this often; see SaveScheduler. */
export const SAVE_INTERVAL_MS = 5_000;

export interface CombatSessionDeps {
  repository: CharacterRepository;
  clock: () => number;
  maxOfflineMs: number;
  seed?: () => number;
  saveIntervalMs?: number;
  onSaveError?: (error: unknown) => void;
}

/**
 * Owns the authoritative combat of one character. The simulation is advanced
 * lazily: a single timer fires at the next scheduled action while someone is
 * watching, and on reconnect the elapsed time is simulated in one go.
 */
export class CombatSession {
  private character: CharacterState;
  private combat: CombatState | null;
  private timer: NodeJS.Timeout | null = null;
  private readonly listeners = new Set<SessionListener>();
  private readonly saves: SaveScheduler;

  constructor(
    stored: StoredCharacter,
    private readonly deps: CombatSessionDeps,
  ) {
    this.character = stored.character;
    this.combat = stored.combat;
    this.saves = new SaveScheduler(
      () => deps.repository.save(this.stored()),
      deps.saveIntervalMs ?? SAVE_INTERVAL_MS,
      deps.onSaveError ?? (() => {}),
    );
  }

  get active(): boolean {
    return this.combat !== null;
  }

  /** Registers a listener and settles any time that passed while nobody watched. */
  /**
   * Registers a listener and settles any time that passed while nobody watched:
   * with `offlineProgress` (VIP) that time is simulated and rewarded; without
   * it the fight was paused and simply continues.
   */
  attach(listener: SessionListener, options: { offlineProgress: boolean }): OfflineRewards | null {
    const rewards = this.catchUp(options.offlineProgress);
    this.listeners.add(listener);
    this.schedule();
    return rewards;
  }

  detach(listener: SessionListener): void {
    this.listeners.delete(listener);
    if (this.listeners.size === 0) {
      // Settle everything up to now; whether the time away counts is decided on return.
      this.tick();
      this.clearTimer();
      void this.saves.flush();
    }
  }

  start(mapId: string): void {
    if (!gameData.maps[mapId]) throw new GameRuleError('unknown_map', `Unknown map: ${mapId}`);
    if (this.combat) throw new GameRuleError('invalid_state', 'Combat is already running');
    this.combat = createCombatState({
      character: this.character,
      mapId,
      startAt: this.deps.clock(),
      seed: this.deps.seed?.() ?? randomInt(2 ** 31),
    });
    this.persist({ immediate: true });
    this.tick();
  }

  stop(): void {
    if (!this.combat) throw new GameRuleError('invalid_state', 'Combat is not running');
    this.tick();
    this.clearTimer();
    this.combat = null;
    this.persist({ immediate: true });
  }

  updateConfig(config: CombatConfig): void {
    validateConfig(config);
    if (this.combat) {
      this.tick();
      this.combat = withCombatConfig(this.combat, config);
    } else {
      this.character = { ...this.character, combatConfig: structuredClone(config) };
    }
    this.persist({ immediate: true });
  }

  snapshot(): { character: CharacterState; derived: DerivedStats; combat: CombatSnapshot } {
    const character = this.currentCharacter();
    const monster = this.combat?.monster;
    const player = this.combat?.player;
    return {
      character: structuredClone(character),
      derived: deriveStats(character),
      combat: {
        active: this.active,
        mapId: this.combat?.mapId ?? null,
        player: player
          ? { position: { ...player.position }, movement: structuredClone(player.movement) }
          : null,
        monster: monster
          ? {
              instanceId: monster.instanceId,
              monsterId: monster.monsterId,
              hp: monster.hp,
              maxHp: monster.maxHp,
              placement: {
                position: { ...monster.position },
                movement: structuredClone(monster.movement),
              },
            }
          : null,
        respawnAt: this.combat?.player.respawnAt ?? null,
      },
    };
  }

  /** Stops the session and resolves once its state is saved. */
  dispose(): Promise<void> {
    this.clearTimer();
    this.listeners.clear();
    return this.saves.flush();
  }

  private currentCharacter(): CharacterState {
    return this.combat?.character ?? this.character;
  }

  /** Advances the simulation to now and broadcasts the resulting events. */
  private tick(): void {
    if (!this.combat) return;
    const now = this.deps.clock();
    const { state, events } = advanceCombat(this.combat, now);
    this.combat = state;
    this.persist();
    this.broadcastEvents(now, events);
    this.schedule();
  }

  private catchUp(offlineProgress: boolean): OfflineRewards | null {
    if (!this.combat) return null;
    const now = this.deps.clock();
    const elapsedMs = now - this.combat.time;
    if (elapsedMs < OFFLINE_THRESHOLD_MS) return null;

    if (!offlineProgress) {
      this.combat = resumeCombat(this.combat, now);
      this.persist({ immediate: true });
      return null;
    }

    const simulatedMs = Math.min(elapsedMs, this.deps.maxOfflineMs);
    const before = this.combat.statistics;
    const { state } = advanceCombat(this.combat, this.combat.time + simulatedMs, {
      recordEvents: false,
    });
    const rewards = offlineRewards(before, state.statistics, simulatedMs, elapsedMs);

    // Time beyond the cap is skipped: resume a fresh fight from now.
    this.combat =
      simulatedMs < elapsedMs
        ? createCombatState({
            character: state.character,
            mapId: state.mapId,
            startAt: now,
            seed: state.rngState,
          })
        : state;
    this.persist({ immediate: true });
    return rewards;
  }

  private schedule(): void {
    this.clearTimer();
    if (!this.combat || this.listeners.size === 0) return;
    const next = nextScheduledAt(this.combat);
    if (next === null) return;
    const delay = Math.max(0, next - this.deps.clock());
    this.timer = setTimeout(() => this.tick(), delay);
  }

  private clearTimer(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  private broadcastEvents(serverTime: number, events: CombatEvent[]): void {
    if (events.length === 0) return;
    const message: ServerMessage = { type: 'combat.events', serverTime, events };
    for (const listener of this.listeners) listener(message);
  }

  private persist(options?: { immediate?: boolean }): void {
    this.character = this.currentCharacter();
    this.saves.request(options);
  }

  private stored(): StoredCharacter {
    return structuredClone({ character: this.currentCharacter(), combat: this.combat });
  }
}

function validateConfig(config: CombatConfig): void {
  for (const skill of config.skills) {
    if (!gameData.skills[skill.skillId]) {
      throw new GameRuleError('invalid_config', `Unknown skill: ${skill.skillId}`);
    }
  }
  for (const rule of [config.potions.hp, config.potions.sp]) {
    if (!gameData.items[rule.itemId]?.effect) {
      throw new GameRuleError('invalid_config', `Not a usable potion: ${rule.itemId}`);
    }
  }
  for (const itemId of [...config.loot.alwaysPickup, ...config.loot.ignore]) {
    if (!gameData.items[itemId])
      throw new GameRuleError('invalid_config', `Unknown item: ${itemId}`);
  }
}

function offlineRewards(
  before: SimulationStatistics,
  after: SimulationStatistics,
  simulatedMs: number,
  elapsedMs: number,
): OfflineRewards {
  const items: Record<string, number> = {};
  for (const [id, qty] of Object.entries(after.itemsLooted)) {
    const gained = qty - (before.itemsLooted[id] ?? 0);
    if (gained > 0) items[id] = gained;
  }
  return {
    simulatedMs,
    elapsedMs,
    experience: after.experienceGained - before.experienceGained,
    zeny: after.zenyGained - before.zenyGained,
    levels: after.levelsGained - before.levelsGained,
    kills: after.kills - before.kills,
    deaths: after.deaths - before.deaths,
    items,
  };
}

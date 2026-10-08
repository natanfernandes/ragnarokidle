import type {
  CharacterState,
  CombatConfig,
  CombatEvent,
  DerivedStats,
  MonsterDefinition,
  PotionRule,
  SkillDefinition,
  SkillStrategy,
} from '@ragidle/shared';
import { PLAYER_ACTOR_ID, percent } from '@ragidle/shared';
import { type GameData, experienceToNextLevel, gameData } from '@ragidle/game-data';
import { DAMAGE_VARIANCE, critChance, deriveStats, hitChance, physicalDamage } from './formulas';
import { SeededRng } from './rng';
import { type CombatState, emptyStatistics } from './state';

export const RESPAWN_DELAY_MS = 5_000;
export const REGEN_INTERVAL_MS = 6_000;
export const POTION_COOLDOWN_MS = 500;
/** Time for the player to close in on a freshly spawned monster. */
export const ENGAGE_DELAY_MS = 500;
/** Hard cap on processed actions per advance call, to protect the server. */
export const MAX_ACTIONS_PER_ADVANCE = 2_000_000;

export interface CreateCombatStateInput {
  character: CharacterState;
  mapId?: string;
  /** Epoch ms at which combat starts. */
  startAt: number;
  seed: number;
}

export function createCombatState(
  input: CreateCombatStateInput,
  data: GameData = gameData,
): CombatState {
  const mapId = input.mapId ?? input.character.currentMapId;
  if (!data.maps[mapId]) throw new Error(`Unknown map: ${mapId}`);
  const character = structuredClone(input.character);
  character.currentMapId = mapId;
  character.lastSimulationAt = input.startAt;

  const derived = deriveStats(character, data);
  character.hp = Math.min(character.hp, derived.maxHp);
  character.sp = Math.min(character.sp, derived.maxSp);
  const dead = character.hp <= 0;

  return {
    time: input.startAt,
    rngState: input.seed >>> 0,
    mapId,
    character,
    player: {
      nextActionAt: input.startAt,
      respawnAt: dead ? input.startAt + RESPAWN_DELAY_MS : null,
      nextRegenAt: input.startAt + REGEN_INTERVAL_MS,
      potionReadyAt: input.startAt,
      skillReadyAt: {},
    },
    monster: null,
    nextSpawnAt: dead ? null : input.startAt,
    spawnCounter: 0,
    statistics: emptyStatistics(),
  };
}

export interface AdvanceOptions {
  /** When false, events are not collected (useful for long offline simulations). */
  recordEvents?: boolean;
  data?: GameData;
}

export interface AdvanceResult {
  state: CombatState;
  events: CombatEvent[];
}

/**
 * Processes every scheduled action with a timestamp <= `until` and returns the
 * new state plus the events produced. Pure: the input state is not mutated.
 */
export function advanceCombat(
  state: CombatState,
  until: number,
  options: AdvanceOptions = {},
): AdvanceResult {
  const sim = new Simulation(
    structuredClone(state),
    options.data ?? gameData,
    options.recordEvents ?? true,
  );
  sim.runUntil(until);
  return { state: sim.state, events: sim.events };
}

/** The earliest time at which something will happen, or null if nothing is scheduled. */
export function nextScheduledAt(state: CombatState): number | null {
  const times = scheduledActions(state).map((a) => a.at);
  return times.length === 0 ? null : Math.min(...times);
}

/** Returns a copy of the state using a new combat configuration. */
export function withCombatConfig(state: CombatState, config: CombatConfig): CombatState {
  const next = structuredClone(state);
  next.character.combatConfig = structuredClone(config);
  return next;
}

type ActionKind = 'respawn' | 'spawn' | 'regen' | 'player' | 'monster';

/** Order matters: it breaks ties between actions scheduled at the same instant. */
function scheduledActions(state: CombatState): { kind: ActionKind; at: number }[] {
  const actions: { kind: ActionKind; at: number }[] = [];
  const { player, monster } = state;
  if (player.respawnAt !== null) {
    actions.push({ kind: 'respawn', at: player.respawnAt });
    return actions;
  }
  if (state.nextSpawnAt !== null) actions.push({ kind: 'spawn', at: state.nextSpawnAt });
  actions.push({ kind: 'regen', at: player.nextRegenAt });
  if (monster) {
    actions.push({ kind: 'player', at: player.nextActionAt });
    actions.push({ kind: 'monster', at: monster.nextActionAt });
  }
  return actions;
}

class Simulation {
  readonly events: CombatEvent[] = [];
  private readonly rng: SeededRng;
  private derived: DerivedStats;

  constructor(
    readonly state: CombatState,
    private readonly data: GameData,
    private readonly recordEvents: boolean,
  ) {
    this.rng = new SeededRng(state.rngState);
    this.derived = deriveStats(state.character, data);
  }

  runUntil(until: number): void {
    for (let i = 0; i < MAX_ACTIONS_PER_ADVANCE; i++) {
      const next = this.nextAction();
      if (!next || next.at > until) break;
      this.state.time = Math.max(this.state.time, next.at);
      this.perform(next.kind, next.at);
    }
    this.state.time = Math.max(this.state.time, until);
    this.state.character.lastSimulationAt = this.state.time;
    this.state.rngState = this.rng.state;
  }

  private nextAction(): { kind: ActionKind; at: number } | null {
    let best: { kind: ActionKind; at: number } | null = null;
    for (const action of scheduledActions(this.state)) {
      if (!best || action.at < best.at) best = action;
    }
    return best;
  }

  private perform(kind: ActionKind, at: number): void {
    switch (kind) {
      case 'respawn':
        return this.respawnPlayer(at);
      case 'spawn':
        return this.spawnMonster(at);
      case 'regen':
        return this.regen(at);
      case 'player':
        return this.playerAction(at);
      case 'monster':
        return this.monsterAction(at);
    }
  }

  private emit(event: CombatEvent): void {
    if (this.recordEvents) this.events.push(event);
  }

  private get character(): CharacterState {
    return this.state.character;
  }

  // --- Scheduling actions -------------------------------------------------

  private spawnMonster(at: number): void {
    const map = this.data.maps[this.state.mapId];
    if (!map) throw new Error(`Unknown map: ${this.state.mapId}`);
    const def = this.monsterDefinition(this.rng.pickWeighted(map.monsters).monsterId);

    this.state.spawnCounter += 1;
    this.state.monster = {
      instanceId: `${def.id}#${this.state.spawnCounter}`,
      monsterId: def.id,
      hp: def.hp,
      maxHp: def.hp,
      // Monsters react quicker than a full swing on first contact.
      nextActionAt: at + Math.round(def.attackIntervalMs / 2),
    };
    this.state.nextSpawnAt = null;
    this.state.player.nextActionAt = Math.max(this.state.player.nextActionAt, at + ENGAGE_DELAY_MS);
    this.emit({
      type: 'monster_spawn',
      timestamp: at,
      monsterInstanceId: this.state.monster.instanceId,
      monsterId: def.id,
      hp: def.hp,
      maxHp: def.hp,
    });
  }

  private respawnPlayer(at: number): void {
    this.character.hp = this.derived.maxHp;
    this.character.sp = this.derived.maxSp;
    this.state.player.respawnAt = null;
    this.state.player.nextActionAt = at;
    this.state.player.nextRegenAt = at + REGEN_INTERVAL_MS;
    this.scheduleNextSpawn(at);
    this.emit({
      type: 'player_respawn',
      timestamp: at,
      hp: this.character.hp,
      sp: this.character.sp,
    });
  }

  private regen(at: number): void {
    this.state.player.nextRegenAt = at + REGEN_INTERVAL_MS;
    const { maxHp, maxSp } = this.derived;
    const { vit, int } = this.character.baseStats;
    const hpBefore = this.character.hp;
    const spBefore = this.character.sp;
    this.character.hp = Math.min(maxHp, hpBefore + Math.max(1, Math.floor(maxHp / 50 + vit / 5)));
    this.character.sp = Math.min(maxSp, spBefore + Math.max(1, Math.floor(maxSp / 30 + int / 6)));
    if (this.character.hp !== hpBefore || this.character.sp !== spBefore) {
      this.emit({ type: 'regen', timestamp: at, hp: this.character.hp, sp: this.character.sp });
    }
  }

  // --- Player -------------------------------------------------------------

  private playerAction(at: number): void {
    const monster = this.state.monster;
    if (!monster) return;
    this.tryPotions(at);

    const skill = this.chooseSkill(at);
    let multiplier = 1;
    let flatBonus = 0;
    let hitBonus = 0;
    if (skill) {
      this.character.sp -= skill.spCost;
      this.state.player.skillReadyAt[skill.id] = at + skill.cooldownMs;
      this.state.statistics.skillsCast[skill.id] =
        (this.state.statistics.skillsCast[skill.id] ?? 0) + 1;
      multiplier = skill.damage.multiplier;
      hitBonus = skill.damage.hitBonus ?? 0;
      for (const [stat, perPoint] of Object.entries(skill.damage.statScaling)) {
        flatBonus +=
          (this.character.baseStats[stat as keyof typeof this.character.baseStats] ?? 0) *
          (perPoint ?? 0);
      }
      this.emit({
        type: 'skill_cast',
        timestamp: at,
        attackerId: PLAYER_ACTOR_ID,
        targetId: monster.instanceId,
        skillId: skill.id,
        spCost: skill.spCost,
        sp: this.character.sp,
      });
    } else {
      this.emit({
        type: 'attack',
        timestamp: at,
        attackerId: PLAYER_ACTOR_ID,
        targetId: monster.instanceId,
      });
    }
    this.state.statistics.attacks += 1;
    this.state.player.nextActionAt = at + this.derived.attackIntervalMs;

    const def = this.monsterDefinition(monster.monsterId);
    // Skills never crit (as in RO); basic attacks may, and criticals always hit.
    const critical = !skill && this.rng.chance(critChance(this.derived.crit));
    if (!critical && !this.rng.chance(hitChance(this.derived.hit + hitBonus, def.flee))) {
      this.state.statistics.misses += 1;
      this.emit({
        type: 'miss',
        timestamp: at,
        attackerId: PLAYER_ACTOR_ID,
        targetId: monster.instanceId,
        ...(skill ? { skillId: skill.id } : {}),
      });
      return;
    }

    const amount = physicalDamage({
      attack: this.derived.atk,
      multiplier,
      flatBonus,
      defense: def.defense,
      roll: this.rng.range(1 - DAMAGE_VARIANCE, 1 + DAMAGE_VARIANCE),
      critical,
    });
    monster.hp = Math.max(0, monster.hp - amount);
    if (critical) this.state.statistics.criticals += 1;
    this.state.statistics.damageDealt += amount;
    this.emit({
      type: 'damage',
      timestamp: at,
      attackerId: PLAYER_ACTOR_ID,
      targetId: monster.instanceId,
      amount,
      damageType: 'physical',
      critical,
      targetHp: monster.hp,
      ...(skill ? { skillId: skill.id } : {}),
    });

    if (monster.hp <= 0) this.killMonster(at, def);
  }

  private chooseSkill(at: number): SkillDefinition | null {
    const cls = this.data.classes[this.character.classId];
    const strategies = [...this.character.combatConfig.skills]
      .filter((s) => s.enabled && cls?.skills.includes(s.skillId))
      .sort((a, b) => a.priority - b.priority);

    for (const strategy of strategies) {
      const skill = this.data.skills[strategy.skillId];
      if (!skill) continue;
      if (this.character.sp < skill.spCost) continue;
      if ((this.state.player.skillReadyAt[skill.id] ?? -Infinity) > at) continue;
      if (!this.conditionsMet(strategy)) continue;
      return skill;
    }
    return null;
  }

  private conditionsMet(strategy: SkillStrategy): boolean {
    const c = strategy.conditions;
    if (!c) return true;
    const hpPct = percent(this.character.hp, this.derived.maxHp);
    const spPct = percent(this.character.sp, this.derived.maxSp);
    if (c.minHpPercent !== undefined && hpPct < c.minHpPercent) return false;
    if (c.maxHpPercent !== undefined && hpPct > c.maxHpPercent) return false;
    if (c.minSpPercent !== undefined && spPct < c.minSpPercent) return false;
    // Only single encounters exist for now, so there is always exactly one target.
    if (c.minTargets !== undefined && 1 < c.minTargets) return false;
    return true;
  }

  private tryPotions(at: number): void {
    if (this.state.player.potionReadyAt > at) return;
    const { hp, sp } = this.character.combatConfig.potions;
    const used =
      this.tryPotion(at, hp, percent(this.character.hp, this.derived.maxHp)) ||
      this.tryPotion(at, sp, percent(this.character.sp, this.derived.maxSp));
    if (used) this.state.player.potionReadyAt = at + POTION_COOLDOWN_MS;
  }

  private tryPotion(at: number, rule: PotionRule, currentPercent: number): boolean {
    if (!rule.enabled || currentPercent >= rule.belowPercent) return false;
    const quantity = this.character.inventory[rule.itemId] ?? 0;
    const effect = this.data.items[rule.itemId]?.effect;
    if (quantity <= 0 || !effect) return false;

    const hpBefore = this.character.hp;
    const spBefore = this.character.sp;
    this.character.hp = Math.min(this.derived.maxHp, hpBefore + (effect.restoreHp ?? 0));
    this.character.sp = Math.min(this.derived.maxSp, spBefore + (effect.restoreSp ?? 0));
    this.removeItem(rule.itemId, 1);
    const stats = this.state.statistics;
    stats.potionsUsed[rule.itemId] = (stats.potionsUsed[rule.itemId] ?? 0) + 1;
    this.emit({
      type: 'potion_used',
      timestamp: at,
      itemId: rule.itemId,
      restoredHp: this.character.hp - hpBefore,
      restoredSp: this.character.sp - spBefore,
      hp: this.character.hp,
      sp: this.character.sp,
      remaining: this.character.inventory[rule.itemId] ?? 0,
    });
    return true;
  }

  // --- Monster ------------------------------------------------------------

  private monsterAction(at: number): void {
    const monster = this.state.monster;
    if (!monster) return;
    const def = this.monsterDefinition(monster.monsterId);
    monster.nextActionAt = at + def.attackIntervalMs;
    this.emit({
      type: 'attack',
      timestamp: at,
      attackerId: monster.instanceId,
      targetId: PLAYER_ACTOR_ID,
    });

    if (!this.rng.chance(hitChance(def.hit, this.derived.flee))) {
      this.emit({
        type: 'miss',
        timestamp: at,
        attackerId: monster.instanceId,
        targetId: PLAYER_ACTOR_ID,
      });
      return;
    }
    const amount = physicalDamage({
      attack: def.attack,
      multiplier: 1,
      flatBonus: 0,
      defense: this.derived.def,
      roll: this.rng.range(1 - DAMAGE_VARIANCE, 1 + DAMAGE_VARIANCE),
      critical: false,
    });
    this.character.hp = Math.max(0, this.character.hp - amount);
    this.state.statistics.damageTaken += amount;
    this.emit({
      type: 'damage',
      timestamp: at,
      attackerId: monster.instanceId,
      targetId: PLAYER_ACTOR_ID,
      amount,
      damageType: 'physical',
      critical: false,
      targetHp: this.character.hp,
    });

    if (this.character.hp <= 0) {
      this.killPlayer(at, monster.instanceId);
    } else {
      this.tryPotions(at);
    }
  }

  private killPlayer(at: number, killedBy: string): void {
    const respawnAt = at + RESPAWN_DELAY_MS;
    this.state.statistics.deaths += 1;
    this.state.player.respawnAt = respawnAt;
    this.state.monster = null;
    this.state.nextSpawnAt = null;
    this.emit({ type: 'player_death', timestamp: at, killedBy, respawnAt });
  }

  // --- Rewards ------------------------------------------------------------

  private killMonster(at: number, def: MonsterDefinition): void {
    const monster = this.state.monster;
    if (!monster) return;
    const stats = this.state.statistics;
    stats.kills += 1;
    this.state.monster = null;
    this.emit({
      type: 'monster_death',
      timestamp: at,
      monsterInstanceId: monster.instanceId,
      monsterId: def.id,
    });

    this.grantExperience(at, def.experience);

    const zeny = this.rng.int(def.zeny.min, def.zeny.max);
    this.character.zeny += zeny;
    stats.zenyGained += zeny;
    this.emit({ type: 'zeny', timestamp: at, amount: zeny, total: this.character.zeny });

    for (const drop of def.drops) {
      if (!this.rng.chance(drop.chance)) continue;
      const quantity = this.rng.int(drop.minQuantity, drop.maxQuantity);
      const pickedUp = this.shouldPickUp(drop.itemId);
      if (pickedUp) {
        this.character.inventory[drop.itemId] =
          (this.character.inventory[drop.itemId] ?? 0) + quantity;
        stats.itemsLooted[drop.itemId] = (stats.itemsLooted[drop.itemId] ?? 0) + quantity;
      } else {
        stats.itemsDiscarded[drop.itemId] = (stats.itemsDiscarded[drop.itemId] ?? 0) + quantity;
      }
      this.emit({ type: 'loot', timestamp: at, itemId: drop.itemId, quantity, pickedUp });
    }

    this.scheduleNextSpawn(at);
  }

  private grantExperience(at: number, amount: number): void {
    const stats = this.state.statistics;
    this.character.experience += amount;
    stats.experienceGained += amount;

    const levelUps: CombatEvent[] = [];
    let toNext = experienceToNextLevel(this.character.level);
    while (this.character.experience >= toNext) {
      this.character.experience -= toNext;
      this.character.level += 1;
      stats.levelsGained += 1;
      this.derived = deriveStats(this.character, this.data);
      this.character.hp = this.derived.maxHp;
      this.character.sp = this.derived.maxSp;
      levelUps.push({
        type: 'level_up',
        timestamp: at,
        level: this.character.level,
        maxHp: this.derived.maxHp,
        maxSp: this.derived.maxSp,
      });
      toNext = experienceToNextLevel(this.character.level);
    }
    this.emit({
      type: 'experience',
      timestamp: at,
      amount,
      experience: this.character.experience,
      experienceToNext: toNext,
    });
    levelUps.forEach((event) => this.emit(event));
  }

  private shouldPickUp(itemId: string): boolean {
    const loot = this.character.combatConfig.loot;
    if (loot.ignore.includes(itemId)) return false;
    if (loot.alwaysPickup.includes(itemId)) return true;
    const category = this.data.items[itemId]?.category;
    return category !== undefined && loot.pickupCategories.includes(category);
  }

  // --- Helpers ------------------------------------------------------------

  private scheduleNextSpawn(at: number): void {
    const map = this.data.maps[this.state.mapId];
    if (!map) throw new Error(`Unknown map: ${this.state.mapId}`);
    this.state.nextSpawnAt =
      at + this.rng.int(map.encounterIntervalMs.min, map.encounterIntervalMs.max);
  }

  private removeItem(itemId: string, quantity: number): void {
    const remaining = (this.character.inventory[itemId] ?? 0) - quantity;
    if (remaining > 0) this.character.inventory[itemId] = remaining;
    else delete this.character.inventory[itemId];
  }

  private monsterDefinition(id: string): MonsterDefinition {
    const def = this.data.monsters[id];
    if (!def) throw new Error(`Unknown monster: ${id}`);
    return def;
  }
}

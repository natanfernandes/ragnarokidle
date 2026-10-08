/**
 * Discrete combat events produced by the authoritative simulation.
 * `timestamp` is simulation time in epoch milliseconds.
 */

import type { GridPosition } from './position';

export const PLAYER_ACTOR_ID = 'player';

interface BaseEvent {
  timestamp: number;
}

export interface MonsterSpawnEvent extends BaseEvent {
  type: 'monster_spawn';
  monsterInstanceId: string;
  monsterId: string;
  hp: number;
  maxHp: number;
  position: GridPosition;
}

/** An actor starts walking in a straight line; `timestamp` is when it sets off. */
export interface MoveEvent extends BaseEvent {
  type: 'move';
  actorId: string;
  from: GridPosition;
  to: GridPosition;
  arriveAt: number;
}

export interface AttackEvent extends BaseEvent {
  type: 'attack';
  attackerId: string;
  targetId: string;
}

export interface SkillCastEvent extends BaseEvent {
  type: 'skill_cast';
  attackerId: string;
  targetId: string;
  skillId: string;
  spCost: number;
  sp: number;
}

export interface DamageEvent extends BaseEvent {
  type: 'damage';
  attackerId: string;
  targetId: string;
  amount: number;
  damageType: 'physical' | 'magical' | 'true';
  critical: boolean;
  skillId?: string;
  /** Target HP after the damage is applied. */
  targetHp: number;
}

export interface MissEvent extends BaseEvent {
  type: 'miss';
  attackerId: string;
  targetId: string;
  skillId?: string;
}

export interface PotionUsedEvent extends BaseEvent {
  type: 'potion_used';
  itemId: string;
  restoredHp: number;
  restoredSp: number;
  hp: number;
  sp: number;
  remaining: number;
}

export interface RegenEvent extends BaseEvent {
  type: 'regen';
  hp: number;
  sp: number;
}

export interface MonsterDeathEvent extends BaseEvent {
  type: 'monster_death';
  monsterInstanceId: string;
  monsterId: string;
}

export interface PlayerDeathEvent extends BaseEvent {
  type: 'player_death';
  killedBy: string;
  respawnAt: number;
}

export interface PlayerRespawnEvent extends BaseEvent {
  type: 'player_respawn';
  hp: number;
  sp: number;
  position: GridPosition;
}

export interface LootEvent extends BaseEvent {
  type: 'loot';
  itemId: string;
  quantity: number;
  /** False when the loot filter discarded the drop. */
  pickedUp: boolean;
}

export interface ExperienceEvent extends BaseEvent {
  type: 'experience';
  amount: number;
  experience: number;
  experienceToNext: number;
}

export interface ZenyEvent extends BaseEvent {
  type: 'zeny';
  amount: number;
  total: number;
}

export interface LevelUpEvent extends BaseEvent {
  type: 'level_up';
  level: number;
  maxHp: number;
  maxSp: number;
}

export type CombatEvent =
  | MonsterSpawnEvent
  | MoveEvent
  | AttackEvent
  | SkillCastEvent
  | DamageEvent
  | MissEvent
  | PotionUsedEvent
  | RegenEvent
  | MonsterDeathEvent
  | PlayerDeathEvent
  | PlayerRespawnEvent
  | LootEvent
  | ExperienceEvent
  | ZenyEvent
  | LevelUpEvent;

export type CombatEventType = CombatEvent['type'];

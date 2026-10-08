import { create } from 'zustand';
import type { CombatSnapshot, OfflineRewards, ServerMessage } from '@ragidle/protocol';
import type { CharacterState, CombatEvent, DerivedStats } from '@ragidle/shared';
import { PLAYER_ACTOR_ID } from '@ragidle/shared';
import type { ConnectionStatus } from '../net/game-client';
import { type LogKind, describeEvent } from '../presentation/describe-event';

/**
 * Presentation state only. Everything here is either copied from an
 * authoritative server snapshot or replayed from authoritative events.
 */

export type AnimationKind = 'idle' | 'attack' | 'skill' | 'hit' | 'dying' | 'dead' | 'spawn';

export interface ActorAnimation {
  kind: AnimationKind;
  /** Changes on every new animation so CSS animations restart. */
  key: number;
}

export interface PresentedMonster {
  instanceId: string;
  monsterId: string;
  hp: number;
  maxHp: number;
  dying: boolean;
}

export type FloatingKind = 'damage' | 'critical' | 'miss' | 'heal' | 'skill' | 'reward';

export interface FloatingText {
  id: number;
  target: 'player' | 'monster';
  text: string;
  kind: FloatingKind;
}

export interface LogEntry {
  id: number;
  timestamp: number;
  text: string;
  kind: LogKind;
}

const MAX_LOG_ENTRIES = 150;
const MAX_FLOATING = 12;

interface GameState {
  status: ConnectionStatus;
  characterId: string | null;
  character: CharacterState | null;
  derived: DerivedStats | null;
  combat: CombatSnapshot | null;
  monster: PresentedMonster | null;
  playerAnimation: ActorAnimation;
  monsterAnimation: ActorAnimation;
  playerDead: boolean;
  floating: FloatingText[];
  log: LogEntry[];
  offlineRewards: OfflineRewards | null;
  lastError: string | null;

  setStatus(status: ConnectionStatus): void;
  applyServerMessage(message: ServerMessage, coveredEvents?: CombatEvent[]): void;
  playEvent(event: CombatEvent, animate: boolean): void;
  removeFloating(id: number): void;
  dismissOfflineRewards(): void;
}

let nextId = 1;
const animation = (kind: AnimationKind): ActorAnimation => ({ kind, key: nextId++ });

export const useGameStore = create<GameState>()((set, get) => ({
  status: 'disconnected',
  characterId: null,
  character: null,
  derived: null,
  combat: null,
  monster: null,
  playerAnimation: animation('idle'),
  monsterAnimation: animation('idle'),
  playerDead: false,
  floating: [],
  log: [],
  offlineRewards: null,
  lastError: null,

  setStatus: (status) => set({ status }),

  applyServerMessage: (message, coveredEvents = []) => {
    switch (message.type) {
      case 'authenticated':
        set({ characterId: message.characterId, lastError: null });
        return;
      case 'state.snapshot': {
        const monster = message.combat.monster;
        set((s) => ({
          character: message.character,
          derived: message.derived,
          combat: message.combat,
          playerDead: message.combat.respawnAt !== null,
          monster: monster ? { ...monster, dying: false } : s.monster?.dying ? s.monster : null,
          log: appendLog(s.log, coveredEvents),
        }));
        return;
      }
      case 'offline.rewards':
        set({ offlineRewards: message.rewards });
        return;
      case 'error':
        set({ lastError: message.message });
        return;
      case 'combat.events':
        // Routed through the presentation scheduler, see game.ts.
        return;
    }
  },

  playEvent: (event, animate) => {
    const s = get();
    const character = s.character && { ...s.character };
    const derived = s.derived && { ...s.derived };
    let { monster, playerAnimation, monsterAnimation, playerDead } = s;
    const floating: FloatingText[] = [];
    const isPlayer = (id: string) => id === PLAYER_ACTOR_ID;
    const float = (target: FloatingText['target'], text: string, kind: FloatingKind) =>
      animate && floating.push({ id: nextId++, target, text, kind });

    switch (event.type) {
      case 'monster_spawn':
        monster = {
          instanceId: event.monsterInstanceId,
          monsterId: event.monsterId,
          hp: event.hp,
          maxHp: event.maxHp,
          dying: false,
        };
        monsterAnimation = animation('spawn');
        break;
      case 'attack':
        if (isPlayer(event.attackerId)) playerAnimation = animation('attack');
        else monsterAnimation = animation('attack');
        break;
      case 'skill_cast':
        playerAnimation = animation('skill');
        if (character) character.sp = event.sp;
        float('player', event.skillId === 'bash' ? 'Bash!' : event.skillId, 'skill');
        break;
      case 'damage':
        if (isPlayer(event.targetId)) {
          if (character) character.hp = event.targetHp;
          playerAnimation = animation('hit');
          float('player', String(event.amount), 'damage');
        } else {
          if (monster) monster = { ...monster, hp: event.targetHp };
          monsterAnimation = animation('hit');
          float('monster', String(event.amount), event.critical ? 'critical' : 'damage');
        }
        break;
      case 'miss':
        float(isPlayer(event.targetId) ? 'player' : 'monster', 'Miss', 'miss');
        break;
      case 'potion_used':
        if (character) {
          character.hp = event.hp;
          character.sp = event.sp;
          character.inventory = withQuantity(character.inventory, event.itemId, event.remaining);
        }
        float('player', `+${event.restoredHp || event.restoredSp}`, 'heal');
        break;
      case 'regen':
        if (character) {
          character.hp = event.hp;
          character.sp = event.sp;
        }
        break;
      case 'monster_death':
        if (monster) monster = { ...monster, hp: 0, dying: true };
        monsterAnimation = animation('dying');
        break;
      case 'player_death':
        if (character) character.hp = 0;
        playerDead = true;
        playerAnimation = animation('dead');
        monster = null;
        break;
      case 'player_respawn':
        if (character) {
          character.hp = event.hp;
          character.sp = event.sp;
        }
        playerDead = false;
        playerAnimation = animation('spawn');
        break;
      case 'loot':
        if (event.pickedUp && character) {
          const current = character.inventory[event.itemId] ?? 0;
          character.inventory = withQuantity(
            character.inventory,
            event.itemId,
            current + event.quantity,
          );
        }
        break;
      case 'experience':
        if (character) character.experience = event.experience;
        float('monster', `+${event.amount} XP`, 'reward');
        break;
      case 'zeny':
        if (character) character.zeny = event.total;
        break;
      case 'level_up':
        if (character) {
          character.level = event.level;
          character.hp = event.maxHp;
          character.sp = event.maxSp;
        }
        if (derived) {
          derived.maxHp = event.maxHp;
          derived.maxSp = event.maxSp;
        }
        float('player', 'Level Up!', 'reward');
        break;
    }

    set({
      character,
      derived,
      monster,
      playerDead,
      playerAnimation: animate ? playerAnimation : s.playerAnimation,
      monsterAnimation: animate ? monsterAnimation : s.monsterAnimation,
      floating: floating.length ? [...s.floating, ...floating].slice(-MAX_FLOATING) : s.floating,
      log: appendLog(s.log, [event]),
    });
  },

  removeFloating: (id) => set((s) => ({ floating: s.floating.filter((f) => f.id !== id) })),
  dismissOfflineRewards: () => set({ offlineRewards: null }),
}));

function withQuantity(inventory: Record<string, number>, itemId: string, quantity: number) {
  const next = { ...inventory };
  if (quantity > 0) next[itemId] = quantity;
  else delete next[itemId];
  return next;
}

function appendLog(log: LogEntry[], events: CombatEvent[]): LogEntry[] {
  const entries: LogEntry[] = [];
  for (const event of events) {
    const line = describeEvent(event);
    if (line) entries.push({ id: nextId++, timestamp: event.timestamp, ...line });
  }
  return entries.length ? [...log, ...entries].slice(-MAX_LOG_ENTRIES) : log;
}

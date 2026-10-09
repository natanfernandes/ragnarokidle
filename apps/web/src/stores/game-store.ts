import { create } from 'zustand';
import type {
  ActorPlacement,
  AssetInfo,
  CombatSnapshot,
  OfflineRewards,
  ServerMessage,
} from '@ragidle/protocol';
import type { CharacterState, CombatEvent, DerivedStats, GridPosition } from '@ragidle/shared';
import { PLAYER_ACTOR_ID, facingDirection } from '@ragidle/shared';
import type { ConnectionStatus } from '../net/game-client';
import { type LogKind, describeEvent } from '../presentation/describe-event';

/**
 * Presentation state only. Everything here is either copied from an
 * authoritative server snapshot or replayed from authoritative events.
 */

export type AnimationKind =
  'idle' | 'walk' | 'attack' | 'skill' | 'hit' | 'dying' | 'dead' | 'spawn';

export interface ActorAnimation {
  kind: AnimationKind;
  /** Changes on every new animation so CSS animations restart. */
  key: number;
  /** How long the animation lasts when the simulation decides it (walks). */
  durationMs?: number;
}

/** Where an actor is drawn on the field. */
export interface StagePlacement {
  /** The cell the actor stands on, or is walking to. */
  position: GridPosition;
  /** Time to slide to `position`; 0 places the actor there at once. */
  travelMs: number;
  /** Ragnarok Online direction (0 south ... 7 south-east). */
  direction: number;
}

export interface PresentedMonster {
  instanceId: string;
  monsterId: string;
  hp: number;
  maxHp: number;
  dying: boolean;
  placement: StagePlacement;
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
  /** False for free accounts: combat pauses while no tab is open. */
  offlineProgress: boolean;
  character: CharacterState | null;
  derived: DerivedStats | null;
  combat: CombatSnapshot | null;
  assets: AssetInfo | null;
  monster: PresentedMonster | null;
  /** Null until the player has been placed on a field. */
  playerPlacement: StagePlacement | null;
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
const animation = (kind: AnimationKind, durationMs?: number): ActorAnimation => ({
  kind,
  key: nextId++,
  ...(durationMs ? { durationMs } : {}),
});

/** The player faces south-east and monsters south-west until they turn. */
export const PLAYER_DEFAULT_DIRECTION = 7;
export const MONSTER_DEFAULT_DIRECTION = 1;

/** Places an actor from a snapshot, sliding it on if its walk is still under way. */
function placementFrom(
  placement: ActorPlacement,
  serverTime: number,
  direction: number,
): StagePlacement {
  const { position, movement } = placement;
  const travelMs = movement ? Math.max(0, movement.arriveAt - serverTime) : 0;
  return {
    position,
    travelMs,
    direction:
      movement && travelMs > 0 ? facingDirection(movement.from, movement.to, direction) : direction,
  };
}

/**
 * Starts a walk for the time left in a snapshot taken mid-walk. A walk that is
 * already playing is restarted for its remaining time, which is harmless.
 */
function walkingFrom(current: ActorAnimation, placement: StagePlacement | null): ActorAnimation {
  if (!placement || placement.travelMs <= 0) return current;
  return animation('walk', placement.travelMs);
}

const facing = (placement: StagePlacement, target: StagePlacement | null | undefined) =>
  target
    ? facingDirection(placement.position, target.position, placement.direction)
    : placement.direction;

export const useGameStore = create<GameState>()((set, get) => ({
  status: 'disconnected',
  characterId: null,
  offlineProgress: false,
  character: null,
  derived: null,
  combat: null,
  assets: null,
  monster: null,
  playerPlacement: null,
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
        set({
          characterId: message.characterId,
          offlineProgress: message.offlineProgress,
          lastError: null,
        });
        return;
      case 'state.snapshot': {
        const { monster, player } = message.combat;
        set((s) => {
          const playerPlacement = player
            ? placementFrom(
                player,
                message.serverTime,
                s.playerPlacement?.direction ?? PLAYER_DEFAULT_DIRECTION,
              )
            : s.playerPlacement;
          // Instance ids restart with every fight, so a dying monster left over
          // from the last one is never the monster in this snapshot.
          const known =
            monster && s.monster?.instanceId === monster.instanceId && !s.monster.dying
              ? s.monster
              : null;
          const monsterPlacement = monster
            ? placementFrom(
                monster.placement,
                message.serverTime,
                known?.placement.direction ?? MONSTER_DEFAULT_DIRECTION,
              )
            : null;
          return {
            character: message.character,
            derived: message.derived,
            combat: message.combat,
            assets: message.assets,
            playerDead: message.combat.respawnAt !== null,
            playerPlacement,
            // The move events behind a walk already under way may have been
            // discarded as covered by this snapshot, so start the walk here.
            playerAnimation: player
              ? walkingFrom(s.playerAnimation, playerPlacement)
              : s.playerAnimation,
            // A monster first seen in a snapshot (its spawn event was covered by it)
            // must not inherit the previous monster's animation, e.g. a death.
            monsterAnimation: monsterPlacement
              ? walkingFrom(known ? s.monsterAnimation : animation('idle'), monsterPlacement)
              : s.monsterAnimation,
            monster:
              monster && monsterPlacement
                ? {
                    instanceId: monster.instanceId,
                    monsterId: monster.monsterId,
                    hp: monster.hp,
                    maxHp: monster.maxHp,
                    dying: false,
                    placement: monsterPlacement,
                  }
                : s.monster?.dying
                  ? s.monster
                  : null,
            log: appendLog(s.log, coveredEvents),
          };
        });
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
    let { monster, playerPlacement, playerAnimation, monsterAnimation, playerDead } = s;
    const floating: FloatingText[] = [];
    const isPlayer = (id: string) => id === PLAYER_ACTOR_ID;
    const float = (target: FloatingText['target'], text: string, kind: FloatingKind) =>
      animate && floating.push({ id: nextId++, target, text, kind });

    switch (event.type) {
      case 'monster_spawn': {
        const placement = {
          position: event.position,
          travelMs: 0,
          direction: MONSTER_DEFAULT_DIRECTION,
        };
        monster = {
          instanceId: event.monsterInstanceId,
          monsterId: event.monsterId,
          hp: event.hp,
          maxHp: event.maxHp,
          dying: false,
          placement: { ...placement, direction: facing(placement, playerPlacement) },
        };
        monsterAnimation = animation('spawn');
        break;
      }
      case 'move': {
        const travelMs = animate ? event.arriveAt - event.timestamp : 0;
        const walk = (direction: number): StagePlacement => ({
          position: event.to,
          travelMs,
          direction: facingDirection(event.from, event.to, direction),
        });
        if (isPlayer(event.actorId)) {
          playerPlacement = walk(playerPlacement?.direction ?? PLAYER_DEFAULT_DIRECTION);
          playerAnimation = animation('walk', travelMs);
        } else if (monster?.instanceId === event.actorId) {
          monster = { ...monster, placement: walk(monster.placement.direction) };
          monsterAnimation = animation('walk', travelMs);
        }
        break;
      }
      case 'attack':
        // Both sides turn to face each other when blows are exchanged.
        [playerPlacement, monster] = faceEachOther(playerPlacement, monster);
        if (isPlayer(event.attackerId)) playerAnimation = animation('attack');
        else monsterAnimation = animation('attack');
        break;
      case 'skill_cast':
        [playerPlacement, monster] = faceEachOther(playerPlacement, monster);
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
        playerPlacement = {
          position: event.position,
          travelMs: 0,
          direction: PLAYER_DEFAULT_DIRECTION,
        };
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
      playerPlacement,
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

function faceEachOther(
  player: StagePlacement | null,
  monster: PresentedMonster | null,
): [StagePlacement | null, PresentedMonster | null] {
  if (!player || !monster) return [player, monster];
  return [
    { ...player, direction: facing(player, monster.placement) },
    {
      ...monster,
      placement: { ...monster.placement, direction: facing(monster.placement, player) },
    },
  ];
}

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

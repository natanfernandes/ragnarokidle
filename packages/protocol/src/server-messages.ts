import type { CharacterState, CombatEvent, DerivedStats } from '@ragidle/shared';

export interface MonsterSnapshot {
  instanceId: string;
  monsterId: string;
  hp: number;
  maxHp: number;
}

export interface CombatSnapshot {
  active: boolean;
  mapId: string | null;
  monster: MonsterSnapshot | null;
  /** Epoch ms when the player respawns, if dead. */
  respawnAt: number | null;
}

export interface AssetInfo {
  /** Whether rendered sprites are available; otherwise the client draws placeholders. */
  rendererEnabled: boolean;
  /** Key for the player's sprites: /assets/render/player/{playerAppearance}/{action}. */
  playerAppearance: string;
}

export interface OfflineRewards {
  /** Simulated time, which may be capped below the real elapsed time. */
  simulatedMs: number;
  elapsedMs: number;
  experience: number;
  zeny: number;
  levels: number;
  kills: number;
  deaths: number;
  items: Record<string, number>;
}

export type ServerErrorCode =
  | 'invalid_message'
  | 'unauthenticated'
  | 'invalid_state'
  | 'invalid_config'
  | 'unknown_map'
  | 'rate_limited';

export type ServerMessage =
  | { type: 'authenticated'; characterId: string; serverTime: number; requestId?: string }
  | {
      type: 'state.snapshot';
      serverTime: number;
      character: CharacterState;
      derived: DerivedStats;
      combat: CombatSnapshot;
      assets: AssetInfo;
      requestId?: string;
    }
  | { type: 'combat.events'; serverTime: number; events: CombatEvent[] }
  | { type: 'offline.rewards'; rewards: OfflineRewards }
  | { type: 'error'; code: ServerErrorCode; message: string; requestId?: string };

export type ServerMessageType = ServerMessage['type'];

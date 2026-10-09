import type { CombatEvent } from '@ragidle/shared';
import { create } from 'zustand';

export interface RecentDrop {
  itemId: string;
  quantity: number;
}

const MAX_RECENT_DROPS = 4;

interface SessionStats {
  /** Wall-clock time of the first event seen in this browser session. */
  startedAt: number | null;
  experience: number;
  zeny: number;
  kills: number;
  potions: number;
  deaths: number;
  /** Picked-up items, most recent first, one entry per item. */
  recentDrops: RecentDrop[];
  /** Wall-clock time farming started, while it lasts. */
  farmingSince: number | null;

  record(event: CombatEvent): void;
  setFarming(active: boolean): void;
  /** Clears every total, e.g. when another account signs in. */
  reset(): void;
}

type Totals = Omit<SessionStats, 'record' | 'setFarming' | 'reset'>;

const EMPTY: Totals = {
  startedAt: null,
  experience: 0,
  zeny: 0,
  kills: 0,
  potions: 0,
  deaths: 0,
  recentDrops: [],
  farmingSince: null,
};

/**
 * Totals of what the player has seen happen since the page loaded. Rates
 * shown in "Live results" are derived from these. Presentation only: the
 * server stays the source of truth for the character.
 */
export const useSessionStats = create<SessionStats>()((set) => ({
  ...EMPTY,

  record: (event) =>
    set((s) => {
      const startedAt = s.startedAt ?? Date.now();
      switch (event.type) {
        case 'experience':
          return { startedAt, experience: s.experience + event.amount };
        case 'zeny':
          return { startedAt, zeny: s.zeny + event.amount };
        case 'monster_death':
          return { startedAt, kills: s.kills + 1 };
        case 'potion_used':
          return { startedAt, potions: s.potions + 1 };
        case 'player_death':
          return { startedAt, deaths: s.deaths + 1 };
        case 'loot': {
          if (!event.pickedUp) return { startedAt };
          const previous = s.recentDrops.find((d) => d.itemId === event.itemId);
          const drop = {
            itemId: event.itemId,
            quantity: (previous?.quantity ?? 0) + event.quantity,
          };
          const others = s.recentDrops.filter((d) => d.itemId !== event.itemId);
          return { startedAt, recentDrops: [drop, ...others].slice(0, MAX_RECENT_DROPS) };
        }
        default:
          return { startedAt };
      }
    }),

  setFarming: (active) =>
    set((s) => ({ farmingSince: active ? (s.farmingSince ?? Date.now()) : null })),

  reset: () => set(EMPTY),
}));

/** Amount per minute since the session started; at least one minute is assumed. */
export function perMinute(amount: number, startedAt: number | null, now: number): number {
  if (startedAt === null) return 0;
  const minutes = Math.max(1, (now - startedAt) / 60_000);
  return amount / minutes;
}

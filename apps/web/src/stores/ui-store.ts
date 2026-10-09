import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** Top-level screens reachable from the side navigation. */
export type View = 'hunt' | 'character' | 'bag' | 'world';
export type ConfigTab = 'general' | 'skills' | 'potions' | 'loot';
export type LogTab = 'all' | 'loot' | 'system';

interface UiState {
  view: View;
  configTab: ConfigTab;
  logTab: LogTab;
  /** Item count the player has already seen in the bag, for the "new" badge. */
  seenItemCount: number | null;

  setView(view: View): void;
  setConfigTab(tab: ConfigTab): void;
  setLogTab(tab: LogTab): void;
  markItemsSeen(count: number): void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      view: 'hunt',
      configTab: 'general',
      logTab: 'all',
      seenItemCount: null,
      setView: (view) => set({ view }),
      setConfigTab: (configTab) => set({ configTab }),
      setLogTab: (logTab) => set({ logTab }),
      markItemsSeen: (count) => set({ seenItemCount: count }),
    }),
    {
      name: 'ragidle.ui',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ view: s.view, configTab: s.configTab, logTab: s.logTab }),
      // Version 1 stored the old dock tab; start fresh.
      migrate: () => ({}),
    },
  ),
);

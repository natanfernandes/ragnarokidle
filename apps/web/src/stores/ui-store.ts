import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type DockTab = 'automation' | 'bag' | 'character';

interface UiState {
  /** Tab shown in the dock on wide screens. Remembered between visits. */
  dockTab: DockTab;
  /** Panel open in the bottom sheet on phones, if any. */
  sheet: DockTab | null;
  /** Item count the player has already seen in the bag, for the "new" badge. */
  seenItemCount: number | null;

  /** Shows a tab in the dock; on phones also opens it in the sheet. */
  showTab(tab: DockTab, openSheet: boolean): void;
  toggleSheet(tab: DockTab): void;
  closeSheet(): void;
  markItemsSeen(count: number): void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      dockTab: 'automation',
      sheet: null,
      seenItemCount: null,
      showTab: (tab, openSheet) => set(openSheet ? { dockTab: tab, sheet: tab } : { dockTab: tab }),
      toggleSheet: (tab) => set((s) => ({ sheet: s.sheet === tab ? null : tab, dockTab: tab })),
      closeSheet: () => set({ sheet: null }),
      markItemsSeen: (count) => set({ seenItemCount: count }),
    }),
    {
      name: 'ragidle.ui',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ dockTab: s.dockTab }),
    },
  ),
);

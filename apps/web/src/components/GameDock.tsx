import { BottomNav, Sheet, TabWindow, useMediaQuery, WIDE_SCREEN } from '@ragidle/ui';
import { useEffect } from 'react';
import { DOCK_TABS } from '../panels/dock';
import { useGameStore } from '../stores/game-store';
import { useUiStore, type DockTab } from '../stores/ui-store';

/** Tabbed dock beside the stage on wide screens; bottom nav plus sheet on phones. */
export function GameDock() {
  const wide = useMediaQuery(WIDE_SCREEN);
  const dockTab = useUiStore((s) => s.dockTab);
  const sheet = useUiStore((s) => s.sheet);
  const showTab = useUiStore((s) => s.showTab);
  const toggleSheet = useUiStore((s) => s.toggleSheet);
  const closeSheet = useUiStore((s) => s.closeSheet);
  const bagBadge = useBagBadge(wide ? dockTab : sheet);
  const character = useGameStore((s) => s.character);
  if (!character) return null;

  const tabs = DOCK_TABS.map((t) => ({
    id: t.id,
    label: t.label,
    hotkey: t.hotkey,
    badge: t.id === 'bag' && bagBadge,
  }));

  if (wide) {
    const Panel = DOCK_TABS.find((t) => t.id === dockTab)?.Panel;
    return (
      <TabWindow
        tabs={tabs}
        value={dockTab}
        onChange={(tab) => showTab(tab, false)}
        className="sticky top-3 max-h-[calc(100vh-1.5rem)]"
        bodyClassName="overflow-y-auto"
      >
        {Panel && <Panel />}
      </TabWindow>
    );
  }

  const open = DOCK_TABS.find((t) => t.id === sheet);
  return (
    <>
      {open && (
        <Sheet title={open.label} onClose={closeSheet}>
          <open.Panel />
        </Sheet>
      )}
      <BottomNav items={tabs} value={sheet} onSelect={toggleSheet} />
    </>
  );
}

/** True when the bag holds more items than the player last saw. */
function useBagBadge(visibleTab: DockTab | null): boolean {
  const itemCount = useGameStore((s) =>
    s.character ? Object.values(s.character.inventory).reduce((sum, qty) => sum + qty, 0) : null,
  );
  const seen = useUiStore((s) => s.seenItemCount);
  const markItemsSeen = useUiStore((s) => s.markItemsSeen);

  useEffect(() => {
    if (itemCount === null) return;
    // The first snapshot counts as seen; after that, only opening the bag does.
    if (seen === null || visibleTab === 'bag' || itemCount < seen) markItemsSeen(itemCount);
  }, [itemCount, seen, visibleTab, markItemsSeen]);

  return itemCount !== null && seen !== null && itemCount > seen && visibleTab !== 'bag';
}

import { gameData } from '@ragidle/game-data';
import { BottomNav, type NavItem, SideNav, useHotkeys } from '@ragidle/ui';
import { Backpack, Map as MapIcon, Swords, User } from 'lucide-react';
import { useEffect } from 'react';
import { OfflineRewardsDialog } from './components/OfflineRewardsDialog';
import { TopBar } from './components/TopBar';
import { game } from './game';
import { useGameStore } from './stores/game-store';
import { useUiStore, type View } from './stores/ui-store';
import { BagView } from './views/BagView';
import { CharacterView } from './views/CharacterView';
import { HuntView } from './views/HuntView';
import { WorldView } from './views/WorldView';

const VIEWS: { id: View; label: string; hotkey: string; Icon: typeof Swords }[] = [
  { id: 'hunt', label: 'Hunt', hotkey: 'Alt+H', Icon: Swords },
  { id: 'character', label: 'Character', hotkey: 'Alt+A', Icon: User },
  { id: 'bag', label: 'Bag', hotkey: 'Alt+E', Icon: Backpack },
  { id: 'world', label: 'World', hotkey: 'Alt+M', Icon: MapIcon },
];

/**
 * Shell: side navigation (bottom bar on phones), the character top bar, and
 * the current view. See docs/design-system.md for the layout rules.
 */
export function App() {
  const lastError = useGameStore((s) => s.lastError);
  const view = useUiStore((s) => s.view);
  const setView = useUiStore((s) => s.setView);
  const bagBadge = useBagBadge(view === 'bag');

  useEffect(() => {
    game.connect();
    return () => game.disconnect();
  }, []);

  useHotkeys({
    'Alt+H': () => setView('hunt'),
    'Alt+A': () => setView('character'),
    'Alt+Q': () => setView('character'),
    'Alt+E': () => setView('bag'),
    'Alt+M': () => setView('world'),
    Space: toggleFarming,
  });

  const items: NavItem<View>[] = VIEWS.map(({ id, label, hotkey, Icon }) => ({
    id,
    label,
    hotkey,
    icon: <Icon className="size-5" />,
    badge: id === 'bag' && bagBadge,
  }));

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[220px_minmax(0,1fr)]">
      <div className="hidden border-r border-line bg-bg-deep lg:block">
        <aside className="sticky top-0 flex h-screen flex-col gap-8 px-4 py-6">
          <Logo />
          <SideNav items={items} value={view} onSelect={setView} aria-label="Game" />
          <ShortcutHint />
        </aside>
      </div>

      <div className="flex min-w-0 flex-col pb-20 lg:pb-0">
        <div className="z-20 lg:sticky lg:top-0">
          <TopBar />
        </div>
        {lastError && (
          <div
            role="alert"
            className="mx-4 mt-4 rounded-control border border-danger/40 bg-danger/15 px-3 py-2 text-danger lg:mx-6"
          >
            {lastError}
          </div>
        )}
        <main className="p-4 lg:p-6">
          {view === 'hunt' && <HuntView />}
          {view === 'character' && <CharacterView />}
          {view === 'bag' && <BagView />}
          {view === 'world' && <WorldView />}
        </main>
      </div>

      <BottomNav items={items} value={view} onSelect={setView} className="lg:hidden" />
      <OfflineRewardsDialog />
    </div>
  );
}

function Logo() {
  return (
    <div className="flex flex-col items-center leading-none select-none">
      <span className="font-display text-[28px] font-bold tracking-wide text-primary">
        Ragnarok
      </span>
      <span className="mt-1 font-display text-sm font-semibold tracking-[0.5em] text-text">
        IDLE
      </span>
    </div>
  );
}

function ShortcutHint() {
  return (
    <div className="mt-auto rounded-control border border-line bg-surface/60 p-3 text-xs text-text-soft">
      <p className="m-0 mb-2 font-semibold text-text">Shortcuts</p>
      <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        {VIEWS.map((v) => (
          <div key={v.id} className="contents">
            <dt className="font-mono text-text-faint">{v.hotkey}</dt>
            <dd className="m-0">{v.label}</dd>
          </div>
        ))}
        <dt className="font-mono text-text-faint">Space</dt>
        <dd className="m-0">Start / stop</dd>
      </dl>
    </div>
  );
}

function toggleFarming() {
  const { combat, character } = useGameStore.getState();
  if (!combat) return;
  if (combat.active) return game.stopCombat();
  const mapId = combat.mapId ?? character?.currentMapId ?? Object.keys(gameData.maps)[0];
  if (mapId) game.startCombat(mapId);
}

/** True when the bag holds more items than the player last saw. */
function useBagBadge(bagVisible: boolean): boolean {
  const itemCount = useGameStore((s) =>
    s.character ? Object.values(s.character.inventory).reduce((sum, qty) => sum + qty, 0) : null,
  );
  const seen = useUiStore((s) => s.seenItemCount);
  const markItemsSeen = useUiStore((s) => s.markItemsSeen);

  useEffect(() => {
    if (itemCount === null) return;
    // The first snapshot counts as seen; after that, only opening the bag does.
    if (seen === null || bagVisible || itemCount < seen) markItemsSeen(itemCount);
  }, [itemCount, seen, bagVisible, markItemsSeen]);

  return itemCount !== null && seen !== null && itemCount > seen && !bagVisible;
}

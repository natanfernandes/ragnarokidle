import { gameData } from '@ragidle/game-data';
import { StatusPill, useHotkeys, useMediaQuery, WIDE_SCREEN, type StatusTone } from '@ragidle/ui';
import { useEffect } from 'react';
import { CombatLog } from './components/CombatLog';
import { CombatStage } from './components/CombatStage';
import { GameDock } from './components/GameDock';
import { HudBar } from './components/HudBar';
import { OfflineRewardsDialog } from './components/OfflineRewardsDialog';
import { game } from './game';
import type { ConnectionStatus } from './net/game-client';
import { useGameStore } from './stores/game-store';
import { useUiStore, type DockTab } from './stores/ui-store';

const STATUS_TONE: Record<ConnectionStatus, StatusTone> = {
  connected: 'ok',
  connecting: 'warn',
  disconnected: 'bad',
};

/**
 * "Stage + dock" layout (docs/design-system.md): the HUD and combat stage are
 * always visible, management panels live in a tabbed dock (a bottom sheet on
 * phones), and RO-style shortcuts open them.
 */
export function App() {
  const status = useGameStore((s) => s.status);
  const lastError = useGameStore((s) => s.lastError);
  const wide = useMediaQuery(WIDE_SCREEN);
  const showTab = useUiStore((s) => s.showTab);
  const show = (tab: DockTab) => showTab(tab, !wide);

  useEffect(() => {
    game.connect();
    return () => game.disconnect();
  }, []);

  useHotkeys({
    'Alt+R': () => show('automation'),
    'Alt+E': () => show('bag'),
    'Alt+A': () => show('character'),
    'Alt+Q': () => show('character'),
    Space: toggleFarming,
  });

  return (
    <div className="mx-auto max-w-[1280px] px-4 pt-3 pb-16 lg:pb-8">
      <header className="mb-3 flex items-center justify-between gap-3">
        <h1 className="m-0 font-display text-2xl font-bold tracking-wide text-on-ground">
          Ragnarok Idle
        </h1>
        <StatusPill tone={STATUS_TONE[status]}>{status}</StatusPill>
      </header>
      {lastError && (
        <div role="alert" className="mb-2.5 rounded-control bg-window px-2.5 py-1.5 text-danger">
          {lastError}
        </div>
      )}
      <main className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="lg:col-span-2">
          <HudBar />
        </div>
        <div className="flex min-w-0 flex-col gap-3">
          <CombatStage />
          <CombatLog />
        </div>
        <GameDock />
      </main>
      <OfflineRewardsDialog />
    </div>
  );
}

function toggleFarming() {
  const combat = useGameStore.getState().combat;
  if (!combat) return;
  if (combat.active) return game.stopCombat();
  const mapId = combat.mapId ?? Object.keys(gameData.maps)[0];
  if (mapId) game.startCombat(mapId);
}

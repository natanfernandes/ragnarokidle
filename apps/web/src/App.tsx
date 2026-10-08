import { StatusPill, type StatusTone } from '@ragidle/ui';
import { useEffect } from 'react';
import { CharacterPanel } from './components/CharacterPanel';
import { CombatLog } from './components/CombatLog';
import { CombatStage } from './components/CombatStage';
import { ConfigPanel } from './components/ConfigPanel';
import { InventoryPanel } from './components/InventoryPanel';
import { OfflineRewardsDialog } from './components/OfflineRewardsDialog';
import { game } from './game';
import type { ConnectionStatus } from './net/game-client';
import { useGameStore } from './stores/game-store';

const STATUS_TONE: Record<ConnectionStatus, StatusTone> = {
  connected: 'ok',
  connecting: 'warn',
  disconnected: 'bad',
};

export function App() {
  const status = useGameStore((s) => s.status);
  const lastError = useGameStore((s) => s.lastError);

  useEffect(() => {
    game.connect();
    return () => game.disconnect();
  }, []);

  return (
    <div className="mx-auto max-w-[1280px] px-4 pt-3 pb-8">
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
      <main className="grid items-start gap-3 lg:grid-cols-[260px_minmax(0,1fr)_280px]">
        <div className="flex min-w-0 flex-col gap-3">
          <CharacterPanel />
          <InventoryPanel />
        </div>
        <div className="flex min-w-0 flex-col gap-3 max-lg:order-first">
          <CombatStage />
          <CombatLog />
        </div>
        <div className="flex min-w-0 flex-col gap-3">
          <ConfigPanel />
        </div>
      </main>
      <OfflineRewardsDialog />
    </div>
  );
}

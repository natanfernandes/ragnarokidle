import { useEffect } from 'react';
import { CharacterPanel } from './components/CharacterPanel';
import { CombatLog } from './components/CombatLog';
import { CombatStage } from './components/CombatStage';
import { ConfigPanel } from './components/ConfigPanel';
import { InventoryPanel } from './components/InventoryPanel';
import { OfflineRewardsDialog } from './components/OfflineRewardsDialog';
import { game } from './game';
import { useGameStore } from './stores/game-store';

export function App() {
  const status = useGameStore((s) => s.status);
  const lastError = useGameStore((s) => s.lastError);

  useEffect(() => {
    game.connect();
    return () => game.disconnect();
  }, []);

  return (
    <div className="app">
      <header className="topbar">
        <h1>Ragnarok Idle</h1>
        <span className={`status status-${status}`}>{status}</span>
      </header>
      {lastError && <div className="error">{lastError}</div>}
      <main className="layout">
        <div className="column">
          <CharacterPanel />
          <InventoryPanel />
        </div>
        <div className="column wide">
          <CombatStage />
          <CombatLog />
        </div>
        <div className="column">
          <ConfigPanel />
        </div>
      </main>
      <OfflineRewardsDialog />
    </div>
  );
}

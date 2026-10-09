import type { AccountInfo } from '@ragidle/protocol';
import { useEffect, useState } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { CharacterPanel } from './components/CharacterPanel';
import { CombatLog } from './components/CombatLog';
import { CombatStage } from './components/CombatStage';
import { ConfigPanel } from './components/ConfigPanel';
import { InventoryPanel } from './components/InventoryPanel';
import { OfflineRewardsDialog } from './components/OfflineRewardsDialog';
import { game } from './game';
import { authApi } from './net/auth-api';
import { useGameStore } from './stores/game-store';

export function App() {
  // Undefined while the session cookie is being checked.
  const [account, setAccount] = useState<AccountInfo | null | undefined>(undefined);
  // The server rejected the session (expired or signed out elsewhere).
  const rejected = useGameStore((s) => s.status === 'unauthenticated');

  useEffect(() => {
    authApi.me().then(setAccount, () => setAccount(null));
  }, []);

  const signIn = (next: AccountInfo) => {
    useGameStore.getState().setStatus('disconnected');
    setAccount(next);
  };

  if (account === undefined) return null;
  if (account === null || rejected) return <AuthScreen onSignedIn={signIn} />;
  return (
    <Game
      account={account}
      onSignOut={async () => {
        await authApi.logout();
        setAccount(null);
      }}
    />
  );
}

function Game({ account, onSignOut }: { account: AccountInfo; onSignOut: () => void }) {
  const status = useGameStore((s) => s.status);
  const lastError = useGameStore((s) => s.lastError);
  const offlineProgress = useGameStore((s) => s.offlineProgress);

  useEffect(() => {
    game.connect();
    return () => game.disconnect();
  }, [account.id]);

  return (
    <div className="app">
      <header className="topbar">
        <h1>Ragnarok Idle</h1>
        <div className="topbar-actions">
          <span
            className="hint"
            title={
              offlineProgress
                ? 'VIP: your character keeps fighting while you are away.'
                : 'Combat pauses when you close every tab. VIP keeps fighting offline.'
            }
          >
            {offlineProgress ? 'VIP' : 'Keep this tab open to progress'}
          </span>
          <span className={`status status-${status}`}>{status}</span>
          <span className="account">{account.email}</span>
          <button onClick={onSignOut}>Sign out</button>
        </div>
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

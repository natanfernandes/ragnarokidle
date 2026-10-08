import { gameData } from '@ragidle/game-data';
import { useGameStore } from '../stores/game-store';

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60_000);
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
}

export function OfflineRewardsDialog() {
  const rewards = useGameStore((s) => s.offlineRewards);
  const dismiss = useGameStore((s) => s.dismissOfflineRewards);
  if (!rewards) return null;

  return (
    <div className="dialog-backdrop" onClick={dismiss}>
      <div className="window dialog" onClick={(e) => e.stopPropagation()}>
        <h2>Welcome back!</h2>
        <p>
          While you were away for {formatDuration(rewards.elapsedMs)}
          {rewards.simulatedMs < rewards.elapsedMs &&
            ` (capped at ${formatDuration(rewards.simulatedMs)})`}
          :
        </p>
        <ul>
          <li>{rewards.kills.toLocaleString('en-US')} monsters defeated</li>
          <li>+{rewards.experience.toLocaleString('en-US')} XP</li>
          {rewards.levels > 0 && <li>+{rewards.levels} levels</li>}
          <li>+{rewards.zeny.toLocaleString('en-US')} Zeny</li>
          {rewards.deaths > 0 && <li>{rewards.deaths} deaths</li>}
          {Object.entries(rewards.items).map(([id, qty]) => (
            <li key={id}>
              +{qty} {gameData.items[id]?.name ?? id}
            </li>
          ))}
        </ul>
        <button onClick={dismiss}>Continue</button>
      </div>
    </div>
  );
}

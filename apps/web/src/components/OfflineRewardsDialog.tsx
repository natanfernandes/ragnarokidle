import { gameData } from '@ragidle/game-data';
import { Button, Dialog } from '@ragidle/ui';
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
    <Dialog
      title="Welcome back!"
      onClose={dismiss}
      footer={
        <Button variant="primary" onClick={dismiss}>
          Continue
        </Button>
      }
    >
      <p className="m-0">
        While you were away for {formatDuration(rewards.elapsedMs)}
        {rewards.simulatedMs < rewards.elapsedMs &&
          ` (capped at ${formatDuration(rewards.simulatedMs)})`}
        :
      </p>
      <ul className="m-0 list-disc pl-5 tabular-nums">
        <li>{rewards.kills.toLocaleString('en-US')} monsters defeated</li>
        <li className="text-success">+{rewards.experience.toLocaleString('en-US')} XP</li>
        {rewards.levels > 0 && <li className="font-semibold">+{rewards.levels} levels</li>}
        <li className="text-zeny">+{rewards.zeny.toLocaleString('en-US')} Zeny</li>
        {rewards.deaths > 0 && <li className="text-danger">{rewards.deaths} deaths</li>}
        {Object.entries(rewards.items).map(([id, qty]) => (
          <li key={id} className="text-loot">
            +{qty} {gameData.items[id]?.name ?? id}
          </li>
        ))}
      </ul>
    </Dialog>
  );
}

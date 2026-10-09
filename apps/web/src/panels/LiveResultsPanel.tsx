import { gameData } from '@ragidle/game-data';
import { Panel, SectionLabel, StatTile } from '@ragidle/ui';
import { Activity, FlaskConical, Skull } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ItemSlot } from '../components/ItemSlot';
import { compact } from '../presentation/format';
import { perMinute, useSessionStats } from '../stores/session-stats';

/** Rates since the page was opened, and the latest items picked up. */
export function LiveResultsPanel(props: { className?: string }) {
  const stats = useSessionStats();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 2000);
    return () => clearInterval(timer);
  }, []);

  const rate = (amount: number) => compact(perMinute(amount, stats.startedAt, now));

  return (
    <Panel
      title="Live results"
      icon={<Activity className="size-4" />}
      className={props.className}
      bodyClassName="gap-3"
    >
      <div className="grid grid-cols-3 gap-2">
        <StatTile tone="success" value={rate(stats.experience)} label="XP/min" />
        <StatTile tone="primary" value={rate(stats.zeny)} label="Zeny/min" />
        <StatTile tone="info" value={rate(stats.kills)} label="Kills/min" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <StatTile
          layout="row"
          tone="danger"
          icon={<FlaskConical className="size-5" />}
          label="Potions"
          value={`${rate(stats.potions)}/min`}
        />
        <StatTile
          layout="row"
          tone="neutral"
          icon={<Skull className="size-5" />}
          label="Deaths"
          value={stats.deaths}
        />
      </div>
      <SectionLabel className="mt-1">Recent drops</SectionLabel>
      {stats.recentDrops.length === 0 ? (
        <p className="m-0 text-sm text-text-faint">Items you pick up show here.</p>
      ) : (
        <ul className="m-0 grid list-none grid-cols-4 gap-2 p-0">
          {stats.recentDrops.map((drop) => (
            <li
              key={drop.itemId}
              className="flex flex-col items-center gap-1.5 rounded-control border border-line bg-surface-sunken p-2 text-center"
            >
              <ItemSlot itemId={drop.itemId} className="size-10 border-0 bg-surface-raised" />
              <span className="line-clamp-2 text-xs leading-tight">
                {gameData.items[drop.itemId]?.name ?? drop.itemId}
              </span>
              <span className="text-[11px] text-text-soft tabular-nums">×{drop.quantity}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

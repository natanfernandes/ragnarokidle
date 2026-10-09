import { experienceToNextLevel, gameData } from '@ragidle/game-data';
import { cn, Meter } from '@ragidle/ui';
import { Coins } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ConnectionStatus } from '../net/game-client';
import { clock, full } from '../presentation/format';
import { useGameStore } from '../stores/game-store';
import { useSessionStats } from '../stores/session-stats';
import { Portrait } from './Portrait';

const STATUS_TEXT: Record<ConnectionStatus, string> = {
  connected: 'Online',
  connecting: 'Connecting',
  disconnected: 'Offline',
  unauthenticated: 'Signed out',
};

/** Always-visible character summary: who, HP/SP, Zeny and farming state. */
export function TopBar() {
  const character = useGameStore((s) => s.character);
  const derived = useGameStore((s) => s.derived);
  if (!character || !derived) return <div className="h-16" />;

  const toNext = experienceToNextLevel(character.level);
  const xpPercent = (character.experience / toNext) * 100;

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-line bg-bg-deep px-4 py-3 lg:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Portrait size="sm" />
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-baseline gap-2">
            <span className="truncate text-base font-semibold">
              {gameData.classes[character.classId]?.name}
            </span>
            <span className="text-sm text-text-soft">Lv. {character.level}</span>
          </div>
          <div className="flex items-center gap-2">
            <Meter kind="xp" size="sm" value={character.experience} max={toNext} className="w-32" />
            <span className="text-xs text-text-soft tabular-nums">{xpPercent.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      <div className="grid min-w-[220px] flex-1 grid-cols-[auto_1fr] items-center gap-x-2 gap-y-1 text-[11px] font-semibold text-text-soft sm:max-w-xs">
        <span>HP</span>
        <Meter kind="hp" value={character.hp} max={derived.maxHp} />
        <span>SP</span>
        <Meter kind="sp" value={character.sp} max={derived.maxSp} />
      </div>

      <div className="flex items-center gap-2 text-base font-semibold whitespace-nowrap">
        <Coins aria-hidden className="size-5 text-zeny" />
        <span className="tabular-nums">{full(character.zeny)}</span>
        <span className="text-sm font-normal text-text-soft">Zeny</span>
      </div>

      <FarmStatus />
    </div>
  );
}

function FarmStatus() {
  const status = useGameStore((s) => s.status);
  const active = useGameStore((s) => s.combat?.active ?? false);
  const since = useSessionStats((s) => s.farmingSince);
  const setFarming = useSessionStats((s) => s.setFarming);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => setFarming(active), [active, setFarming]);
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [active]);

  const dot = status !== 'connected' ? 'bg-danger' : active ? 'bg-success' : 'bg-text-faint';
  return (
    <div className="ml-auto flex items-center gap-2.5 sm:border-l sm:border-line sm:pl-5">
      <span className={cn('size-2.5 rounded-full', dot)} />
      <div className="flex flex-col leading-tight">
        <span className="text-xs text-text-soft">
          {status !== 'connected' ? STATUS_TEXT[status] : active ? 'Farming' : 'Idle'}
        </span>
        <span className="text-sm font-semibold tabular-nums">
          {active && since ? clock(now - since) : '--:--:--'}
        </span>
      </div>
    </div>
  );
}

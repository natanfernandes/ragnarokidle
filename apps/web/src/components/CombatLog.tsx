import { Window } from '@ragidle/ui';
import { useEffect, useRef } from 'react';
import type { LogKind } from '../presentation/describe-event';
import { useGameStore } from '../stores/game-store';

const KIND_TEXT: Record<LogKind, string> = {
  combat: 'text-ink',
  reward: 'text-zeny',
  loot: 'text-loot',
  danger: 'text-danger',
  system: 'text-ink-soft',
};

export function CombatLog() {
  const log = useGameStore((s) => s.log);
  const ref = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [log]);

  return (
    <Window title="Combat log">
      <ol
        ref={ref}
        className="m-0 h-[220px] list-none overflow-y-auto rounded-control border border-window-line bg-window-sunken px-2 py-1.5 font-mono text-xs"
      >
        {log.map((entry) => (
          <li key={entry.id} className={KIND_TEXT[entry.kind]}>
            <time className="mr-2 text-ink-faint tabular-nums">
              {new Date(entry.timestamp).toLocaleTimeString()}
            </time>
            {entry.text}
          </li>
        ))}
      </ol>
    </Window>
  );
}

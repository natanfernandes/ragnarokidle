import { Panel, Tabs } from '@ragidle/ui';
import { useEffect, useRef } from 'react';
import type { LogKind } from '../presentation/describe-event';
import { useGameStore } from '../stores/game-store';
import { type LogTab, useUiStore } from '../stores/ui-store';

const TABS: { id: LogTab; label: string }[] = [
  { id: 'all', label: 'Combat log' },
  { id: 'loot', label: 'Drops' },
  { id: 'system', label: 'System' },
];

const SHOWN: Record<LogTab, LogKind[] | null> = {
  all: null,
  loot: ['loot', 'reward'],
  system: ['system'],
};

const KIND_TEXT: Record<LogKind, string> = {
  combat: 'text-text',
  reward: 'text-success',
  loot: 'text-loot',
  danger: 'text-danger',
  system: 'text-text-soft',
};

export function CombatLogPanel(props: { className?: string }) {
  const log = useGameStore((s) => s.log);
  const tab = useUiStore((s) => s.logTab);
  const setTab = useUiStore((s) => s.setLogTab);
  const ref = useRef<HTMLOListElement>(null);
  const shown = SHOWN[tab];
  const entries = shown ? log.filter((e) => shown.includes(e.kind)) : log;

  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries.length, tab]);

  return (
    <Panel className={props.className} bodyClassName="gap-3 pt-3">
      <Tabs tabs={TABS} value={tab} onChange={setTab} variant="pill" aria-label="Log channel" />
      <ol
        ref={ref}
        aria-live="off"
        className="m-0 h-60 list-none overflow-y-auto p-0 text-[13px] leading-6"
      >
        {entries.length === 0 && <li className="text-text-faint">Nothing yet.</li>}
        {entries.map((entry) => (
          <li key={entry.id} className="flex gap-3">
            <time className="shrink-0 text-text-faint tabular-nums">
              {new Date(entry.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </time>
            <span className={KIND_TEXT[entry.kind]}>{entry.text}</span>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

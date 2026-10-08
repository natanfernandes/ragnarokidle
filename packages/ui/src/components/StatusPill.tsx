import type { ReactNode } from 'react';
import { cn } from '../cn';

const TONES = {
  ok: 'bg-ok',
  warn: 'bg-warn',
  bad: 'bg-bad',
  neutral: 'bg-ink-soft',
} as const;

export type StatusTone = keyof typeof TONES;

export function StatusPill(props: { tone: StatusTone; children: ReactNode }) {
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-xs font-semibold text-white capitalize',
        TONES[props.tone],
      )}
    >
      {props.children}
    </span>
  );
}

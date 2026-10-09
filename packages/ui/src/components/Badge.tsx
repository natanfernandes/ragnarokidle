import type { ReactNode } from 'react';
import { cn } from '../cn';

const TONES = {
  primary: 'border-primary/60 text-primary',
  success: 'border-success/40 bg-success/15 text-success',
  warn: 'border-warn/40 bg-warn/15 text-warn',
  danger: 'border-danger/40 bg-danger/15 text-danger',
  info: 'border-info/40 bg-info/15 text-info',
  neutral: 'border-line-strong bg-surface-raised text-text-soft',
} as const;

export type BadgeTone = keyof typeof TONES;

/** Small status label, e.g. "Farming", "Locked", "Rare". */
export function Badge(props: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        TONES[props.tone ?? 'neutral'],
        props.className,
      )}
    >
      {props.children}
    </span>
  );
}

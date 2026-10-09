import type { ReactNode } from 'react';
import { cn } from '../cn';

const TONES = {
  success: 'text-success',
  primary: 'text-primary',
  info: 'text-info',
  danger: 'text-danger',
  neutral: 'text-text',
} as const;

/** A headline number with its label, e.g. "1.2k XP/min". */
export function StatTile(props: {
  value: ReactNode;
  label: ReactNode;
  tone?: keyof typeof TONES;
  icon?: ReactNode;
  /** `row` puts the icon left of a smaller value, for secondary figures. */
  layout?: 'stack' | 'row';
  className?: string;
}) {
  const tone = TONES[props.tone ?? 'neutral'];
  if (props.layout === 'row') {
    return (
      <div
        className={cn(
          'flex items-center gap-3 rounded-control border border-line bg-surface-sunken px-3 py-2.5',
          props.className,
        )}
      >
        {props.icon && <span className={tone}>{props.icon}</span>}
        <div className="flex min-w-0 flex-col">
          <span className="text-xs text-text-soft">{props.label}</span>
          <span className="text-base font-semibold tabular-nums">{props.value}</span>
        </div>
      </div>
    );
  }
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-0.5 rounded-control border border-line bg-surface-sunken px-2 py-3 text-center',
        props.className,
      )}
    >
      <span className={cn('text-2xl font-semibold tabular-nums', tone)}>{props.value}</span>
      <span className="text-xs text-text-soft">{props.label}</span>
    </div>
  );
}

import type { ReactNode } from 'react';
import { cn } from '../cn';

/** Label / value pairs in two columns, like the RO status window. */
export function StatList(props: {
  stats: [label: string, value: ReactNode][];
  className?: string;
}) {
  return (
    <dl className={cn('m-0 grid grid-cols-2 gap-x-3 gap-y-0.5', props.className)}>
      {props.stats.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-2">
          <dt className="text-ink-soft">{label}</dt>
          <dd className="m-0 font-mono font-semibold tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

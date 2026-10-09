import type { ReactNode } from 'react';
import { cn } from '../cn';

export interface StatRow {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
}

/** Label / value rows, like the RO status window. */
export function StatList(props: { stats: StatRow[]; columns?: 1 | 2; className?: string }) {
  return (
    <dl
      className={cn(
        'm-0 grid gap-x-5 gap-y-1.5 text-sm',
        props.columns === 2 ? 'grid-cols-2' : 'grid-cols-1',
        props.className,
      )}
    >
      {props.stats.map((stat) => (
        <div key={stat.label} className="flex items-center justify-between gap-2">
          <dt className="flex items-center gap-2 text-text-soft">
            {stat.icon && <span className="text-text-faint">{stat.icon}</span>}
            {stat.label}
          </dt>
          <dd className="m-0 font-semibold tabular-nums">{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}

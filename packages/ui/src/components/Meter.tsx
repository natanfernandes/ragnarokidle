import { cn } from '../cn';

export type MeterKind = 'hp' | 'sp' | 'xp' | 'monster';

const FILL: Record<MeterKind, string> = {
  hp: 'bg-hp',
  sp: 'bg-sp',
  xp: 'bg-xp',
  monster: 'bg-hp',
};

/** HP / SP / XP bar. The value is always shown as text too, never by color alone. */
export function Meter(props: {
  value: number;
  max: number;
  kind: MeterKind;
  label?: string;
  className?: string;
}) {
  const pct = props.max > 0 ? Math.max(0, Math.min(100, (props.value / props.max) * 100)) : 0;
  const label = props.label ?? `${props.value} / ${props.max}`;
  return (
    <div
      role="meter"
      aria-label={props.kind.toUpperCase()}
      aria-valuenow={props.value}
      aria-valuemin={0}
      aria-valuemax={props.max}
      aria-valuetext={label}
      title={`${props.value} / ${props.max}`}
      className={cn('relative h-4 overflow-hidden rounded-[3px] bg-meter-track', props.className)}
    >
      <div
        className={cn('h-full transition-[width] duration-200 ease-out', FILL[props.kind])}
        style={{ width: `${pct}%` }}
      />
      <span className="absolute inset-0 text-center text-[11px] leading-4 font-semibold text-white tabular-nums [text-shadow:0_0_2px_black]">
        {label}
      </span>
    </div>
  );
}

import { cn } from '../cn';

export type MeterKind = 'hp' | 'sp' | 'xp' | 'monster';

const FILL: Record<MeterKind, string> = {
  hp: 'bg-linear-to-r from-hp to-[color-mix(in_srgb,var(--color-hp)_80%,white)]',
  sp: 'bg-linear-to-r from-sp to-[color-mix(in_srgb,var(--color-sp)_80%,white)]',
  xp: 'bg-linear-to-r from-xp to-[color-mix(in_srgb,var(--color-xp)_75%,white)]',
  monster: 'bg-hp',
};

/** HP / SP / XP bar. The value is shown as text too, never by color alone. */
export function Meter(props: {
  value: number;
  max: number;
  kind: MeterKind;
  label?: string;
  /** `sm` hides the label inside the bar; pass it next to the bar instead. */
  size?: 'sm' | 'md';
  className?: string;
}) {
  const pct = props.max > 0 ? Math.max(0, Math.min(100, (props.value / props.max) * 100)) : 0;
  const label =
    props.label ?? `${props.value.toLocaleString('en-US')} / ${props.max.toLocaleString('en-US')}`;
  const small = props.size === 'sm';
  return (
    <div
      role="meter"
      aria-label={props.kind.toUpperCase()}
      aria-valuenow={props.value}
      aria-valuemin={0}
      aria-valuemax={props.max}
      aria-valuetext={label}
      title={`${props.value} / ${props.max}`}
      className={cn(
        'relative overflow-hidden rounded-full bg-meter-track',
        small ? 'h-1.5' : 'h-4',
        props.className,
      )}
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-300 ease-out',
          FILL[props.kind],
        )}
        style={{ width: `${pct}%` }}
      />
      {!small && label && (
        <span className="absolute inset-0 text-center text-[11px] leading-4 font-semibold text-white tabular-nums [text-shadow:0_1px_1px_rgb(0_0_0/0.6)]">
          {label}
        </span>
      )}
    </div>
  );
}

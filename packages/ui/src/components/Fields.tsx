import type { ReactNode } from 'react';
import { cn } from '../cn';

/** A checkbox with its label, laid out as one row. Extra controls go in children. */
export function CheckboxRow(props: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn('flex flex-wrap items-center gap-1.5 text-sm', props.className)}>
      <input
        type="checkbox"
        className="size-4 accent-title-to"
        checked={props.checked}
        onChange={(e) => props.onChange(e.target.checked)}
      />
      {props.children}
    </label>
  );
}

/** A toggleable pill, used for filters such as loot categories. */
export function ToggleChip(props: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label
      className={cn(
        'inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[13px] capitalize select-none',
        props.checked
          ? 'border-title-to bg-title-to text-on-title'
          : 'border-control-line bg-control text-ink',
      )}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={props.checked}
        onChange={(e) => props.onChange(e.target.checked)}
      />
      {props.children}
    </label>
  );
}

/** Integer percentage input (0-100). Ignores values outside the range. */
export function PercentField(props: {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  'aria-label'?: string;
}) {
  return (
    <span className="inline-flex items-center gap-0.5">
      <input
        type="number"
        min={0}
        max={100}
        step={props.step ?? 5}
        aria-label={props['aria-label']}
        value={props.value}
        onChange={(e) => {
          const value = Number(e.target.value);
          if (Number.isFinite(value) && value >= 0 && value <= 100) props.onChange(value);
        }}
        className="w-14 rounded-control border border-control-line bg-control px-1.5 py-0.5 text-right font-mono text-[13px] tabular-nums"
      />
      %
    </span>
  );
}

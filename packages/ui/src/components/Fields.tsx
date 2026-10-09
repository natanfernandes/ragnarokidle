import { useId, type ReactNode } from 'react';
import { cn } from '../cn';

/** On/off switch. */
export function Toggle(props: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  'aria-label'?: string;
  id?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      id={props.id}
      aria-checked={props.checked}
      aria-label={props['aria-label']}
      onClick={() => props.onChange(!props.checked)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors',
        props.checked ? 'bg-success' : 'bg-line-strong',
      )}
    >
      <span
        className={cn(
          'absolute size-4 rounded-full bg-text shadow transition-[left]',
          props.checked ? 'left-[18px]' : 'left-0.5',
        )}
      />
    </button>
  );
}

/**
 * A setting row: icon and label on the left, a Toggle on the right. Inline
 * controls (such as a PercentField) go in children, after the label.
 */
export function ToggleRow(props: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn('flex items-center justify-between gap-3 text-sm', props.className)}>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {props.icon && <span className="text-text-soft">{props.icon}</span>}
        <label htmlFor={id} className="cursor-pointer">
          {props.children}
        </label>
      </div>
      <Toggle id={id} checked={props.checked} onChange={props.onChange} />
    </div>
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
    <span className="inline-flex items-center gap-1 text-text-soft">
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
        className="w-16 rounded-control border border-line bg-surface-sunken px-2 py-1 text-right text-sm text-text tabular-nums"
      />
      %
    </span>
  );
}

/** Native select with the design system look. */
export function Select<T extends string>(props: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  icon?: ReactNode;
  id?: string;
  'aria-label'?: string;
}) {
  return (
    <div className="relative flex items-center">
      {props.icon && (
        <span className="pointer-events-none absolute left-3 text-primary">{props.icon}</span>
      )}
      <select
        id={props.id}
        aria-label={props['aria-label']}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value as T)}
        className={cn(
          'w-full cursor-pointer appearance-none rounded-control border border-line bg-surface-sunken py-2 pr-9 text-sm text-text hover:border-line-strong',
          props.icon ? 'pl-9' : 'pl-3',
        )}
      >
        {props.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className="pointer-events-none absolute right-3 size-4 fill-none stroke-text-soft stroke-2"
      >
        <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/** Label above a control. */
export function Field(props: { label: ReactNode; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={props.htmlFor} className="text-xs font-medium text-text-soft">
        {props.label}
      </label>
      {props.children}
    </div>
  );
}

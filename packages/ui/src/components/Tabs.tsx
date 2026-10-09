import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '../cn';

export interface TabItem<T extends string = string> {
  id: T;
  label: ReactNode;
  /** Shows a dot on the tab, e.g. for new items. */
  badge?: boolean;
  /** Shortcut hint shown in the tab tooltip, e.g. "Alt+E". */
  hotkey?: string;
}

const VARIANTS = {
  /** Full-width segmented row with a gold underline, for panel sections. */
  underline: {
    list: 'flex border-b border-line',
    tab: 'flex-1 border-b-2 px-3 py-2 text-sm',
    on: 'border-primary bg-surface-raised font-semibold text-primary',
    off: 'border-transparent text-text-soft hover:text-text',
  },
  /** Compact pills, for filters such as log channels. */
  pill: {
    list: 'flex gap-1 rounded-control bg-surface-sunken p-1',
    tab: 'rounded-control px-3 py-1 text-[13px]',
    on: 'bg-surface-raised font-semibold text-text',
    off: 'text-text-soft hover:text-text',
  },
} as const;

/** Accessible tab list (arrow keys move between tabs). Render the panel yourself. */
export function Tabs<T extends string>(props: {
  tabs: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  variant?: keyof typeof VARIANTS;
  'aria-label'?: string;
  className?: string;
}) {
  const style = VARIANTS[props.variant ?? 'underline'];
  const listRef = useRef<HTMLDivElement>(null);
  const index = props.tabs.findIndex((t) => t.id === props.value);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = props.tabs[(index + step + props.tabs.length) % props.tabs.length];
    if (!next) return;
    props.onChange(next.id);
    listRef.current?.querySelector<HTMLElement>(`[data-tab="${next.id}"]`)?.focus();
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={props['aria-label']}
      onKeyDown={onKeyDown}
      className={cn(style.list, props.className)}
    >
      {props.tabs.map((tab) => {
        const selected = tab.id === props.value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            data-tab={tab.id}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            title={tab.hotkey}
            onClick={() => props.onChange(tab.id)}
            className={cn('relative cursor-pointer', style.tab, selected ? style.on : style.off)}
          >
            {tab.label}
            {tab.badge && (
              <span
                aria-label="new"
                className="absolute top-1 right-1 size-2 rounded-full bg-primary"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

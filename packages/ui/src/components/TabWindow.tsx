import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '../cn';

export interface TabItem<T extends string = string> {
  id: T;
  label: ReactNode;
  /** Shows a dot on the tab, e.g. for new items. */
  badge?: boolean;
  /** Shortcut hint shown in the tab tooltip, e.g. "Alt+E". */
  hotkey?: string;
}

/**
 * A Window whose title bar is a row of tabs. Used for the dock: one window,
 * several panels grouped by what the player wants to do.
 */
export function TabWindow<T extends string>(props: {
  tabs: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  const baseId = useId();
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
    <section
      className={cn(
        'flex flex-col overflow-hidden rounded-window border border-window-line bg-window text-ink shadow-window',
        props.className,
      )}
    >
      <div
        ref={listRef}
        role="tablist"
        onKeyDown={onKeyDown}
        className="flex items-end gap-0.5 bg-linear-to-b from-title-from to-title-to px-1.5 pt-1.5"
      >
        {props.tabs.map((tab) => {
          const selected = tab.id === props.value;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              data-tab={tab.id}
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel`}
              tabIndex={selected ? 0 : -1}
              title={tab.hotkey}
              onClick={() => props.onChange(tab.id)}
              className={cn(
                'relative cursor-pointer rounded-t-control px-2.5 py-1 font-display text-sm tracking-wide',
                selected
                  ? 'bg-window text-ink'
                  : 'text-on-title/80 hover:bg-white/10 hover:text-on-title',
              )}
            >
              {tab.label}
              {tab.badge && (
                <span
                  aria-label="new"
                  className="absolute top-0.5 right-0.5 size-2 rounded-full bg-card"
                />
              )}
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id={`${baseId}-panel`}
        aria-labelledby={`${baseId}-tab-${props.value}`}
        className={cn('flex min-h-0 flex-col gap-2 px-3 pt-2.5 pb-3', props.bodyClassName)}
      >
        {props.children}
      </div>
    </section>
  );
}

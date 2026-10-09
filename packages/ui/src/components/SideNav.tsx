import type { ReactNode } from 'react';
import { cn } from '../cn';

export interface NavItem<T extends string = string> {
  id: T;
  label: ReactNode;
  icon?: ReactNode;
  badge?: boolean;
  /** Shortcut hint shown in the tooltip, e.g. "Alt+E". */
  hotkey?: string;
}

/** Vertical navigation for wide screens. The active item is filled with gold. */
export function SideNav<T extends string>(props: {
  items: NavItem<T>[];
  value: T;
  onSelect: (id: T) => void;
  'aria-label'?: string;
}) {
  return (
    <nav aria-label={props['aria-label']}>
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {props.items.map((item) => {
          const active = item.id === props.value;
          return (
            <li key={item.id}>
              <button
                type="button"
                aria-current={active ? 'page' : undefined}
                title={item.hotkey}
                onClick={() => props.onSelect(item.id)}
                className={cn(
                  'relative flex w-full cursor-pointer items-center gap-3 rounded-control px-3.5 py-2.5 text-left text-[15px] transition',
                  active
                    ? 'bg-linear-to-r from-primary to-primary-deep font-semibold text-on-primary shadow-primary'
                    : 'text-text-soft hover:bg-surface hover:text-text',
                )}
              >
                {item.icon && <span className="shrink-0">{item.icon}</span>}
                {item.label}
                {item.badge && (
                  <span
                    aria-label="new"
                    className={cn(
                      'ml-auto size-2 rounded-full',
                      active ? 'bg-on-primary' : 'bg-primary',
                    )}
                  />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

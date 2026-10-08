import type { ReactNode } from 'react';
import { cn } from '../cn';

export interface NavItem<T extends string = string> {
  id: T;
  label: ReactNode;
  badge?: boolean;
}

/** Phone navigation fixed to the bottom of the screen. */
export function BottomNav<T extends string>(props: {
  items: NavItem<T>[];
  value: T | null;
  onSelect: (id: T) => void;
  className?: string;
}) {
  return (
    <nav
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-window-line bg-window pb-[env(safe-area-inset-bottom,0px)] shadow-window',
        props.className,
      )}
    >
      <ul
        className="m-0 grid list-none p-0"
        style={{ gridTemplateColumns: `repeat(${props.items.length}, minmax(0, 1fr))` }}
      >
        {props.items.map((item) => {
          const active = item.id === props.value;
          return (
            <li key={item.id}>
              <button
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => props.onSelect(item.id)}
                className={cn(
                  'relative h-11 w-full cursor-pointer font-display text-sm tracking-wide',
                  active ? 'bg-title-to text-on-title' : 'text-ink-soft hover:text-ink',
                )}
              >
                {item.label}
                {item.badge && (
                  <span
                    aria-label="new"
                    className="absolute top-1.5 right-[22%] size-2 rounded-full bg-card"
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

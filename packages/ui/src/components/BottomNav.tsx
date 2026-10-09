import { cn } from '../cn';
import type { NavItem } from './SideNav';

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
        'fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg-deep pb-[env(safe-area-inset-bottom,0px)]',
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
                  'relative flex h-14 w-full cursor-pointer flex-col items-center justify-center gap-0.5 text-[11px]',
                  active ? 'text-primary' : 'text-text-soft hover:text-text',
                )}
              >
                {item.icon}
                {item.label}
                {item.badge && (
                  <span
                    aria-label="new"
                    className="absolute top-2 right-[30%] size-2 rounded-full bg-primary"
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

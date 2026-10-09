import type { ReactNode } from 'react';
import { cn } from '../cn';

/**
 * The basic building block of the game screen: a dark surface with an
 * optional header (icon, title, actions). Every panel on screen is a Panel.
 */
export function Panel(props: {
  title?: ReactNode;
  icon?: ReactNode;
  /** Controls aligned to the right of the header. */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        'flex min-w-0 flex-col rounded-panel border border-line bg-surface text-text shadow-panel',
        props.className,
      )}
    >
      {props.title && (
        <header className="flex items-center justify-between gap-3 px-4 pt-3.5 pb-1">
          <h2 className="m-0 flex min-w-0 items-center gap-2 text-[15px] font-semibold">
            {props.icon && <span className="shrink-0 text-text-soft">{props.icon}</span>}
            <span className="truncate">{props.title}</span>
          </h2>
          {props.actions && <div className="flex shrink-0 items-center gap-2">{props.actions}</div>}
        </header>
      )}
      <div className={cn('flex min-h-0 flex-col gap-3 px-4 pt-2 pb-4', props.bodyClassName)}>
        {props.children}
      </div>
    </section>
  );
}

/** Small heading that separates groups or labels a field inside a Panel. */
export function SectionLabel(props: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn('m-0 text-xs font-medium text-text-soft', props.className)}>
      {props.children}
    </h3>
  );
}

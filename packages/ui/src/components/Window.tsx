import type { ReactNode } from 'react';
import { cn } from '../cn';

/**
 * The basic building block of the game screen: a Ragnarok Online style window
 * with a gradient title bar. Every panel should be a Window.
 */
export function Window(props: {
  title: ReactNode;
  /** Secondary text next to the title, e.g. class and level. */
  subtitle?: ReactNode;
  /** Controls aligned to the right of the title bar. */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        'flex flex-col overflow-hidden rounded-window border border-window-line bg-window text-ink shadow-window',
        props.className,
      )}
    >
      <header className="flex items-center justify-between gap-3 bg-linear-to-b from-title-from to-title-to px-3 py-1.5 text-on-title">
        <h2 className="m-0 min-w-0 truncate font-display text-[15px] font-medium tracking-wide">
          {props.title}
          {props.subtitle && (
            <small className="ml-2 font-sans text-xs font-normal opacity-85">
              {props.subtitle}
            </small>
          )}
        </h2>
        {props.actions && <div className="flex shrink-0 items-center gap-2">{props.actions}</div>}
      </header>
      <div className={cn('flex min-h-0 flex-col gap-2 px-3 pt-2.5 pb-3', props.bodyClassName)}>
        {props.children}
      </div>
    </section>
  );
}

/** Small uppercase heading that separates groups inside a Window. */
export function SectionLabel(props: { children: ReactNode; className?: string }) {
  return (
    <h3
      className={cn(
        'mt-2 mb-0 text-[11px] font-extrabold tracking-wider text-ink-soft uppercase',
        props.className,
      )}
    >
      {props.children}
    </h3>
  );
}

import { useEffect, type ReactNode } from 'react';
import { cn } from '../cn';

/**
 * Phone panel that rises from the bottom, above the BottomNav. It stops at
 * 60% of the screen so the combat stage stays visible. Escape closes it.
 */
export function Sheet(props: {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  const { onClose } = props;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <section
      role="dialog"
      aria-label={typeof props.title === 'string' ? props.title : undefined}
      className={cn(
        'fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] z-30 flex max-h-[60vh] flex-col overflow-hidden rounded-t-panel border border-line bg-surface text-text shadow-panel',
        props.className,
      )}
    >
      <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
        <h2 className="m-0 text-[15px] font-semibold">{props.title}</h2>
        <button
          type="button"
          aria-label="Close"
          onClick={props.onClose}
          className="cursor-pointer rounded-control px-2 text-lg leading-none text-text-soft hover:bg-surface-raised hover:text-text"
        >
          ×
        </button>
      </header>
      <div className="flex min-h-0 flex-col gap-3 overflow-y-auto px-4 pt-3 pb-4">
        {props.children}
      </div>
    </section>
  );
}

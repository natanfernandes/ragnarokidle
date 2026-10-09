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
        'fixed inset-x-0 bottom-[calc(2.75rem+env(safe-area-inset-bottom,0px))] z-30 flex max-h-[60vh] flex-col overflow-hidden rounded-t-window border border-window-line bg-window text-ink shadow-window',
        props.className,
      )}
    >
      <header className="flex items-center justify-between gap-3 bg-linear-to-b from-title-from to-title-to px-3 py-1.5 text-on-title">
        <h2 className="m-0 font-display text-[15px] font-medium tracking-wide">{props.title}</h2>
        <button
          type="button"
          aria-label="Close"
          onClick={props.onClose}
          className="cursor-pointer rounded-control px-1.5 text-lg leading-none hover:bg-white/15"
        >
          ×
        </button>
      </header>
      <div className="flex min-h-0 flex-col gap-2 overflow-y-auto px-3 pt-2.5 pb-3">
        {props.children}
      </div>
    </section>
  );
}

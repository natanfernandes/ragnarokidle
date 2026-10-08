import { useEffect, useRef, type ReactNode } from 'react';
import { Window } from './Window';

/** Modal Window. Closes on Escape or a click on the backdrop. */
export function Dialog(props: {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { onClose } = props;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    ref.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
      onClick={props.onClose}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className="w-full max-w-sm outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <Window title={props.title}>
          {props.children}
          {props.footer && <div className="mt-2 flex justify-end gap-2">{props.footer}</div>}
        </Window>
      </div>
    </div>
  );
}

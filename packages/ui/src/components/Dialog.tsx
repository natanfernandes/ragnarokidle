import { useEffect, useRef, type ReactNode } from 'react';
import { Panel } from './Panel';

/** Modal Panel. Closes on Escape or a click on the backdrop. */
export function Dialog(props: {
  title: ReactNode;
  icon?: ReactNode;
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
      className="fixed inset-0 z-50 grid place-items-center bg-bg-deep/75 p-4 backdrop-blur-sm"
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
        <Panel title={props.title} icon={props.icon}>
          {props.children}
          {props.footer && <div className="mt-1 flex justify-end gap-2">{props.footer}</div>}
        </Panel>
      </div>
    </div>
  );
}

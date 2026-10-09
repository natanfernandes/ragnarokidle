import type { ReactNode } from 'react';
import { cn } from '../cn';

/** Inline error message, announced to screen readers. */
export function Alert(props: { children: ReactNode; className?: string }) {
  return (
    <div
      role="alert"
      className={cn(
        'rounded-control border border-danger/40 bg-danger/15 px-3 py-2 text-sm text-danger',
        props.className,
      )}
    >
      {props.children}
    </div>
  );
}

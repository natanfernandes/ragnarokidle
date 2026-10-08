import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../cn';

const VARIANTS = {
  default:
    'border-control-line bg-linear-to-b from-control to-control-shade text-ink hover:to-control-hover',
  primary:
    'border-title-to bg-linear-to-b from-title-from to-title-to text-on-title hover:brightness-110',
} as const;

export function Button({
  variant = 'default',
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof VARIANTS }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-control border px-3 py-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant],
        className,
      )}
      {...rest}
    />
  );
}

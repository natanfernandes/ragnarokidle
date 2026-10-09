import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../cn';

const VARIANTS = {
  primary:
    'border-primary-deep bg-linear-to-b from-primary-strong to-primary text-on-primary shadow-primary hover:brightness-105',
  secondary:
    'border-line-strong bg-surface-sunken text-text hover:border-primary hover:text-primary',
  ghost: 'border-transparent bg-transparent text-text-soft hover:bg-surface-raised hover:text-text',
} as const;

const SIZES = {
  sm: 'px-2.5 py-1 text-[13px]',
  md: 'px-4 py-2 text-sm',
  icon: 'size-9 p-0',
} as const;

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
}) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-2 rounded-control border font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    />
  );
}

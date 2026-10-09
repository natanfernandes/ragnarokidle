/** 950 -> "950", 1234 -> "1.2k", 2_500_000 -> "2.5M". */
export function compact(value: number): string {
  if (Math.abs(value) < 1000) return Math.round(value).toLocaleString('en-US');
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

/** 1234567 -> "1,234,567". */
export const full = (value: number) => value.toLocaleString('en-US');

/** Milliseconds as "02:34:12". */
export function clock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const parts = [Math.floor(total / 3600), Math.floor(total / 60) % 60, total % 60];
  return parts.map((n) => String(n).padStart(2, '0')).join(':');
}

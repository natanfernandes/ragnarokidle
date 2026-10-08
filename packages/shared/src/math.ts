export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function percent(value: number, max: number): number {
  return max <= 0 ? 0 : (value / max) * 100;
}

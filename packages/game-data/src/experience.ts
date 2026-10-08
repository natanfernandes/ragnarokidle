export const MAX_LEVEL = 99;

/**
 * Experience required to go from `level` to `level + 1`.
 * Placeholder curve; to be tuned with the balance simulator.
 */
export const experienceTable: readonly number[] = Array.from({ length: MAX_LEVEL }, (_, i) =>
  Math.round(30 * Math.pow(1.3, i)),
);

export function experienceToNextLevel(level: number): number {
  if (level >= MAX_LEVEL) return Infinity;
  return experienceTable[level - 1] ?? Infinity;
}

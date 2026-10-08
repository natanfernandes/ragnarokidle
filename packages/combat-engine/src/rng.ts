/**
 * Small, fast, seedable PRNG (mulberry32). The whole state is a single
 * 32-bit integer so it can be stored inside CombatState and persisted.
 */
export class SeededRng {
  constructor(public state: number) {
    this.state = state >>> 0;
  }

  /** Uniform float in [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Uniform integer in [min, max], inclusive. */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** Uniform float in [min, max). */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** True with probability `p`. */
  chance(p: number): boolean {
    return this.next() < p;
  }

  pickWeighted<T extends { weight: number }>(entries: readonly T[]): T {
    const total = entries.reduce((sum, e) => sum + e.weight, 0);
    let roll = this.next() * total;
    for (const entry of entries) {
      roll -= entry.weight;
      if (roll < 0) return entry;
    }
    const last = entries[entries.length - 1];
    if (!last) throw new Error('pickWeighted called with no entries');
    return last;
  }
}

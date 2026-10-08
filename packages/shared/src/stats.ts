export const STAT_KEYS = ['str', 'agi', 'vit', 'int', 'dex', 'luk'] as const;

export type StatKey = (typeof STAT_KEYS)[number];

/** Primary stats allocated by the player. */
export type Stats = Record<StatKey, number>;

/** Stats derived from primary stats, level, class and equipment. */
export interface DerivedStats {
  maxHp: number;
  maxSp: number;
  atk: number;
  matk: number;
  def: number;
  mdef: number;
  hit: number;
  flee: number;
  /** Critical chance in percent (0-100). */
  crit: number;
  attackIntervalMs: number;
}

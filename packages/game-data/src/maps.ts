import type { MapDefinition } from '@ragidle/shared';

export const pronteraField: MapDefinition = {
  id: 'prontera_field',
  name: 'Prontera Field',
  monsters: [
    { monsterId: 'poring', weight: 50 },
    { monsterId: 'fabre', weight: 30 },
    { monsterId: 'lunatic', weight: 20 },
  ],
  encounterIntervalMs: { min: 800, max: 1500 },
};

/** Development map that only spawns Porings (first sprint target). */
export const poringField: MapDefinition = {
  id: 'poring_field',
  name: 'Poring Meadow',
  monsters: [{ monsterId: 'poring', weight: 1 }],
  encounterIntervalMs: { min: 800, max: 1500 },
};

export const maps: Record<string, MapDefinition> = {
  [pronteraField.id]: pronteraField,
  [poringField.id]: poringField,
};

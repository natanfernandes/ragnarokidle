import { describe, expect, it } from 'vitest';
import { parseClientMessage } from './index';

describe('parseClientMessage', () => {
  it('accepts a valid combat.start', () => {
    const result = parseClientMessage(
      JSON.stringify({ type: 'combat.start', mapId: 'prontera_field' }),
    );
    expect(result).toEqual({
      ok: true,
      message: { type: 'combat.start', mapId: 'prontera_field' },
    });
  });

  it('rejects invalid JSON', () => {
    expect(parseClientMessage('{nope').ok).toBe(false);
  });

  it('rejects unknown message types', () => {
    expect(parseClientMessage(JSON.stringify({ type: 'combat.win' })).ok).toBe(false);
  });

  it('rejects out-of-range potion thresholds', () => {
    const config = {
      targetMode: 'nearest',
      skills: [],
      potions: {
        hp: { itemId: 'red_potion', enabled: true, belowPercent: 150 },
        sp: { itemId: 'blue_potion', enabled: false, belowPercent: 10 },
      },
      loot: { pickupCategories: [], alwaysPickup: [], ignore: [] },
    };
    expect(parseClientMessage(JSON.stringify({ type: 'combat.config.update', config })).ok).toBe(
      false,
    );
  });
});

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { advanceCombat, createCharacter, createCombatState } from '@ragidle/combat-engine';
import { createTestDatabase } from '../db/test-database';
import { PostgresCharacterRepository } from './postgres-character-repository';

let database: Awaited<ReturnType<typeof createTestDatabase>>;
let repository: PostgresCharacterRepository;

beforeEach(async () => {
  database = await createTestDatabase();
  repository = new PostgresCharacterRepository(database.db);
});
afterEach(() => database.close());

const NOW = 1_700_000_000_000;

describe('PostgresCharacterRepository', () => {
  it('returns null for unknown characters', async () => {
    expect(await repository.load('nobody')).toBeNull();
  });

  it('round-trips a character exactly', async () => {
    const character = createCharacter({ id: 'c1', name: 'Tester', now: NOW });
    character.zeny = 9_007_199_254; // beyond 32-bit, stored as bigint
    character.appearance = { gender: 'female', hairStyle: 7, hairColor: 3, clothesColor: -1 };
    await repository.save({ character, combat: null });
    expect(await repository.load('c1')).toEqual({ character, combat: null });
  });

  it('round-trips a running fight and replays it identically', async () => {
    const character = createCharacter({ id: 'c2', name: 'Fighter', now: NOW });
    const start = createCombatState({ character, mapId: 'poring_field', startAt: NOW, seed: 9 });
    const { state: combat } = advanceCombat(start, NOW + 60_000);
    await repository.save({ character: combat.character, combat });

    const loaded = await repository.load('c2');
    expect(loaded).toEqual({ character: combat.character, combat });
    // Same state in, same fights out: a restart cannot change or duplicate rewards.
    const later = NOW + 10 * 60_000;
    expect(advanceCombat(loaded!.combat!, later)).toEqual(advanceCombat(combat, later));
  });

  it('replaces inventory and equipment and clears a finished fight', async () => {
    const character = createCharacter({ id: 'c3', name: 'Trader', now: NOW });
    const combat = createCombatState({ character, mapId: 'poring_field', startAt: NOW, seed: 1 });
    await repository.save({ character, combat });

    const changed = structuredClone(character);
    delete changed.inventory.blue_potion;
    changed.inventory.jellopy = 4;
    changed.equipment = { weapon: 'sword' };
    await repository.save({ character: changed, combat: null });

    expect(await repository.load('c3')).toEqual({ character: changed, combat: null });
  });
});

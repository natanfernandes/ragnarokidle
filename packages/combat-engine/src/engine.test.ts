import { describe, expect, it } from 'vitest';
import type { CharacterState, CombatEvent, DamageEvent, MonsterDefinition } from '@ragidle/shared';
import { PLAYER_ACTOR_ID } from '@ragidle/shared';
import { type GameData, gameData } from '@ragidle/game-data';
import {
  advanceCombat,
  createCharacter,
  createCombatState,
  deriveStats,
  nextScheduledAt,
  physicalDamage,
  simulateCombat,
  withCombatConfig,
} from './index';

const START = 1_000_000;

function swordman(overrides: Partial<CharacterState> = {}): CharacterState {
  return { ...createCharacter({ id: 'c1', name: 'Tester', now: START }), ...overrides };
}

function withoutSkills(character: CharacterState): CharacterState {
  return {
    ...character,
    combatConfig: {
      ...character.combatConfig,
      skills: character.combatConfig.skills.map((s) => ({ ...s, enabled: false })),
    },
  };
}

/** Game data with a single map that only spawns the given monster. */
function dataWithOnly(monster: MonsterDefinition): GameData {
  return {
    ...gameData,
    monsters: { ...gameData.monsters, [monster.id]: monster },
    maps: {
      ...gameData.maps,
      arena: {
        id: 'arena',
        name: 'Arena',
        monsters: [{ monsterId: monster.id, weight: 1 }],
        encounterIntervalMs: { min: 1000, max: 1000 },
      },
    },
  };
}

const ofType = <T extends CombatEvent['type']>(events: CombatEvent[], type: T) =>
  events.filter((e): e is Extract<CombatEvent, { type: T }> => e.type === type);

describe('formulas', () => {
  it('STR increases ATK', () => {
    const weak = swordman();
    const strong = swordman({ baseStats: { ...weak.baseStats, str: weak.baseStats.str + 10 } });
    expect(deriveStats(strong).atk - deriveStats(weak).atk).toBe(20);
  });

  it('DEF reduces damage but never below 1', () => {
    const base = { attack: 50, multiplier: 1, flatBonus: 0, roll: 1, critical: false };
    expect(physicalDamage({ ...base, defense: 0 })).toBe(50);
    expect(physicalDamage({ ...base, defense: 20 })).toBe(30);
    expect(physicalDamage({ ...base, defense: 500 })).toBe(1);
  });

  it('critical hits deal more damage and ignore DEF', () => {
    const base = { attack: 50, multiplier: 1, flatBonus: 0, roll: 1, defense: 20 };
    expect(physicalDamage({ ...base, critical: true })).toBe(70);
    expect(physicalDamage({ ...base, critical: true })).toBeGreaterThan(
      physicalDamage({ ...base, critical: false }),
    );
  });
});

describe('combat simulation', () => {
  it('a Swordman kills a Poring deterministically', () => {
    const run = () =>
      simulateCombat({
        character: swordman(),
        mapId: 'poring_field',
        durationMs: 10_000,
        seed: 42,
      });
    const first = run();
    const second = run();

    expect(first.events).toEqual(second.events);
    expect(first.finalState).toEqual(second.finalState);

    const kills = ofType(first.events, 'monster_death');
    expect(kills.length).toBeGreaterThan(0);
    expect(kills.every((k) => k.monsterId === 'poring')).toBe(true);
    expect(first.statistics.experienceGained).toBe(kills.length * 10);
    expect(first.statistics.zenyGained).toBeGreaterThanOrEqual(kills.length * 1);
    expect(first.statistics.zenyGained).toBeLessThanOrEqual(kills.length * 3);
  });

  it('produces exact, reproducible results for a fixed seed', () => {
    const result = simulateCombat({
      character: swordman(),
      mapId: 'poring_field',
      durationMs: 60_000,
      seed: 1234,
    });
    expect({
      kills: result.statistics.kills,
      xp: result.rewards.experience,
      zeny: result.rewards.zeny,
      items: result.rewards.items,
      level: result.finalState.character.level,
      hp: result.finalState.character.hp,
      events: result.events.length,
    }).toMatchInlineSnapshot(`
      {
        "events": 239,
        "hp": 140,
        "items": {
          "apple": 1,
          "jellopy": 17,
        },
        "kills": 23,
        "level": 5,
        "xp": 230,
        "zeny": 59,
      }
    `);
  });

  it('different seeds produce different fights', () => {
    const a = simulateCombat({ character: swordman(), durationMs: 30_000, seed: 1 });
    const b = simulateCombat({ character: swordman(), durationMs: 30_000, seed: 2 });
    expect(a.events).not.toEqual(b.events);
  });

  it('follows the sprint loop: attack, damage, death, XP, Zeny, Jellopy, respawn', () => {
    // Guarantee a Jellopy drop to make the sequence deterministic to assert on.
    const poring = gameData.monsters.poring!;
    const data = dataWithOnly({
      ...poring,
      id: 'test_poring',
      drops: [{ itemId: 'jellopy', chance: 1, minQuantity: 1, maxQuantity: 1 }],
    });
    const { events } = simulateCombat({
      character: swordman(),
      mapId: 'arena',
      durationMs: 20_000,
      seed: 7,
      data,
    });
    const types = events.map((e) => e.type);
    const firstDeath = types.indexOf('monster_death');
    expect(types[0]).toBe('monster_spawn');
    expect(types.slice(firstDeath, firstDeath + 4)).toEqual([
      'monster_death',
      'experience',
      'zeny',
      'loot',
    ]);
    expect(ofType(events, 'loot')[0]).toMatchObject({ itemId: 'jellopy', pickedUp: true });
    expect(types.indexOf('monster_spawn', firstDeath)).toBeGreaterThan(firstDeath);
  });

  it('monsters attack back', () => {
    const { events } = simulateCombat({
      character: withoutSkills(swordman()),
      durationMs: 60_000,
      seed: 3,
    });
    const hits = ofType(events, 'damage').filter((e) => e.targetId === PLAYER_ACTOR_ID);
    expect(hits.length).toBeGreaterThan(0);
  });

  it('a Swordman dies to a much stronger monster and respawns', () => {
    const data = dataWithOnly({
      ...gameData.monsters.poring!,
      id: 'angry',
      hp: 100_000,
      attack: 400,
      hit: 200,
    });
    const { events, statistics } = simulateCombat({
      character: swordman(),
      mapId: 'arena',
      durationMs: 30_000,
      seed: 5,
      data,
    });
    expect(statistics.deaths).toBeGreaterThan(0);
    const death = ofType(events, 'player_death')[0]!;
    const respawn = ofType(events, 'player_respawn')[0]!;
    expect(respawn.timestamp).toBe(death.respawnAt);
  });

  it('levels up and restores HP/SP', () => {
    const { events, finalState } = simulateCombat({
      character: swordman(),
      durationMs: 10 * 60_000,
      seed: 9,
    });
    const levelUps = ofType(events, 'level_up');
    expect(levelUps.length).toBeGreaterThan(0);
    expect(finalState.character.level).toBe(1 + levelUps.length);
  });
});

describe('combat strategy', () => {
  it('Bash consumes SP and deals more damage than basic attacks', () => {
    const { events } = simulateCombat({ character: swordman(), durationMs: 60_000, seed: 11 });
    const casts = ofType(events, 'skill_cast');
    expect(casts.length).toBeGreaterThan(0);
    expect(casts[0]).toMatchObject({ skillId: 'bash', spCost: 8 });

    const playerHits = ofType(events, 'damage').filter((e) => e.attackerId === PLAYER_ACTOR_ID);
    const avg = (xs: DamageEvent[]) => xs.reduce((s, e) => s + e.amount, 0) / xs.length;
    const bash = playerHits.filter((e) => e.skillId === 'bash');
    const basic = playerHits.filter((e) => !e.skillId && !e.critical);
    expect(avg(bash)).toBeGreaterThan(avg(basic) * 1.5);
  });

  it('respects the Bash minimum SP condition', () => {
    const character = swordman();
    const config = structuredClone(character.combatConfig);
    config.skills[0]!.conditions = { minSpPercent: 50 };
    const { events } = simulateCombat({ character, config, durationMs: 60_000, seed: 12 });
    expect(ofType(events, 'skill_cast').length).toBeGreaterThan(0);
    // maxSp grows on level up, so track it through the event stream.
    let maxSp = deriveStats(character).maxSp;
    for (const event of events) {
      if (event.type === 'level_up') maxSp = event.maxSp;
      if (event.type !== 'skill_cast') continue;
      const cast = event;
      // SP before the cast must have been at least 50% of max.
      expect(((cast.sp + cast.spCost) / maxSp) * 100).toBeGreaterThanOrEqual(50);
    }
  });

  it('never casts disabled skills', () => {
    const { events } = simulateCombat({
      character: withoutSkills(swordman()),
      durationMs: 60_000,
      seed: 13,
    });
    expect(ofType(events, 'skill_cast')).toHaveLength(0);
  });

  it('uses a Red Potion when HP drops below the threshold', () => {
    const data = dataWithOnly({
      ...gameData.monsters.poring!,
      id: 'tough',
      hp: 5_000,
      attack: 25,
      hit: 200,
    });
    const character = swordman();
    const { events } = simulateCombat({
      character,
      mapId: 'arena',
      durationMs: 60_000,
      seed: 21,
      data,
    });
    const potions = ofType(events, 'potion_used');
    expect(potions.length).toBeGreaterThan(0);

    const maxHp = deriveStats(character).maxHp;
    for (const potion of potions) {
      expect(potion.itemId).toBe('red_potion');
      expect(((potion.hp - potion.restoredHp) / maxHp) * 100).toBeLessThan(40);
    }
  });

  it('potions prevent death', () => {
    const data = dataWithOnly({
      ...gameData.monsters.poring!,
      id: 'tough',
      hp: 3_000,
      attack: 22,
      hit: 200,
    });
    const noPotions = swordman();
    noPotions.combatConfig.potions.hp.enabled = false;
    const withPotions = swordman();
    withPotions.inventory.red_potion = 100;

    const run = (character: CharacterState) =>
      simulateCombat({ character, mapId: 'arena', durationMs: 60_000, seed: 33, data }).statistics
        .deaths;
    expect(run(noPotions)).toBeGreaterThan(0);
    expect(run(withPotions)).toBe(0);
  });

  it('applies the loot filter', () => {
    const character = swordman();
    character.combatConfig.loot = {
      pickupCategories: ['consumable'],
      alwaysPickup: ['fluff'],
      ignore: ['apple'],
    };
    const { events, finalState } = simulateCombat({ character, durationMs: 10 * 60_000, seed: 44 });
    const loot = ofType(events, 'loot');
    for (const drop of loot) {
      const expected =
        drop.itemId === 'fluff' ||
        (drop.itemId !== 'apple' && gameData.items[drop.itemId]!.category === 'consumable');
      expect(drop.pickedUp, drop.itemId).toBe(expected);
    }
    expect(finalState.character.inventory.jellopy).toBeUndefined();
    expect(finalState.character.inventory.apple).toBeUndefined();
    expect(finalState.character.inventory.fluff).toBeGreaterThan(0);
  });
});

describe('incremental advancement', () => {
  it('advancing in many small steps equals advancing in one step', () => {
    const initial = createCombatState({ character: swordman(), startAt: START, seed: 99 });
    const oneShot = advanceCombat(initial, START + 120_000);

    let state = initial;
    const events: CombatEvent[] = [];
    for (let t = START; t <= START + 120_000; t += 337) {
      const step = advanceCombat(state, t);
      state = step.state;
      events.push(...step.events);
    }
    const tail = advanceCombat(state, START + 120_000);
    events.push(...tail.events);

    expect(events).toEqual(oneShot.events);
    expect(tail.state).toEqual(oneShot.state);
  });

  it('does not mutate the input state', () => {
    const initial = createCombatState({ character: swordman(), startAt: START, seed: 1 });
    const snapshot = structuredClone(initial);
    advanceCombat(initial, START + 30_000);
    expect(initial).toEqual(snapshot);
  });

  it('reports the next scheduled action', () => {
    const initial = createCombatState({ character: swordman(), startAt: START, seed: 1 });
    expect(nextScheduledAt(initial)).toBe(START);
    const { state } = advanceCombat(initial, START);
    expect(nextScheduledAt(state)).toBeGreaterThan(START);
  });

  it('applies configuration changes from the moment they are made', () => {
    const initial = createCombatState({ character: swordman(), startAt: START, seed: 5 });
    const first = advanceCombat(initial, START + 30_000);
    const disabled = withCombatConfig(
      first.state,
      withoutSkills(first.state.character).combatConfig,
    );
    const second = advanceCombat(disabled, START + 60_000);
    expect(ofType(second.events, 'skill_cast')).toHaveLength(0);
  });
});

describe('invariants', () => {
  it.each([1, 2, 3, 4, 5, 6, 7, 8])('holds for seed %i', (seed) => {
    const character = swordman();
    const { events, finalState } = simulateCombat({ character, durationMs: 15 * 60_000, seed });
    let lastTimestamp = -Infinity;
    let level = 1;
    let maxHp = deriveStats(character).maxHp;
    for (const event of events) {
      expect(event.timestamp).toBeGreaterThanOrEqual(lastTimestamp);
      lastTimestamp = event.timestamp;
      if (event.type === 'level_up') {
        level = event.level;
        maxHp = event.maxHp;
      }
      if (event.type === 'damage') {
        expect(event.amount).toBeGreaterThanOrEqual(1);
        expect(event.targetHp).toBeGreaterThanOrEqual(0);
      }
      if (event.type === 'potion_used' || event.type === 'regen') {
        expect(event.hp).toBeLessThanOrEqual(maxHp);
      }
    }
    const derived = deriveStats(finalState.character);
    expect(finalState.character.level).toBe(level);
    expect(finalState.character.hp).toBeLessThanOrEqual(derived.maxHp);
    expect(finalState.character.sp).toBeLessThanOrEqual(derived.maxSp);
    expect(finalState.character.sp).toBeGreaterThanOrEqual(0);
    for (const qty of Object.values(finalState.character.inventory)) expect(qty).toBeGreaterThan(0);
  });
});

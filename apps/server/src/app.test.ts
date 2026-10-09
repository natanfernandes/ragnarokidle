import { afterEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { UNAUTHENTICATED_CLOSE_CODE } from '@ragidle/protocol';
import { buildApp } from './app';
import type { Database } from './db/database';
import { accounts } from './db/schema';
import { createTestDatabase } from './db/test-database';
import { openGame, send, settle, signUp } from './test-support';

let app: FastifyInstance | undefined;

afterEach(async () => {
  await app?.close();
  app = undefined;
});

async function startApp(clock?: () => number, database?: Database): Promise<FastifyInstance> {
  const instance = await buildApp({ config: { maxOfflineMs: 3_600_000 }, clock, database });
  await instance.ready();
  return instance;
}

describe('server', () => {
  it('serves a health endpoint', async () => {
    app = await startApp();
    const response = await app.inject({ method: 'GET', url: '/health' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: 'ok' });
  });

  it('closes game sockets that have no valid session', async () => {
    app = await startApp();
    expect(await (await openGame(app)).closed).toBe(UNAUTHENTICATED_CLOSE_CODE);
    const forged = await openGame(app, 'ragidle_session=made-up');
    expect(await forged.closed).toBe(UNAUTHENTICATED_CLOSE_CODE);
  });

  it('rejects invalid messages', async () => {
    app = await startApp();
    const { socket, inbox } = await openGame(app, await signUp(app, 'Validator'));
    await inbox.next('state.snapshot');
    send(socket, { type: 'combat.start', mapId: 42 });
    expect(await inbox.next('error')).toMatchObject({ code: 'invalid_message' });
    socket.terminate();
  });

  it('streams combat events after combat.start until a Poring dies', async () => {
    app = await startApp();
    const { socket, inbox } = await openGame(app, await signUp(app, 'Tester'));

    expect(await inbox.next('authenticated')).toMatchObject({ offlineProgress: false });
    const initial = await inbox.next('state.snapshot');
    expect(initial.character).toMatchObject({ name: 'Tester', classId: 'swordman' });
    expect(initial.combat.active).toBe(false);

    send(socket, { type: 'combat.start', mapId: 'poring_field', requestId: 'r1' });
    const started = await inbox.next('state.snapshot', (s) => s.requestId === 'r1');
    expect(started.combat.active).toBe(true);

    const spawn = await inbox.next('combat.events', (m) =>
      m.events.some((e) => e.type === 'monster_spawn'),
    );
    expect(spawn.events.find((e) => e.type === 'monster_spawn')).toMatchObject({
      monsterId: 'poring',
    });

    const death = await inbox.next('combat.events', (m) =>
      m.events.some((e) => e.type === 'monster_death'),
    );
    const types = death.events.map((e) => e.type);
    expect(types).toContain('experience');
    expect(types).toContain('zeny');

    send(socket, { type: 'combat.start', mapId: 'poring_field' });
    expect(await inbox.next('error')).toMatchObject({ code: 'invalid_state' });

    send(socket, { type: 'combat.stop', requestId: 'r2' });
    const stopped = await inbox.next('state.snapshot', (s) => s.requestId === 'r2');
    expect(stopped.combat.active).toBe(false);
    expect(stopped.character.experience + stopped.character.level).toBeGreaterThan(1);
    socket.terminate();
  });

  it('pauses free players while away and rewards VIPs without duplicates', async () => {
    const database = await createTestDatabase();
    let now = 1_000_000;
    try {
      app = await startApp(() => now, database.db);
      const free = await signUp(app, 'FreePlayer');
      const vip = await signUp(app, 'VipPlayer');
      await database.db
        .update(accounts)
        .set({ vip: true })
        .where(eq(accounts.email, 'vipplayer@example.com'));

      const startFarming = async (cookie: string) => {
        const { socket, inbox } = await openGame(app!, cookie);
        await inbox.next('state.snapshot');
        send(socket, { type: 'combat.start', mapId: 'prontera_field', requestId: 'go' });
        const before = await inbox.next('state.snapshot', (s) => s.requestId === 'go');
        socket.terminate();
        await settle();
        return before;
      };
      const freeBefore = await startFarming(free);
      const vipBefore = await startFarming(vip);

      now += 30 * 60_000; // away for 30 minutes

      const freeBack = await openGame(app, free);
      expect(await freeBack.inbox.next('authenticated')).toMatchObject({ offlineProgress: false });
      const freeAfter = await freeBack.inbox.next('state.snapshot');
      expect(freeBack.inbox.received.some((m) => m.type === 'offline.rewards')).toBe(false);
      expect(freeAfter.combat.active).toBe(true);
      expect(freeAfter.character.experience).toBe(freeBefore.character.experience);
      expect(freeAfter.character.lastSimulationAt).toBe(now);
      freeBack.socket.terminate();

      const vipBack = await openGame(app, vip);
      const { rewards } = await vipBack.inbox.next('offline.rewards');
      expect(rewards.simulatedMs).toBe(30 * 60_000);
      expect(rewards.kills).toBeGreaterThan(0);
      const vipAfter = await vipBack.inbox.next('state.snapshot');
      expect(vipAfter.character.zeny - vipBefore.character.zeny).toBe(rewards.zeny);
      vipBack.socket.terminate();
      await settle();

      // Reconnecting immediately must not grant the same rewards again.
      const again = await openGame(app, vip);
      const snapshot = await again.inbox.next('state.snapshot');
      expect(again.inbox.received.some((m) => m.type === 'offline.rewards')).toBe(false);
      expect(snapshot.character.zeny).toBe(vipAfter.character.zeny);
      again.socket.terminate();
    } finally {
      await app?.close();
      app = undefined;
      await database.close();
    }
  });

  it('equips and unequips items, mid-fight too', async () => {
    app = await startApp();
    const { socket, inbox } = await openGame(app, await signUp(app, 'Armorer'));
    const initial = await inbox.next('state.snapshot');
    expect(initial.character.equipment.weapon).toBe('knife');

    send(socket, { type: 'combat.start', mapId: 'poring_field', requestId: 'start' });
    await inbox.next('state.snapshot', (s) => s.requestId === 'start');

    send(socket, { type: 'item.unequip', slot: 'weapon', requestId: 'off' });
    const unarmed = await inbox.next('state.snapshot', (s) => s.requestId === 'off');
    expect(unarmed.combat.active).toBe(true);
    expect(unarmed.character.equipment.weapon).toBeUndefined();
    expect(unarmed.character.inventory.knife).toBe(1);
    expect(unarmed.derived.atk).toBeLessThan(initial.derived.atk);
    expect(unarmed.assets.playerAppearance).not.toBe(initial.assets.playerAppearance);

    send(socket, { type: 'item.equip', itemId: 'sword', requestId: 'sword' });
    expect(await inbox.next('error', (e) => e.requestId === 'sword')).toMatchObject({
      code: 'invalid_item',
    });

    send(socket, { type: 'item.equip', itemId: 'knife', requestId: 'on' });
    const armed = await inbox.next('state.snapshot', (s) => s.requestId === 'on');
    expect(armed.character.equipment.weapon).toBe('knife');
    expect(armed.character.inventory.knife).toBeUndefined();
    expect(armed.derived.atk).toBe(initial.derived.atk);
    socket.terminate();
  });

  it('rejects configs that reference unknown content', async () => {
    app = await startApp();
    const { socket, inbox } = await openGame(app, await signUp(app, 'Configurer'));
    const { character } = await inbox.next('state.snapshot');

    const config = structuredClone(character.combatConfig);
    config.potions.hp.itemId = 'jellopy';
    send(socket, { type: 'combat.config.update', config });
    expect(await inbox.next('error')).toMatchObject({ code: 'invalid_config' });
    socket.terminate();
  });

  it('keeps characters and running fights across server restarts', async () => {
    const database = await createTestDatabase();
    let now = 1_000_000;
    try {
      app = await startApp(() => now, database.db);
      const cookie = await signUp(app, 'Keeper');
      const first = await openGame(app, cookie);
      const { character } = await first.inbox.next('state.snapshot');
      const config = structuredClone(character.combatConfig);
      config.potions.hp.belowPercent = 25;
      send(first.socket, { type: 'combat.config.update', config, requestId: 'cfg' });
      await first.inbox.next('state.snapshot', (s) => s.requestId === 'cfg');
      send(first.socket, { type: 'combat.start', mapId: 'poring_field', requestId: 'go' });
      await first.inbox.next('state.snapshot', (s) => s.requestId === 'go');
      now += 20_000;
      first.socket.terminate();
      // Shutting down saves everything.
      await app.close();

      now += 60 * 60_000;
      app = await startApp(() => now, database.db);
      // The session survives the restart too.
      const second = await openGame(app, cookie);
      const after = await second.inbox.next('state.snapshot');
      expect(after.combat).toMatchObject({ active: true, mapId: 'poring_field' });
      expect(after.character.combatConfig.potions.hp.belowPercent).toBe(25);
      // Progress from the 20 s of play was kept.
      expect(after.character.inventory.jellopy).toBeGreaterThan(0);
      second.socket.terminate();
    } finally {
      await app?.close();
      app = undefined;
      await database.close();
    }
  });
});

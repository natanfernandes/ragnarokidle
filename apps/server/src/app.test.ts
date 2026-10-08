import { afterEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { WebSocket } from 'ws';
import type { ServerMessage } from '@ragidle/protocol';
import { buildApp } from './app';

let app: FastifyInstance | undefined;

afterEach(async () => {
  await app?.close();
  app = undefined;
});

/** Collects every server message and lets tests wait for a specific one. */
function messages(socket: WebSocket) {
  const received: ServerMessage[] = [];
  const waiters: {
    predicate: (m: ServerMessage) => boolean;
    resolve: (m: ServerMessage) => void;
  }[] = [];
  socket.on('message', (data) => {
    const message = JSON.parse(data.toString()) as ServerMessage;
    received.push(message);
    for (const waiter of [...waiters]) {
      if (waiter.predicate(message)) {
        waiters.splice(waiters.indexOf(waiter), 1);
        waiter.resolve(message);
      }
    }
  });
  return {
    received,
    next<T extends ServerMessage['type']>(
      type: T,
      predicate: (m: Extract<ServerMessage, { type: T }>) => boolean = () => true,
    ): Promise<Extract<ServerMessage, { type: T }>> {
      const existing = received.find(
        (m): m is Extract<ServerMessage, { type: T }> => m.type === type && predicate(m as never),
      );
      if (existing) return Promise.resolve(existing);
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error(`Timed out waiting for ${type}`)), 5000);
        waiters.push({
          predicate: (m) => m.type === type && predicate(m as never),
          resolve: (m) => {
            clearTimeout(timeout);
            resolve(m as never);
          },
        });
      });
    },
  };
}

async function startApp(clock?: () => number): Promise<FastifyInstance> {
  const instance = await buildApp({ config: { maxOfflineMs: 3_600_000 }, clock });
  await instance.ready();
  return instance;
}

const send = (socket: WebSocket, message: object) => socket.send(JSON.stringify(message));

describe('server', () => {
  it('serves a health endpoint', async () => {
    app = await startApp();
    const response = await app.inject({ method: 'GET', url: '/health' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: 'ok' });
  });

  it('rejects commands before authentication and invalid messages', async () => {
    app = await startApp();
    const socket = await app.injectWS('/game');
    const inbox = messages(socket);

    send(socket, { type: 'combat.start', mapId: 'prontera_field' });
    expect(await inbox.next('error')).toMatchObject({ code: 'unauthenticated' });

    send(socket, { type: 'combat.start', mapId: 42 });
    expect(await inbox.next('error', (e) => e.code === 'invalid_message')).toBeDefined();

    send(socket, { type: 'authenticate', token: 'not-a-dev-token' });
    expect(inbox.received.filter((m) => m.type === 'authenticated')).toHaveLength(0);
    socket.terminate();
  });

  it('streams combat events after combat.start until a Poring dies', async () => {
    app = await startApp();
    const socket = await app.injectWS('/game');
    const inbox = messages(socket);

    send(socket, { type: 'authenticate', token: 'dev:tester' });
    await inbox.next('authenticated');
    const initial = await inbox.next('state.snapshot');
    expect(initial.character.classId).toBe('swordman');
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

  it('grants offline rewards on reconnect without duplicating them', async () => {
    let now = 1_000_000;
    app = await startApp(() => now);

    const first = await app.injectWS('/game');
    const firstInbox = messages(first);
    send(first, { type: 'authenticate', token: 'dev:sleeper' });
    await firstInbox.next('state.snapshot');
    send(first, { type: 'combat.start', mapId: 'prontera_field', requestId: 'start' });
    const before = await firstInbox.next('state.snapshot', (s) => s.requestId === 'start');
    first.terminate();
    await new Promise((resolve) => setTimeout(resolve, 20));

    now += 30 * 60_000; // away for 30 minutes

    const second = await app.injectWS('/game');
    const secondInbox = messages(second);
    send(second, { type: 'authenticate', token: 'dev:sleeper' });
    const { rewards } = await secondInbox.next('offline.rewards');
    expect(rewards.simulatedMs).toBe(30 * 60_000);
    expect(rewards.kills).toBeGreaterThan(0);
    expect(rewards.experience).toBeGreaterThan(0);
    const after = await secondInbox.next('state.snapshot');
    expect(after.character.zeny - before.character.zeny).toBe(rewards.zeny);
    second.terminate();
    await new Promise((resolve) => setTimeout(resolve, 20));

    // Reconnecting immediately must not grant the same rewards again.
    const third = await app.injectWS('/game');
    const thirdInbox = messages(third);
    send(third, { type: 'authenticate', token: 'dev:sleeper' });
    const again = await thirdInbox.next('state.snapshot');
    expect(thirdInbox.received.some((m) => m.type === 'offline.rewards')).toBe(false);
    expect(again.character.zeny).toBe(after.character.zeny);
    third.terminate();
  });

  it('rejects configs that reference unknown content', async () => {
    app = await startApp();
    const socket = await app.injectWS('/game');
    const inbox = messages(socket);
    send(socket, { type: 'authenticate', token: 'dev:config' });
    const { character } = await inbox.next('state.snapshot');

    const config = structuredClone(character.combatConfig);
    config.potions.hp.itemId = 'jellopy';
    send(socket, { type: 'combat.config.update', config });
    expect(await inbox.next('error')).toMatchObject({ code: 'invalid_config' });
    socket.terminate();
  });
});

import Fastify, { type FastifyInstance } from 'fastify';
import websocket from '@fastify/websocket';
import { GAME_SOCKET_PATH } from '@ragidle/protocol';
import { InMemoryCharacterRepository } from './characters/character-repository';
import type { ServerConfig } from './config';
import { SessionManager } from './game/session-manager';
import { GameConnection } from './ws/game-connection';

export interface AppOptions {
  config: Pick<ServerConfig, 'maxOfflineMs'>;
  clock?: () => number;
  logger?: boolean;
}

export async function buildApp(options: AppOptions): Promise<FastifyInstance> {
  const clock = options.clock ?? Date.now;
  const app = Fastify({ logger: options.logger ?? false });
  const repository = new InMemoryCharacterRepository();
  const sessions = new SessionManager(repository, {
    clock,
    maxOfflineMs: options.config.maxOfflineMs,
  });

  await app.register(websocket, { options: { maxPayload: 64 * 1024 } });

  app.get('/health', async () => ({ status: 'ok', time: clock() }));

  app.get(GAME_SOCKET_PATH, { websocket: true }, (socket) => {
    new GameConnection(socket, sessions, clock, app.log);
  });

  app.addHook('onClose', async () => sessions.dispose());
  return app;
}

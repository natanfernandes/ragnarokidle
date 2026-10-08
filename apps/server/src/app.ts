import Fastify, { type FastifyInstance } from 'fastify';
import websocket from '@fastify/websocket';
import { GAME_SOCKET_PATH } from '@ragidle/protocol';
import { FileAssetStore, SpriteService, ZRendererClient } from '@ragidle/renderer-client';
import { AppearanceRegistry } from './assets/appearance';
import { registerSpriteRoutes } from './assets/sprite-routes';
import { InMemoryCharacterRepository } from './characters/character-repository';
import type { ServerConfig } from './config';
import { SessionManager } from './game/session-manager';
import { GameConnection } from './ws/game-connection';

export interface AppOptions {
  config: Pick<ServerConfig, 'maxOfflineMs'> & Partial<Pick<ServerConfig, 'renderer'>>;
  clock?: () => number;
  logger?: boolean;
  /** Overrides the sprite service built from `config.renderer` (used by tests). */
  sprites?: SpriteService | null;
}

function createSpriteService(config: AppOptions['config']): SpriteService | null {
  const renderer = config.renderer;
  if (!renderer?.url) return null;
  return new SpriteService(
    new ZRendererClient({ baseUrl: renderer.url, accessToken: renderer.accessToken }),
    new FileAssetStore(renderer.cacheDir),
  );
}

export async function buildApp(options: AppOptions): Promise<FastifyInstance> {
  const clock = options.clock ?? Date.now;
  const app = Fastify({ logger: options.logger ?? false });
  const repository = new InMemoryCharacterRepository();
  const sessions = new SessionManager(repository, {
    clock,
    maxOfflineMs: options.config.maxOfflineMs,
  });
  const sprites =
    options.sprites !== undefined ? options.sprites : createSpriteService(options.config);
  const appearances = new AppearanceRegistry();

  await app.register(websocket, { options: { maxPayload: 64 * 1024 } });

  app.get('/health', async () => ({ status: 'ok', time: clock(), renderer: sprites !== null }));

  registerSpriteRoutes(app, sprites, appearances);

  app.get(GAME_SOCKET_PATH, { websocket: true }, (socket) => {
    new GameConnection(socket, sessions, clock, app.log, {
      rendererEnabled: sprites !== null,
      appearances,
    });
  });

  app.addHook('onClose', async () => sessions.dispose());
  return app;
}

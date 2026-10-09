import Fastify, { type FastifyInstance } from 'fastify';
import websocket from '@fastify/websocket';
import { GAME_SOCKET_PATH } from '@ragidle/protocol';
import {
  FileAssetStore,
  RagassetsClient,
  SpriteService,
  ZRendererClient,
} from '@ragidle/renderer-client';
import { AppearanceRegistry } from './assets/appearance';
import { registerSpriteRoutes } from './assets/sprite-routes';
import {
  type CharacterRepository,
  InMemoryCharacterRepository,
} from './characters/character-repository';
import { PostgresCharacterRepository } from './characters/postgres-character-repository';
import type { ServerConfig } from './config';
import { connectDatabase } from './db/database';
import { SessionManager } from './game/session-manager';
import { GameConnection } from './ws/game-connection';

export interface AppOptions {
  config: Pick<ServerConfig, 'maxOfflineMs'> &
    Partial<Pick<ServerConfig, 'renderer' | 'databaseUrl'>>;
  /** Overrides the repository built from `config.databaseUrl` (used by tests). */
  repository?: CharacterRepository;
  saveIntervalMs?: number;
  clock?: () => number;
  logger?: boolean;
  /** Overrides the sprite service built from `config.renderer` (used by tests). */
  sprites?: SpriteService | null;
}

function createSpriteService(config: AppOptions['config']): SpriteService | null {
  const renderer = config.renderer;
  if (!renderer?.url) return null;
  const client =
    renderer.kind === 'zrenderer'
      ? new ZRendererClient({ baseUrl: renderer.url, accessToken: renderer.accessToken })
      : new RagassetsClient({ baseUrl: renderer.url });
  return new SpriteService(client, new FileAssetStore(renderer.cacheDir));
}

export async function buildApp(options: AppOptions): Promise<FastifyInstance> {
  const clock = options.clock ?? Date.now;
  const app = Fastify({ logger: options.logger ?? false });

  let repository = options.repository;
  let closeDatabase: (() => Promise<void>) | null = null;
  if (!repository && options.config.databaseUrl) {
    const database = await connectDatabase(options.config.databaseUrl);
    repository = new PostgresCharacterRepository(database.db);
    closeDatabase = database.close;
  }
  if (!repository) {
    app.log.warn('DATABASE_URL is not set: characters are kept in memory and lost on restart');
    repository = new InMemoryCharacterRepository();
  }

  const sessions = new SessionManager(repository, {
    clock,
    maxOfflineMs: options.config.maxOfflineMs,
    saveIntervalMs: options.saveIntervalMs,
    onSaveError: (error) => app.log.error({ err: error }, 'Failed to save character'),
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

  app.addHook('onClose', async () => {
    // Save every character before the database goes away.
    await sessions.dispose();
    await closeDatabase?.();
  });
  return app;
}

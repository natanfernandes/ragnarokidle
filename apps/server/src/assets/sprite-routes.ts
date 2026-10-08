import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { gameData } from '@ragidle/game-data';
import { SPRITE_ASSET_PATH } from '@ragidle/protocol';
import {
  Direction,
  type RenderRequest,
  RendererError,
  type SpriteService,
  isSpriteAction,
  monsterRenderRequest,
  playerRenderRequest,
} from '@ragidle/renderer-client';
import type { AppearanceRegistry } from './appearance';

/** The player stands on the left facing right, monsters on the right facing left. */
export const PLAYER_DIRECTION = Direction.southEast;
export const MONSTER_DIRECTION = Direction.southWest;

const IMMUTABLE = 'public, max-age=31536000, immutable';
const DAILY = 'public, max-age=86400';

export function registerSpriteRoutes(
  app: FastifyInstance,
  sprites: SpriteService | null,
  appearances: AppearanceRegistry,
): void {
  /**
   * Player URLs carry an appearance hash, so their content never changes and
   * browsers may keep them for good. Monster URLs are by id, so browsers
   * revalidate them daily and get a 304 while the sprite is unchanged.
   */
  const send = async (
    request: FastifyRequest,
    reply: FastifyReply,
    render: RenderRequest,
    cacheControl: string,
  ) => {
    if (!sprites) return reply.code(404).send({ error: 'Sprite renderer is not configured' });
    const etag = `"${sprites.keyOf(render)}"`;
    reply.header('etag', etag).header('cache-control', cacheControl);
    if (request.headers['if-none-match'] === etag) return reply.code(304).send();
    try {
      const { bytes } = await sprites.get(render);
      return reply.header('content-type', 'image/png').send(Buffer.from(bytes));
    } catch (error) {
      if (!(error instanceof RendererError)) throw error;
      app.log.warn({ err: error }, 'Sprite render failed');
      return reply
        .removeHeader('etag')
        .code(502)
        .header('cache-control', 'no-store')
        .send({ error: 'Sprite renderer failed' });
    }
  };

  app.get<{ Params: { appearance: string; action: string } }>(
    `${SPRITE_ASSET_PATH}/player/:appearance/:action`,
    async (request, reply) => {
      const { appearance, action } = request.params;
      const known = appearances.get(appearance);
      if (!known || !isSpriteAction(action))
        return reply.code(404).send({ error: 'Unknown sprite' });
      return send(request, reply, playerRenderRequest(known, action, PLAYER_DIRECTION), IMMUTABLE);
    },
  );

  app.get<{ Params: { monsterId: string; action: string } }>(
    `${SPRITE_ASSET_PATH}/monster/:monsterId/:action`,
    async (request, reply) => {
      const { monsterId, action } = request.params;
      const jobId = gameData.monsters[monsterId]?.sprite.jobId;
      if (jobId === undefined || !isSpriteAction(action)) {
        return reply.code(404).send({ error: 'Unknown sprite' });
      }
      return send(request, reply, monsterRenderRequest(jobId, action, MONSTER_DIRECTION), DAILY);
    },
  );
}

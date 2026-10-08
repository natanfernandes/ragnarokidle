import type { FastifyInstance, FastifyReply } from 'fastify';
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

export function registerSpriteRoutes(
  app: FastifyInstance,
  sprites: SpriteService | null,
  appearances: AppearanceRegistry,
): void {
  const send = async (reply: FastifyReply, request: RenderRequest) => {
    if (!sprites) return reply.code(404).send({ error: 'Sprite renderer is not configured' });
    try {
      const { key, bytes } = await sprites.get(request);
      return reply
        .header('content-type', 'image/png')
        .header('etag', `"${key}"`)
        .header('cache-control', 'public, max-age=86400')
        .send(Buffer.from(bytes));
    } catch (error) {
      if (!(error instanceof RendererError)) throw error;
      app.log.warn({ err: error }, 'Sprite render failed');
      return reply.code(502).send({ error: 'Sprite renderer failed' });
    }
  };

  app.get<{ Params: { appearance: string; action: string } }>(
    `${SPRITE_ASSET_PATH}/player/:appearance/:action`,
    async (request, reply) => {
      const { appearance, action } = request.params;
      const known = appearances.get(appearance);
      if (!known || !isSpriteAction(action))
        return reply.code(404).send({ error: 'Unknown sprite' });
      return send(reply, playerRenderRequest(known, action, PLAYER_DIRECTION));
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
      return send(reply, monsterRenderRequest(jobId, action, MONSTER_DIRECTION));
    },
  );
}

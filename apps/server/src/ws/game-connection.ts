import type { WebSocket } from 'ws';
import type { FastifyBaseLogger } from 'fastify';
import { type ClientMessage, type ServerMessage, parseClientMessage } from '@ragidle/protocol';
import { type AppearanceRegistry, appearanceOf } from '../assets/appearance';
import { authenticate } from '../auth';
import { type CombatSession, GameRuleError, type SessionListener } from '../game/combat-session';
import type { SessionManager } from '../game/session-manager';
import { RateLimiter } from './rate-limiter';

const MAX_MESSAGE_BYTES = 16 * 1024;
const MAX_RATE_LIMIT_STRIKES = 50;

/** One WebSocket client. Validates every message before touching game state. */
export class GameConnection {
  private session: CombatSession | null = null;
  private readonly limiter: RateLimiter;
  private strikes = 0;
  /** Messages are handled one at a time, in order, even while one awaits storage. */
  private queue: Promise<void> = Promise.resolve();
  private closed = false;
  private readonly listener: SessionListener = (message) => this.send(message);

  constructor(
    private readonly socket: WebSocket,
    private readonly sessions: SessionManager,
    private readonly clock: () => number,
    private readonly log: FastifyBaseLogger,
    private readonly assets: { rendererEnabled: boolean; appearances: AppearanceRegistry },
  ) {
    this.limiter = new RateLimiter(20, 10, clock());
    socket.on('message', (data, isBinary) => this.onMessage(data.toString(), isBinary));
    socket.on('close', () => {
      this.closed = true;
      this.session?.detach(this.listener);
    });
  }

  private onMessage(raw: string, isBinary: boolean): void {
    if (!this.limiter.tryConsume(this.clock())) {
      this.strikes += 1;
      if (this.strikes > MAX_RATE_LIMIT_STRIKES) {
        this.socket.close(1008, 'Rate limit exceeded');
        return;
      }
      return this.error('rate_limited', 'Too many messages');
    }
    if (isBinary || raw.length > MAX_MESSAGE_BYTES) {
      return this.error('invalid_message', 'Message too large or not text');
    }
    const parsed = parseClientMessage(raw);
    if (!parsed.ok) return this.error('invalid_message', parsed.error);

    const { message } = parsed;
    this.queue = this.queue.then(async () => {
      try {
        await this.handle(message);
      } catch (error) {
        if (error instanceof GameRuleError) {
          return this.error(error.code, error.message, message.requestId);
        }
        this.log.error({ err: error }, 'Failed to handle client message');
        this.error('invalid_state', 'Internal error', message.requestId);
      }
    });
  }

  private async handle(message: ClientMessage): Promise<void> {
    if (message.type === 'authenticate')
      return this.onAuthenticate(message.token, message.requestId);

    const session = this.session;
    if (!session) return this.error('unauthenticated', 'Authenticate first', message.requestId);

    switch (message.type) {
      case 'state.request':
        break;
      case 'combat.start':
        session.start(message.mapId);
        break;
      case 'combat.stop':
        session.stop();
        break;
      case 'combat.config.update':
        session.updateConfig(message.config);
        break;
    }
    this.sendSnapshot(message.requestId);
  }

  private async onAuthenticate(token: string, requestId?: string): Promise<void> {
    const player = authenticate(token);
    if (!player) return this.error('unauthenticated', 'Invalid token', requestId);

    this.session?.detach(this.listener);
    this.session = null;
    const session = await this.sessions.forPlayer(player);
    // The socket may have closed while the character was loading.
    if (this.closed) return;
    this.session = session;
    this.send({
      type: 'authenticated',
      characterId: player.characterId,
      serverTime: this.clock(),
      requestId,
    });
    const rewards = session.attach(this.listener);
    if (rewards) this.send({ type: 'offline.rewards', rewards });
    this.sendSnapshot();
  }

  private sendSnapshot(requestId?: string): void {
    if (!this.session) return;
    const snapshot = this.session.snapshot();
    this.send({
      type: 'state.snapshot',
      serverTime: this.clock(),
      ...snapshot,
      assets: {
        rendererEnabled: this.assets.rendererEnabled,
        playerAppearance: this.assets.appearances.register(appearanceOf(snapshot.character)),
      },
      requestId,
    });
  }

  private error(
    code: Extract<ServerMessage, { type: 'error' }>['code'],
    message: string,
    requestId?: string,
  ) {
    this.send({ type: 'error', code, message, requestId });
  }

  private send(message: ServerMessage): void {
    if (this.socket.readyState === this.socket.OPEN) this.socket.send(JSON.stringify(message));
  }
}

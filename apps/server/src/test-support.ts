import type { FastifyInstance } from 'fastify';
import type { WebSocket } from 'ws';
import { AUTH_PATHS, GAME_SOCKET_PATH, type ServerMessage } from '@ragidle/protocol';

/** Collects every server message and lets tests wait for a specific one. */
export function messages(socket: WebSocket) {
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

export type Inbox = ReturnType<typeof messages>;

/** Registers an account and returns its session cookie, ready for a `cookie` header. */
export async function signUp(app: FastifyInstance, characterName: string): Promise<string> {
  const response = await app.inject({
    method: 'POST',
    url: AUTH_PATHS.register,
    payload: {
      email: `${characterName.toLowerCase()}@example.com`,
      password: 'correct horse battery',
      characterName,
    },
  });
  if (response.statusCode !== 201) throw new Error(`Sign-up failed: ${response.body}`);
  const cookie = response.cookies[0];
  if (!cookie) throw new Error('Sign-up set no cookie');
  return `${cookie.name}=${cookie.value}`;
}

/** Opens the game socket with a session cookie; the server sends the state right away. */
export async function openGame(
  app: FastifyInstance,
  cookie?: string,
): Promise<{ socket: WebSocket; inbox: Inbox; closed: Promise<number> }> {
  let inbox!: Inbox;
  let closed!: Promise<number>;
  const socket = await app.injectWS(
    GAME_SOCKET_PATH,
    { headers: cookie ? { cookie } : {} },
    {
      onInit: (ws) => {
        inbox = messages(ws);
        closed = new Promise((resolve) => ws.on('close', (code) => resolve(code)));
      },
    },
  );
  return { socket, inbox, closed };
}

export const send = (socket: WebSocket, message: object) => socket.send(JSON.stringify(message));

export const settle = () => new Promise((resolve) => setTimeout(resolve, 20));

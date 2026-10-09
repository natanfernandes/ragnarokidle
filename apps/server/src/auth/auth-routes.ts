import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type {} from '@fastify/cookie';
import { createCharacter } from '@ragidle/combat-engine';
import {
  AUTH_PATHS,
  type AccountInfo,
  type AuthErrorCode,
  SESSION_COOKIE,
  loginRequestSchema,
  registerRequestSchema,
} from '@ragidle/protocol';
import { RateLimiter } from '../ws/rate-limiter';
import type { AccountRepository, AuthenticatedPlayer } from './account-repository';
import { hashPassword, verifyPassword } from './password';

export const SESSION_TTL_MS = 30 * 24 * 3_600_000;

/** Login and sign-up attempts per client address: a burst of 10, then one every 6 s. */
const ATTEMPT_BURST = 10;
const ATTEMPTS_PER_SECOND = 1 / 6;
const MAX_TRACKED_CLIENTS = 10_000;

/** Same cost as a real check, so unknown emails and wrong passwords take as long. */
const DUMMY_HASH = await hashPassword('timing-equalizer');

export interface AuthOptions {
  accounts: AccountRepository;
  clock: () => number;
  /** Send the cookie only over HTTPS (production). */
  secureCookies: boolean;
}

export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

/** The player behind the request's session cookie, if it is valid. */
export async function playerFromRequest(
  request: FastifyRequest,
  options: Pick<AuthOptions, 'accounts' | 'clock'>,
): Promise<AuthenticatedPlayer | null> {
  const token = request.cookies[SESSION_COOKIE];
  if (!token) return null;
  return options.accounts.findSession(hashToken(token), new Date(options.clock()));
}

export function registerAuthRoutes(app: FastifyInstance, options: AuthOptions): void {
  const { accounts, clock } = options;
  const limiters = new Map<string, RateLimiter>();

  const allowAttempt = (request: FastifyRequest) => {
    if (limiters.size > MAX_TRACKED_CLIENTS) limiters.clear();
    let limiter = limiters.get(request.ip);
    if (!limiter) {
      limiter = new RateLimiter(ATTEMPT_BURST, ATTEMPTS_PER_SECOND, clock());
      limiters.set(request.ip, limiter);
    }
    return limiter.tryConsume(clock());
  };

  const fail = (reply: FastifyReply, status: number, error: AuthErrorCode, message: string) =>
    reply.code(status).send({ error, message });

  const startSession = async (reply: FastifyReply, player: AuthenticatedPlayer) => {
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(clock() + SESSION_TTL_MS);
    await accounts.createSession({
      tokenHash: hashToken(token),
      accountId: player.account.id,
      expiresAt,
    });
    reply.setCookie(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: options.secureCookies,
      path: '/',
      expires: expiresAt,
    });
    return { account: accountInfo(player) };
  };

  app.post(AUTH_PATHS.register, async (request, reply) => {
    if (!allowAttempt(request)) return fail(reply, 429, 'rate_limited', 'Too many attempts');
    const parsed = registerRequestSchema.safeParse(request.body);
    if (!parsed.success)
      return fail(
        reply,
        400,
        'invalid_request',
        parsed.error.issues[0]?.message ?? 'Invalid request',
      );
    const { email, password, characterName } = parsed.data;

    const account = {
      id: randomUUID(),
      email: email.toLowerCase(),
      passwordHash: await hashPassword(password),
      vip: false,
    };
    const character = createCharacter({ id: randomUUID(), name: characterName, now: clock() });
    const result = await accounts.create(account, character);
    if (result === 'email_taken')
      return fail(reply, 409, 'email_taken', 'That email is already registered');
    if (result === 'name_taken')
      return fail(reply, 409, 'name_taken', 'That character name is taken');
    return reply.code(201).send(await startSession(reply, { account, characterId: character.id }));
  });

  app.post(AUTH_PATHS.login, async (request, reply) => {
    if (!allowAttempt(request)) return fail(reply, 429, 'rate_limited', 'Too many attempts');
    const parsed = loginRequestSchema.safeParse(request.body);
    if (!parsed.success) return fail(reply, 400, 'invalid_request', 'Invalid email or password');

    const player = await accounts.findByEmail(parsed.data.email.toLowerCase());
    const valid = await verifyPassword(
      parsed.data.password,
      player?.account.passwordHash ?? DUMMY_HASH,
    );
    if (!player || !valid)
      return fail(reply, 401, 'invalid_credentials', 'Wrong email or password');
    return startSession(reply, player);
  });

  app.post(AUTH_PATHS.logout, async (request, reply) => {
    const token = request.cookies[SESSION_COOKIE];
    if (token) await accounts.deleteSession(hashToken(token));
    reply.clearCookie(SESSION_COOKIE, { path: '/' });
    return reply.code(204).send();
  });

  app.get(AUTH_PATHS.me, async (request, reply) => {
    const player = await playerFromRequest(request, options);
    if (!player) return fail(reply, 401, 'unauthenticated', 'Not logged in');
    return { account: accountInfo(player) };
  });
}

function accountInfo({ account, characterId }: AuthenticatedPlayer): AccountInfo {
  return { id: account.id, email: account.email, vip: account.vip, characterId };
}

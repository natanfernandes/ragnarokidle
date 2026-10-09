import { z } from 'zod';

/** HTTP routes for accounts. The session lives in an httpOnly cookie, never in scripts. */
export const AUTH_PATHS = {
  register: '/auth/register',
  login: '/auth/login',
  logout: '/auth/logout',
  me: '/auth/me',
} as const;

export const SESSION_COOKIE = 'ragidle_session';

const email = z.email().max(254);
const password = z.string().min(8).max(128);

/** Ragnarok Online style: 4 to 23 letters, digits or underscores. */
export const characterNameSchema = z
  .string()
  .regex(/^[A-Za-z0-9_]{4,23}$/, 'Use 4 to 23 letters, digits or underscores');

export const registerRequestSchema = z.object({
  email,
  password,
  characterName: characterNameSchema,
});
export type RegisterRequest = z.infer<typeof registerRequestSchema>;

export const loginRequestSchema = z.object({ email, password: z.string().min(1).max(128) });
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export interface AccountInfo {
  id: string;
  email: string;
  /** VIP accounts keep progressing while offline. */
  vip: boolean;
  characterId: string;
}

export type AuthErrorCode =
  | 'invalid_request'
  | 'email_taken'
  | 'name_taken'
  | 'invalid_credentials'
  | 'unauthenticated'
  | 'rate_limited';

export type AuthResponse = { account: AccountInfo } | { error: AuthErrorCode; message: string };

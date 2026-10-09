import {
  AUTH_PATHS,
  type AccountInfo,
  type AuthResponse,
  type LoginRequest,
  type RegisterRequest,
} from '@ragidle/protocol';

export type AuthResult = { ok: true; account: AccountInfo } | { ok: false; message: string };

async function post(path: string, body: unknown): Promise<AuthResult> {
  try {
    const response = await fetch(path, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = (await response.json()) as AuthResponse;
    return 'account' in data
      ? { ok: true, account: data.account }
      : { ok: false, message: data.message };
  } catch {
    return { ok: false, message: 'Could not reach the server. Try again.' };
  }
}

export const authApi = {
  /** The signed-in account, or null when there is no valid session cookie. */
  async me(): Promise<AccountInfo | null> {
    const response = await fetch(AUTH_PATHS.me, { credentials: 'same-origin' });
    if (!response.ok) return null;
    return ((await response.json()) as { account: AccountInfo }).account;
  },
  login: (request: LoginRequest) => post(AUTH_PATHS.login, request),
  register: (request: RegisterRequest) => post(AUTH_PATHS.register, request),
  async logout(): Promise<void> {
    await fetch(AUTH_PATHS.logout, { method: 'POST', credentials: 'same-origin' });
  },
};

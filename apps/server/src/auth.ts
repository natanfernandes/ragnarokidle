/**
 * Development-only authentication: any token of the form `dev:<name>` maps to a
 * character owned by that name. Real authentication replaces this later.
 */
export interface AuthenticatedPlayer {
  characterId: string;
  characterName: string;
}

const DEV_TOKEN = /^dev:([a-zA-Z0-9_-]{1,24})$/;

export function authenticate(token: string): AuthenticatedPlayer | null {
  const match = DEV_TOKEN.exec(token);
  if (!match?.[1]) return null;
  return { characterId: `dev-${match[1].toLowerCase()}`, characterName: match[1] };
}

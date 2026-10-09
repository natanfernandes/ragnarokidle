import type { CharacterState } from '@ragidle/shared';
import type { InMemoryCharacterRepository } from '../characters/character-repository';

export interface Account {
  id: string;
  /** Lower-cased. */
  email: string;
  passwordHash: string;
  vip: boolean;
}

/** A logged-in account and the character it plays. */
export interface AuthenticatedPlayer {
  account: Account;
  characterId: string;
}

export interface NewSession {
  tokenHash: string;
  accountId: string;
  expiresAt: Date;
}

export type CreateAccountResult = 'created' | 'email_taken' | 'name_taken';

/** Storage seam for accounts and login sessions. */
export interface AccountRepository {
  /** Creates the account and its first character atomically. */
  create(account: Account, character: CharacterState): Promise<CreateAccountResult>;
  /** The account with this (lower-cased) email and its character. */
  findByEmail(email: string): Promise<AuthenticatedPlayer | null>;
  createSession(session: NewSession): Promise<void>;
  /** The player behind a session, or null when it is unknown or expired at `now`. */
  findSession(tokenHash: string, now: Date): Promise<AuthenticatedPlayer | null>;
  deleteSession(tokenHash: string): Promise<void>;
}

export class InMemoryAccountRepository implements AccountRepository {
  private readonly accounts = new Map<string, Account & { characterId: string }>();
  private readonly sessions = new Map<string, NewSession>();
  private readonly names = new Set<string>();

  constructor(private readonly characters: InMemoryCharacterRepository) {}

  async create(account: Account, character: CharacterState): Promise<CreateAccountResult> {
    if (await this.findByEmail(account.email)) return 'email_taken';
    const name = character.name.toLowerCase();
    if (this.names.has(name)) return 'name_taken';
    this.names.add(name);
    this.accounts.set(account.id, { ...account, characterId: character.id });
    await this.characters.save({ character, combat: null });
    return 'created';
  }

  async findByEmail(email: string): Promise<AuthenticatedPlayer | null> {
    for (const stored of this.accounts.values()) {
      if (stored.email === email) return toPlayer(stored);
    }
    return null;
  }

  async createSession(session: NewSession): Promise<void> {
    this.sessions.set(session.tokenHash, session);
  }

  async findSession(tokenHash: string, now: Date): Promise<AuthenticatedPlayer | null> {
    const session = this.sessions.get(tokenHash);
    const stored = session && this.accounts.get(session.accountId);
    if (!session || !stored || session.expiresAt <= now) return null;
    return toPlayer(stored);
  }

  async deleteSession(tokenHash: string): Promise<void> {
    this.sessions.delete(tokenHash);
  }
}

function toPlayer({
  characterId,
  ...account
}: Account & { characterId: string }): AuthenticatedPlayer {
  return { account, characterId };
}

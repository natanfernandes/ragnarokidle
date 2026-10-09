import { type SQL, and, asc, eq, gt } from 'drizzle-orm';
import type { CharacterState } from '@ragidle/shared';
import { saveCharacter } from '../characters/postgres-character-repository';
import type { Database } from '../db/database';
import { accounts, characters, sessions } from '../db/schema';
import type {
  Account,
  AccountRepository,
  AuthenticatedPlayer,
  CreateAccountResult,
  NewSession,
} from './account-repository';

const UNIQUE_VIOLATION = '23505';

export class PostgresAccountRepository implements AccountRepository {
  constructor(private readonly db: Database) {}

  async create(account: Account, character: CharacterState): Promise<CreateAccountResult> {
    try {
      await this.db.transaction(async (tx) => {
        await tx.insert(accounts).values(account);
        await saveCharacter(tx, { character, combat: null }, { accountId: account.id });
      });
      return 'created';
    } catch (error) {
      const constraint = uniqueViolation(error);
      if (constraint === 'accounts_email_unique') return 'email_taken';
      if (constraint === 'characters_name_unique') return 'name_taken';
      throw error;
    }
  }

  async findByEmail(email: string): Promise<AuthenticatedPlayer | null> {
    return this.findPlayer(eq(accounts.email, email));
  }

  async createSession(session: NewSession): Promise<void> {
    await this.db.insert(sessions).values(session);
  }

  async findSession(tokenHash: string, now: Date): Promise<AuthenticatedPlayer | null> {
    const [row] = await this.db
      .select({ accountId: sessions.accountId })
      .from(sessions)
      .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, now)));
    return row ? this.findPlayer(eq(accounts.id, row.accountId)) : null;
  }

  async deleteSession(tokenHash: string): Promise<void> {
    await this.db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
  }

  private async findPlayer(where: SQL): Promise<AuthenticatedPlayer | null> {
    const [row] = await this.db
      .select({
        id: accounts.id,
        email: accounts.email,
        passwordHash: accounts.passwordHash,
        vip: accounts.vip,
        characterId: characters.id,
      })
      .from(accounts)
      .innerJoin(characters, eq(characters.accountId, accounts.id))
      .where(where)
      // One character per account for now; the oldest one is the main.
      .orderBy(asc(characters.createdAt))
      .limit(1);
    if (!row) return null;
    const { characterId, ...account } = row;
    return { account, characterId };
  }
}

/** The constraint name of a PostgreSQL unique violation, wherever the driver nests it. */
function uniqueViolation(error: unknown): string | null {
  for (
    let e = error as
      { code?: string; constraint_name?: string; constraint?: string; cause?: unknown } | undefined;
    e;
    e = e.cause as typeof e
  ) {
    if (e.code === UNIQUE_VIOLATION) return e.constraint_name ?? e.constraint ?? null;
  }
  return null;
}

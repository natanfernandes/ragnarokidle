import type { CharacterRepository } from '../characters/character-repository';
import { CombatSession, type CombatSessionDeps } from './combat-session';

export class SessionManager {
  private readonly sessions = new Map<string, Promise<CombatSession>>();

  constructor(
    private readonly repository: CharacterRepository,
    private readonly deps: Omit<CombatSessionDeps, 'repository'>,
  ) {}

  /** Loads the character once; later calls share the session. */
  forCharacter(characterId: string): Promise<CombatSession> {
    let session = this.sessions.get(characterId);
    if (!session) {
      session = this.open(characterId);
      this.sessions.set(characterId, session);
      // A failed load must not stick: the next attempt tries again.
      session.catch(() => this.sessions.delete(characterId));
    }
    return session;
  }

  /** Saves every session; used on shutdown. */
  async dispose(): Promise<void> {
    const sessions = await Promise.allSettled(this.sessions.values());
    this.sessions.clear();
    await Promise.all(
      sessions.map((s) => (s.status === 'fulfilled' ? s.value.dispose() : undefined)),
    );
  }

  private async open(characterId: string): Promise<CombatSession> {
    // Characters are created with their account, so a missing one is a bug.
    const stored = await this.repository.load(characterId);
    if (!stored) throw new Error(`Character ${characterId} does not exist`);
    return new CombatSession(stored, { ...this.deps, repository: this.repository });
  }
}

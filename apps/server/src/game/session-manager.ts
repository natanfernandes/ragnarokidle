import type { InMemoryCharacterRepository } from '../characters/character-repository';
import type { AuthenticatedPlayer } from '../auth';
import { CombatSession, type CombatSessionDeps } from './combat-session';

export class SessionManager {
  private readonly sessions = new Map<string, CombatSession>();

  constructor(
    private readonly repository: InMemoryCharacterRepository,
    private readonly deps: Omit<CombatSessionDeps, 'repository'>,
  ) {}

  forPlayer(player: AuthenticatedPlayer): CombatSession {
    let session = this.sessions.get(player.characterId);
    if (!session) {
      const character = this.repository.getOrCreate(
        player.characterId,
        player.characterName,
        this.deps.clock(),
      );
      session = new CombatSession(character, { ...this.deps, repository: this.repository });
      this.sessions.set(player.characterId, session);
    }
    return session;
  }

  dispose(): void {
    for (const session of this.sessions.values()) session.dispose();
    this.sessions.clear();
  }
}

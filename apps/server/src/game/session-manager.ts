import { createCharacter } from '@ragidle/combat-engine';
import type { CharacterRepository } from '../characters/character-repository';
import type { AuthenticatedPlayer } from '../auth';
import { CombatSession, type CombatSessionDeps } from './combat-session';

export class SessionManager {
  private readonly sessions = new Map<string, Promise<CombatSession>>();

  constructor(
    private readonly repository: CharacterRepository,
    private readonly deps: Omit<CombatSessionDeps, 'repository'>,
  ) {}

  /** Loads (or creates) the player's character once; later calls share the session. */
  forPlayer(player: AuthenticatedPlayer): Promise<CombatSession> {
    let session = this.sessions.get(player.characterId);
    if (!session) {
      session = this.open(player);
      this.sessions.set(player.characterId, session);
      // A failed load must not stick: the next attempt tries again.
      session.catch(() => this.sessions.delete(player.characterId));
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

  private async open(player: AuthenticatedPlayer): Promise<CombatSession> {
    let stored = await this.repository.load(player.characterId);
    if (!stored) {
      stored = {
        character: createCharacter({
          id: player.characterId,
          name: player.characterName,
          now: this.deps.clock(),
        }),
        combat: null,
      };
      await this.repository.save(stored);
    }
    return new CombatSession(stored, { ...this.deps, repository: this.repository });
  }
}

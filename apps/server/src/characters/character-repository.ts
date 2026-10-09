import type { CombatState } from '@ragidle/combat-engine';
import type { CharacterState } from '@ragidle/shared';

/** A character plus the fight it is running, if any. Saved and loaded as one unit. */
export interface StoredCharacter {
  character: CharacterState;
  /** Its `character` is the same as the stored character. */
  combat: CombatState | null;
}

/** Storage seam for characters: PostgreSQL in the app, in memory in tests and quick dev runs. */
export interface CharacterRepository {
  load(id: string): Promise<StoredCharacter | null>;
  /** Saves everything about the character atomically. */
  save(stored: StoredCharacter): Promise<void>;
}

export class InMemoryCharacterRepository implements CharacterRepository {
  private readonly characters = new Map<string, StoredCharacter>();

  async load(id: string): Promise<StoredCharacter | null> {
    const stored = this.characters.get(id);
    return stored ? structuredClone(stored) : null;
  }

  async save(stored: StoredCharacter): Promise<void> {
    this.characters.set(stored.character.id, structuredClone(stored));
  }
}

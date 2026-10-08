import type { CharacterState } from '@ragidle/shared';
import { createCharacter } from '@ragidle/combat-engine';

/** Storage seam for characters. In-memory for now; PostgreSQL comes later. */
export interface CharacterRepository {
  get(id: string): CharacterState | undefined;
  save(character: CharacterState): void;
}

export class InMemoryCharacterRepository implements CharacterRepository {
  private readonly characters = new Map<string, CharacterState>();

  get(id: string): CharacterState | undefined {
    const character = this.characters.get(id);
    return character && structuredClone(character);
  }

  save(character: CharacterState): void {
    this.characters.set(character.id, structuredClone(character));
  }

  getOrCreate(id: string, name: string, now: number): CharacterState {
    const existing = this.get(id);
    if (existing) return existing;
    const created = createCharacter({ id, name, now });
    this.save(created);
    return created;
  }
}

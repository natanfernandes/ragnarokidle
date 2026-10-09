import { eq } from 'drizzle-orm';
import type { CombatState } from '@ragidle/combat-engine';
import type { CharacterState, EquipmentSlot } from '@ragidle/shared';
import type { Database } from '../db/database';
import {
  characterEquipment,
  characterStats,
  characters,
  combatConfigs,
  combatSessions,
  inventoryItems,
  type StoredCombat,
} from '../db/schema';
import type { CharacterRepository, StoredCharacter } from './character-repository';

export class PostgresCharacterRepository implements CharacterRepository {
  constructor(private readonly db: Database) {}

  async load(id: string): Promise<StoredCharacter | null> {
    return this.db.transaction(async (tx) => {
      const [row] = await tx.select().from(characters).where(eq(characters.id, id));
      if (!row) return null;
      const [stats] = await tx
        .select()
        .from(characterStats)
        .where(eq(characterStats.characterId, id));
      const [config] = await tx
        .select()
        .from(combatConfigs)
        .where(eq(combatConfigs.characterId, id));
      if (!stats || !config) throw new Error(`Character ${id} is missing stats or configuration`);
      const equipment = await tx
        .select()
        .from(characterEquipment)
        .where(eq(characterEquipment.characterId, id));
      const inventory = await tx
        .select()
        .from(inventoryItems)
        .where(eq(inventoryItems.characterId, id));
      const [session] = await tx
        .select()
        .from(combatSessions)
        .where(eq(combatSessions.characterId, id));

      const character: CharacterState = {
        id: row.id,
        name: row.name,
        classId: row.classId,
        level: row.level,
        experience: row.experience,
        zeny: row.zeny,
        baseStats: {
          str: stats.str,
          agi: stats.agi,
          vit: stats.vit,
          int: stats.int,
          dex: stats.dex,
          luk: stats.luk,
        },
        appearance: {
          gender: row.gender,
          hairStyle: row.hairStyle,
          hairColor: row.hairColor,
          clothesColor: row.clothesColor,
        },
        hp: row.hp,
        sp: row.sp,
        equipment: Object.fromEntries(equipment.map((e) => [e.slot as EquipmentSlot, e.itemId])),
        inventory: Object.fromEntries(inventory.map((i) => [i.itemId, i.quantity])),
        combatConfig: config.config,
        currentMapId: row.currentMapId,
        lastSimulationAt: row.lastSimulationAt,
      };
      return {
        character,
        combat: session ? { ...session.state, character: structuredClone(character) } : null,
      };
    });
  }

  async save({ character: c, combat }: StoredCharacter): Promise<void> {
    const id = c.id;
    const row = {
      id,
      name: c.name,
      classId: c.classId,
      level: c.level,
      experience: c.experience,
      zeny: c.zeny,
      hp: c.hp,
      sp: c.sp,
      currentMapId: c.currentMapId,
      gender: c.appearance.gender,
      hairStyle: c.appearance.hairStyle,
      hairColor: c.appearance.hairColor,
      clothesColor: c.appearance.clothesColor,
      lastSimulationAt: c.lastSimulationAt,
      updatedAt: new Date(),
    };
    const stats = { characterId: id, ...c.baseStats };
    await this.db.transaction(async (tx) => {
      await tx
        .insert(characters)
        .values(row)
        .onConflictDoUpdate({ target: characters.id, set: row });
      await tx
        .insert(characterStats)
        .values(stats)
        .onConflictDoUpdate({ target: characterStats.characterId, set: stats });
      await tx
        .insert(combatConfigs)
        .values({ characterId: id, config: c.combatConfig })
        .onConflictDoUpdate({ target: combatConfigs.characterId, set: { config: c.combatConfig } });

      // Equipment and inventory are small, so they are replaced wholesale.
      await tx.delete(characterEquipment).where(eq(characterEquipment.characterId, id));
      const equipped = Object.entries(c.equipment).filter(([, itemId]) => itemId);
      if (equipped.length > 0) {
        await tx
          .insert(characterEquipment)
          .values(equipped.map(([slot, itemId]) => ({ characterId: id, slot, itemId: itemId! })));
      }
      await tx.delete(inventoryItems).where(eq(inventoryItems.characterId, id));
      const items = Object.entries(c.inventory).filter(([, quantity]) => quantity > 0);
      if (items.length > 0) {
        await tx
          .insert(inventoryItems)
          .values(items.map(([itemId, quantity]) => ({ characterId: id, itemId, quantity })));
      }

      if (combat) {
        // The character is already stored in its own tables.
        const state: Partial<CombatState> = { ...combat };
        delete state.character;
        const session = {
          mapId: combat.mapId,
          state: state as StoredCombat,
          simulatedAt: combat.time,
          updatedAt: new Date(),
        };
        await tx
          .insert(combatSessions)
          .values({ characterId: id, ...session })
          .onConflictDoUpdate({ target: combatSessions.characterId, set: session });
      } else {
        await tx.delete(combatSessions).where(eq(combatSessions.characterId, id));
      }
    });
  }
}

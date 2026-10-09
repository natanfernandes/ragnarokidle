import {
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import type { CombatState } from '@ragidle/combat-engine';
import type { CombatConfig } from '@ragidle/shared';

/**
 * Persistent character state. Static game content (items, monsters, maps)
 * stays in @ragidle/game-data, so ids here are plain text references to it.
 * Epoch-millisecond times are stored as bigint, exactly as the engine uses them.
 */

const epochMs = (name: string) => bigint(name, { mode: 'number' });

export const accounts = pgTable(
  'accounts',
  {
    id: text('id').primaryKey(),
    /** Stored lower-cased. */
    email: text('email').notNull(),
    /** scrypt, see apps/server/src/auth/password.ts. */
    passwordHash: text('password_hash').notNull(),
    vip: boolean('vip').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('accounts_email_unique').on(t.email)],
);

export const sessions = pgTable(
  'sessions',
  {
    /** SHA-256 of the cookie token, so a database leak does not leak live sessions. */
    tokenHash: text('token_hash').primaryKey(),
    accountId: text('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (t) => [index('sessions_account_idx').on(t.accountId)],
);

export const characters = pgTable(
  'characters',
  {
    id: text('id').primaryKey(),
    /** Null only for characters made before accounts existed. */
    accountId: text('account_id').references(() => accounts.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    classId: text('class_id').notNull(),
    level: integer('level').notNull(),
    experience: bigint('experience', { mode: 'number' }).notNull(),
    zeny: bigint('zeny', { mode: 'number' }).notNull(),
    hp: integer('hp').notNull(),
    sp: integer('sp').notNull(),
    currentMapId: text('current_map_id').notNull(),
    gender: text('gender', { enum: ['male', 'female'] }).notNull(),
    hairStyle: integer('hair_style').notNull(),
    hairColor: integer('hair_color').notNull(),
    clothesColor: integer('clothes_color').notNull(),
    lastSimulationAt: epochMs('last_simulation_at').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('characters_name_unique').on(sql`lower(${t.name})`),
    index('characters_account_idx').on(t.accountId),
  ],
);

const characterId = () =>
  text('character_id')
    .notNull()
    .references(() => characters.id, { onDelete: 'cascade' });

export const characterStats = pgTable('character_stats', {
  characterId: characterId().primaryKey(),
  str: integer('str').notNull(),
  agi: integer('agi').notNull(),
  vit: integer('vit').notNull(),
  int: integer('int').notNull(),
  dex: integer('dex').notNull(),
  luk: integer('luk').notNull(),
});

export const characterEquipment = pgTable(
  'character_equipment',
  {
    characterId: characterId(),
    slot: text('slot').notNull(),
    itemId: text('item_id').notNull(),
  },
  (t) => [primaryKey({ columns: [t.characterId, t.slot] })],
);

export const inventoryItems = pgTable(
  'inventory_items',
  {
    characterId: characterId(),
    itemId: text('item_id').notNull(),
    quantity: integer('quantity').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.characterId, t.itemId] }),
    check('inventory_items_quantity_positive', sql`${t.quantity} > 0`),
  ],
);

export const combatConfigs = pgTable('combat_configs', {
  characterId: characterId().primaryKey(),
  config: jsonb('config').$type<CombatConfig>().notNull(),
});

/** The fight a character is running, so it survives restarts and keeps going offline. */
export type StoredCombat = Omit<CombatState, 'character'>;

export const combatSessions = pgTable('combat_sessions', {
  characterId: characterId().primaryKey(),
  mapId: text('map_id').notNull(),
  /** Engine state minus the character, which lives in the tables above. */
  state: jsonb('state').$type<StoredCombat>().notNull(),
  simulatedAt: epochMs('simulated_at').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

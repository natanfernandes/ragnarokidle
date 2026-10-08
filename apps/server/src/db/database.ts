import { fileURLToPath } from 'node:url';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from './schema';

/** Any Drizzle PostgreSQL database with our schema (postgres.js in the app, PGlite in tests). */
export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

export const MIGRATIONS_FOLDER = fileURLToPath(new URL('../../drizzle', import.meta.url));

/** Connects to PostgreSQL and brings the schema up to date. */
export async function connectDatabase(url: string): Promise<{
  db: Database;
  close: () => Promise<void>;
}> {
  const client = postgres(url, { max: 10, onnotice: () => {} });
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  return { db, close: () => client.end() };
}

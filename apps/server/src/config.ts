export interface ServerConfig {
  port: number;
  host: string;
  maxOfflineMs: number;
  /** PostgreSQL connection string; characters are kept in memory when unset (dev only). */
  databaseUrl: string | null;
  renderer: {
    /** Which renderer API `url` speaks. */
    kind: 'ragassets' | 'zrenderer';
    /** Renderer base URL; sprites fall back to placeholders when unset. */
    url: string | null;
    accessToken: string;
    cacheDir: string;
  };
}

/** Free public ragassets instance (best effort, no SLA); the development default. */
export const PUBLIC_RAGASSETS_URL = 'https://assets.latam-tools.com.br';

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const production = env.NODE_ENV === 'production';
  // Unset means "use the default"; an empty value turns rendering off.
  const rendererUrl = env.RENDERER_URL ?? (production ? '' : PUBLIC_RAGASSETS_URL);
  const databaseUrl = env.DATABASE_URL || null;
  if (production && !databaseUrl) throw new Error('DATABASE_URL is required in production');
  return {
    port: Number(env.PORT ?? 3001),
    host: env.HOST ?? '0.0.0.0',
    maxOfflineMs: Number(env.MAX_OFFLINE_HOURS ?? 24) * 3_600_000,
    databaseUrl,
    renderer: {
      kind: env.RENDERER_KIND === 'zrenderer' ? 'zrenderer' : 'ragassets',
      url: rendererUrl || null,
      accessToken: env.RENDERER_TOKEN ?? '',
      cacheDir: env.ASSET_CACHE_DIR ?? '.cache/sprites',
    },
  };
}

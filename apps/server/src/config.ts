export interface ServerConfig {
  port: number;
  host: string;
  maxOfflineMs: number;
  renderer: {
    /** zrenderer base URL; sprites fall back to placeholders when unset. */
    url: string | null;
    accessToken: string;
    cacheDir: string;
  };
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  return {
    port: Number(env.PORT ?? 3001),
    host: env.HOST ?? '0.0.0.0',
    maxOfflineMs: Number(env.MAX_OFFLINE_HOURS ?? 24) * 3_600_000,
    renderer: {
      url: env.RENDERER_URL || null,
      accessToken: env.RENDERER_TOKEN ?? '',
      cacheDir: env.ASSET_CACHE_DIR ?? '.cache/sprites',
    },
  };
}

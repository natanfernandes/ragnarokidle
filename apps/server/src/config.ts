export interface ServerConfig {
  port: number;
  host: string;
  maxOfflineMs: number;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  return {
    port: Number(env.PORT ?? 3001),
    host: env.HOST ?? '0.0.0.0',
    maxOfflineMs: Number(env.MAX_OFFLINE_HOURS ?? 24) * 3_600_000,
  };
}

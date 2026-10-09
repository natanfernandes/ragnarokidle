import { buildApp } from './app';
import { loadConfig } from './config';

const config = loadConfig();
const app = await buildApp({
  config,
  logger: true,
  secureCookies: process.env.NODE_ENV === 'production',
});

const shutdown = async () => {
  await app.close();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

await app.listen({ port: config.port, host: config.host });

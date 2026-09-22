import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export function loadConfiguration() {
  if (existsSync('.env')) process.loadEnvFile('.env');
  const port = Number(process.env.PORT ?? '3001');
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }
  const host = process.env.HOST?.trim() || '127.0.0.1';
  const configuredPath = process.env.DATABASE_PATH?.trim() || './data/daymark.sqlite';
  const databasePath = configuredPath === ':memory:' ? configuredPath : resolve(configuredPath);
  if (databasePath !== ':memory:') mkdirSync(dirname(databasePath), { recursive: true });
  return { port, host, databasePath };
}

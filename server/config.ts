// Read environment settings and prepare the database directory before starting the server.
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export function loadConfiguration() {
  // Load optional local settings only when an .env file exists.
  if (existsSync('.env')) process.loadEnvFile('.env');
  const port = Number(process.env.PORT ?? '3001');
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    // Reject this operation with an error the caller can handle.
    throw new Error('PORT must be an integer between 1 and 65535.');
  }
  const host = process.env.HOST?.trim() || '127.0.0.1';
  // Calculate or store the configured database path before resolution.
  const configuredPath = process.env.DATABASE_PATH?.trim() || './data/daymark.sqlite';
  const databasePath = configuredPath === ':memory:' ? configuredPath : resolve(configuredPath);
  if (databasePath !== ':memory:') mkdirSync(dirname(databasePath), { recursive: true });
  // Return the validated server address and database location together.
  return { port, host, databasePath };
}

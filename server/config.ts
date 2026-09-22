// Read environment settings and prepare the database directory before starting the server.
// Import the required exports from node:fs.
import { existsSync, mkdirSync } from 'node:fs';
// Import the required exports from node:path.
import { dirname, resolve } from 'node:path';

// Read configuration, apply defaults, and create the storage directory.
export function loadConfiguration() {
  // Load optional local settings only when an .env file exists.
  if (existsSync('.env')) process.loadEnvFile('.env');
  // Calculate or store the listening port.
  const port = Number(process.env.PORT ?? '3001');
  // Reject invalid ports before starting the server.
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    // Reject this operation with an error the caller can handle.
    throw new Error('PORT must be an integer between 1 and 65535.');
    // Close the current block or object.
  }
  // Calculate or store the bind address.
  const host = process.env.HOST?.trim() || '127.0.0.1';
  // Calculate or store the configured database path before resolution.
  const configuredPath = process.env.DATABASE_PATH?.trim() || './data/daymark.sqlite';
  // Calculate or store the database file location.
  const databasePath = configuredPath === ':memory:' ? configuredPath : resolve(configuredPath);
  // Create a directory only for a file database, not an in-memory connection.
  if (databasePath !== ':memory:') mkdirSync(dirname(databasePath), { recursive: true });
  // Return the validated server address and database location together.
  return { port, host, databasePath };
  // Close the current block or object.
}

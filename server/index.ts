import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { loadConfiguration } from './config.js';
import { createDatabase } from './db.js';

const { port, host, databasePath } = loadConfiguration();
const database = createDatabase(databasePath);
const clientDirectory = fileURLToPath(new URL('../client/', import.meta.url));
const serveClient =
  import.meta.url.endsWith('.js') && existsSync(join(clientDirectory, 'index.html'));
const app = createApp(database, { clientDirectory: serveClient ? clientDirectory : undefined });
const server = app.listen(port, host, () => {
  console.log(`Daymark ${serveClient ? 'app' : 'API'} is ready at http://${host}:${port}`);
});

server.on('error', (error) => {
  console.error('Could not start Daymark:', error.message);
  database.close();
  process.exitCode = 1;
});

let closing = false;
function shutdown() {
  if (closing) return;
  closing = true;
  server.close((error) => {
    database.close();
    if (error) process.exitCode = 1;
  });
  // Finish active requests, but do not let a keep-alive connection block shutdown.
  server.closeIdleConnections();
  setTimeout(() => server.closeAllConnections(), 5_000).unref();
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);

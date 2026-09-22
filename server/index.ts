// Start the HTTP server and close its resources when the process shuts down.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
// Import the required exports from ./app.js.
import { createApp } from './app.js';
import { loadConfiguration } from './config.js';
import { createDatabase } from './db.js';

// Extract the named values from the returned configuration or API object.
const { port, host, databasePath } = loadConfiguration();
const database = createDatabase(databasePath);
const clientDirectory = fileURLToPath(new URL('../client/', import.meta.url));
// Calculate or store serve client.
const serveClient =
  import.meta.url.endsWith('.js') && existsSync(join(clientDirectory, 'index.html'));
const app = createApp(database, { clientDirectory: serveClient ? clientDirectory : undefined });
// Calculate or store the HTTP listener or server settings.
const server = app.listen(port, host, () => {
  console.log(`Daymark ${serveClient ? 'app' : 'API'} is ready at http://${host}:${port}`);
});

// Call server.on with the values shown here.
server.on('error', (error) => {
  console.error('Could not start Daymark:', error.message);
  database.close();
  // Mark the process as failed without abruptly skipping cleanup.
  process.exitCode = 1;
});

let closing = false;
// Define the shutdown helper.
function shutdown() {
  if (closing) return;
  closing = true;
  // Stop accepting requests and run cleanup after the listener closes.
  server.close((error) => {
    database.close();
    if (error) process.exitCode = 1;
  });
  // Finish active requests, but do not let a keep-alive connection block shutdown.
  server.closeIdleConnections();
  setTimeout(() => server.closeAllConnections(), 5_000).unref();
}

// Register a process handler so shutdown or startup failure is handled explicitly.
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);

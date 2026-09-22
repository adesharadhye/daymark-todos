// Start the HTTP server and close its resources when the process shuts down.
// Import the required exports from node:fs.
import { existsSync } from 'node:fs';
// Import the required exports from node:path.
import { join } from 'node:path';
// Import the required exports from node:url.
import { fileURLToPath } from 'node:url';
// Import the required exports from ./app.js.
import { createApp } from './app.js';
// Import the required exports from ./config.js.
import { loadConfiguration } from './config.js';
// Import the required exports from ./db.js.
import { createDatabase } from './db.js';

// Extract the named values from the returned configuration or API object.
const { port, host, databasePath } = loadConfiguration();
// Calculate or store the SQLite connection.
const database = createDatabase(databasePath);
// Calculate or store the directory containing built HTML and assets.
const clientDirectory = fileURLToPath(new URL('../client/', import.meta.url));
// Calculate or store serve client.
const serveClient =
  // Call import.meta.url.endsWith with the values shown here.
  import.meta.url.endsWith('.js') && existsSync(join(clientDirectory, 'index.html'));
// Calculate or store the Express application.
const app = createApp(database, { clientDirectory: serveClient ? clientDirectory : undefined });
// Calculate or store the HTTP listener or server settings.
const server = app.listen(port, host, () => {
  // Write useful startup, seed, or failure information to the server console.
  console.log(`Daymark ${serveClient ? 'app' : 'API'} is ready at http://${host}:${port}`);
  // Close the current block or object.
});

// Call server.on with the values shown here.
server.on('error', (error) => {
  // Write useful startup, seed, or failure information to the server console.
  console.error('Could not start Daymark:', error.message);
  // Close this SQLite connection and release its file handles.
  database.close();
  // Mark the process as failed without abruptly skipping cleanup.
  process.exitCode = 1;
  // Close the current block or object.
});

// Reserve a variable for closing.
let closing = false;
// Define the shutdown helper.
function shutdown() {
  // Avoid running shutdown cleanup more than once.
  if (closing) return;
  // Update closing with the result of this expression.
  closing = true;
  // Stop accepting requests and run cleanup after the listener closes.
  server.close((error) => {
    // Close this SQLite connection and release its file handles.
    database.close();
    // Take this branch when the condition holds: error.
    if (error) process.exitCode = 1;
    // Close the current block or object.
  });
  // Finish active requests, but do not let a keep-alive connection block shutdown.
  // Stop accepting requests and run cleanup after the listener closes.
  server.closeIdleConnections();
  // Update the startup time limit in milliseconds in React state.
  setTimeout(() => server.closeAllConnections(), 5_000).unref();
  // Close the current block or object.
}

// Register a process handler so shutdown or startup failure is handled explicitly.
process.once('SIGINT', shutdown);
// Register a process handler so shutdown or startup failure is handled explicitly.
process.once('SIGTERM', shutdown);

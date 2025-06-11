#!/usr/bin/env ts-node

/**
 * Chokidar File Watcher for Nx Workspace
 *
 * This script watches for file changes in key directories of the Nx workspace
 * and logs them with timestamps for development and debugging purposes.
 *
 * Watched Directories:
 * - devspecs/    (Development specifications)
 * - apps/        (Application projects)
 * - libs/        (Library projects)
 * - types/       (TypeScript type definitions)
 *
 * Usage:
 *   npm run watch:chokidar
 *   or
 *   ts-node tools/watchers/chokidar-watcher.ts
 *
 * Log Format:
 *   [watch] {ChangeType}: {FilePath} @ {ISO-Timestamp}
 *
 * Examples:
 *   [watch] Changed: libs/energy/src/index.ts @ 2025-06-11T10:45:32Z
 *   [watch] Added: apps/web/src/components/Button.tsx @ 2025-06-11T10:46:15Z
 *   [watch] Removed: devspecs/api.md @ 2025-06-11T10:47:08Z
 */

import chokidar from 'chokidar';

// Directories to watch
const WATCH_DIRECTORIES = ['devspecs/', 'apps/', 'libs/', 'types/'];

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

/**
 * Formats and logs file change events
 */
function logChange(event: string, path: string): void {
  const timestamp = new Date().toISOString();
  const relativePath = path.replace(process.cwd() + '/', '');

  // Color-code different event types
  let eventColor = colors.blue;
  let eventLabel = 'Changed';

  switch (event) {
    case 'add':
      eventColor = colors.green;
      eventLabel = 'Added';
      break;
    case 'change':
      eventColor = colors.blue;
      eventLabel = 'Changed';
      break;
    case 'unlink':
      eventColor = colors.red;
      eventLabel = 'Removed';
      break;
    case 'addDir':
      eventColor = colors.cyan;
      eventLabel = 'Directory Added';
      break;
    case 'unlinkDir':
      eventColor = colors.yellow;
      eventLabel = 'Directory Removed';
      break;
  }

  // Format: [watch] EventType: filepath @ timestamp
  console.log(
    `${colors.bright}[watch]${colors.reset} ` +
      `${eventColor}${eventLabel}${colors.reset}: ` +
      `${relativePath} @ ${colors.cyan}${timestamp}${colors.reset}`
  );

  // Optional success indicator for file changes
  if (event === 'change' || event === 'add') {
    console.log(
      `${colors.green}✅ Detected change: ${relativePath.split('/').pop()}${colors.reset}`
    );
  }
}

/**
 * Initialize and start the file watcher
 */
function startWatcher(): void {
  console.log(`${colors.bright}${colors.blue}🔍 Starting Chokidar file watcher...${colors.reset}`);
  console.log(`${colors.cyan}Watching directories:${colors.reset}`);

  WATCH_DIRECTORIES.forEach((dir) => {
    console.log(`  • ${dir}`);
  });

  console.log(`${colors.yellow}Press Ctrl+C to stop watching${colors.reset}\n`);

  // Initialize chokidar watcher
  const watcher = chokidar.watch(WATCH_DIRECTORIES, {
    ignored: [
      '**/node_modules/**',
      '**/.git/**',
      '**/dist/**',
      '**/build/**',
      '**/.nx/**',
      '**/coverage/**',
      '**/*.log',
    ],
    ignoreInitial: false,
    persistent: true,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 100,
    },
  });

  // Register event handlers
  watcher
    .on('add', (path) => logChange('add', path))
    .on('change', (path) => logChange('change', path))
    .on('unlink', (path) => logChange('unlink', path))
    .on('addDir', (path) => logChange('addDir', path))
    .on('unlinkDir', (path) => logChange('unlinkDir', path))
    .on('error', (error) => {
      console.error(`${colors.red}❌ Watcher error: ${error}${colors.reset}`);
    })
    .on('ready', () => {
      console.log(
        `${colors.green}✅ File watcher ready and monitoring changes...${colors.reset}\n`
      );
    });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log(`\n${colors.yellow}🛑 Stopping file watcher...${colors.reset}`);
    watcher.close().then(() => {
      console.log(`${colors.green}✅ File watcher stopped successfully${colors.reset}`);
      process.exit(0);
    });
  });
}

// Start the watcher if this script is run directly
if (require.main === module) {
  startWatcher();
}

export { startWatcher, logChange };

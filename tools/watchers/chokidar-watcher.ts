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

import * as chokidar from 'chokidar';
import { TsMorphAnalyzer } from '../analyzers/ts-morph-analyzer';

export interface WatcherConfig {
  paths: string[];
  ignored?: string[];
  persistent?: boolean;
  ignoreInitial?: boolean;
  followSymlinks?: boolean;
  cwd?: string;
  depth?: number;
}

export interface FileChangeEvent {
  type: 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir';
  path: string;
  timestamp: string;
}

export type FileChangeEventType = FileChangeEvent['type'];

export class ChokidarWatcher {
  private watcher: chokidar.FSWatcher | null = null;
  private analyzer: TsMorphAnalyzer;
  private config: WatcherConfig;
  private eventCallbacks: Map<string, ((event: FileChangeEvent) => void)[]> = new Map();

  constructor(config: WatcherConfig, workspaceRoot: string = process.cwd()) {
    this.config = config;
    this.analyzer = new TsMorphAnalyzer(workspaceRoot);
    this.initializeEventCallbacks();
  }

  private initializeEventCallbacks(): void {
    this.eventCallbacks.set('add', []);
    this.eventCallbacks.set('change', []);
    this.eventCallbacks.set('unlink', []);
    this.eventCallbacks.set('addDir', []);
    this.eventCallbacks.set('unlinkDir', []);
  }

  /**
   * Start watching files
   */
  public start(): void {
    if (this.watcher) {
      console.log('⚠️ Watcher is already running');
      return;
    }

    const defaultIgnored = [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.nx/**',
      '**/coverage/**',
      '**/.git/**',
      '**/tmp/**',
      '**/*.log',
      '**/.DS_Store',
    ];

    const watchOptions = {
      ignored: [...defaultIgnored, ...(this.config.ignored || [])],
      persistent: this.config.persistent ?? true,
      ignoreInitial: this.config.ignoreInitial ?? true,
      followSymlinks: this.config.followSymlinks ?? false,
      cwd: this.config.cwd,
      depth: this.config.depth,
    };

    this.watcher = chokidar.watch(this.config.paths, watchOptions);

    // Set up event listeners
    this.watcher
      .on('add', (path: string) => this.handleFileEvent('add', path))
      .on('change', (path: string) => this.handleFileEvent('change', path))
      .on('unlink', (path: string) => this.handleFileEvent('unlink', path))
      .on('addDir', (path: string) => this.handleFileEvent('addDir', path))
      .on('unlinkDir', (path: string) => this.handleFileEvent('unlinkDir', path))
      .on('error', (error: unknown) => this.handleError(error as Error))
      .on('ready', () => this.handleReady());

    console.log('👀 File watcher started successfully');
    console.log(`📁 Watching paths: ${this.config.paths.join(', ')}`);
  }

  /**
   * Stop watching files
   */
  public async stop(): Promise<void> {
    if (!this.watcher) {
      console.log('⚠️ Watcher is not running');
      return;
    }

    await this.watcher.close();
    this.watcher = null;
    console.log('🛑 File watcher stopped');
  }

  /**
   * Add event callback
   */
  public on(event: FileChangeEventType, callback: (event: FileChangeEvent) => void): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      callbacks.push(callback);
    }
  }

  /**
   * Handle file system events
   */
  private handleFileEvent(type: FileChangeEvent['type'], path: string): void {
    const event: FileChangeEvent = {
      type,
      path,
      timestamp: new Date().toISOString(),
    };

    console.log(`📝 ${type.toUpperCase()}: ${path}`);

    // Execute callbacks
    const callbacks = this.eventCallbacks.get(type);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(event);
        } catch (error) {
          console.error(`❌ Error in ${type} callback:`, error);
        }
      });
    }

    // Handle TypeScript files specifically
    if (path.endsWith('.ts') || path.endsWith('.tsx')) {
      this.handleTypeScriptChange(event);
    }

    // Handle package.json changes
    if (path.endsWith('package.json')) {
      this.handlePackageJsonChange(event);
    }

    // Handle config file changes
    if (this.isConfigFile(path)) {
      this.handleConfigChange(event);
    }
  }

  /**
   * Handle TypeScript file changes
   */
  private handleTypeScriptChange(event: FileChangeEvent): void {
    console.log(`🔍 TypeScript file ${event.type}: ${event.path}`);

    if (event.type === 'change' || event.type === 'add') {
      // Trigger type analysis
      setTimeout(() => {
        try {
          this.analyzer.generateTypeReport();
          console.log('📊 Type analysis updated');
        } catch (error) {
          console.error('❌ Error updating type analysis:', error);
        }
      }, 1000); // Debounce to avoid too frequent updates
    }
  }

  /**
   * Handle package.json changes
   */
  private handlePackageJsonChange(event: FileChangeEvent): void {
    console.log(`📦 Package.json ${event.type}: ${event.path}`);

    if (event.type === 'change') {
      console.log('🔄 Dependencies may have changed, consider running npm install');
      // Could trigger dependency analysis here
    }
  }

  /**
   * Handle configuration file changes
   */
  private handleConfigChange(event: FileChangeEvent): void {
    console.log(`⚙️ Config file ${event.type}: ${event.path}`);

    if (event.type === 'change') {
      console.log('🔄 Configuration changed, consider restarting relevant services');
    }
  }

  /**
   * Handle watcher errors
   */
  private handleError(error: Error): void {
    console.error('❌ Watcher error:', error);
  }

  /**
   * Handle watcher ready state
   */
  private handleReady(): void {
    console.log('✅ File watcher is ready and monitoring changes');
  }

  /**
   * Check if file is a configuration file
   */
  private isConfigFile(path: string): boolean {
    const configFiles = [
      'tsconfig.json',
      'tsconfig.base.json',
      'nx.json',
      'project.json',
      'jest.config.ts',
      'jest.config.js',
      'vite.config.ts',
      'webpack.config.ts',
      'eslint.config.mjs',
      '.eslintrc.json',
      '.prettierrc',
      'vitest.config.ts',
    ];

    return configFiles.some((config) => path.endsWith(config));
  }

  /**
   * Get current watcher status
   */
  public getStatus(): { isRunning: boolean; watchedPaths: string[] } {
    return {
      isRunning: this.watcher !== null,
      watchedPaths: this.watcher ? Object.keys(this.watcher.getWatched() || {}) : [],
    };
  }
}

// CLI usage
if (require.main === module) {
  const watcher = new ChokidarWatcher({
    paths: ['apps/**', 'libs/**', 'tools/**'],
    ignored: ['**/*.spec.ts', '**/*.test.ts'],
    ignoreInitial: true,
  });

  // Add custom event handlers
  watcher.on('change', (event) => {
    console.log(`📈 SolariMonitor: File changed - ${event.path}`);
  });

  watcher.on('add', (event) => {
    console.log(`📈 SolariMonitor: New file added - ${event.path}`);
  });

  watcher.start();

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down watcher...');
    await watcher.stop();
    process.exit(0);
  });
}

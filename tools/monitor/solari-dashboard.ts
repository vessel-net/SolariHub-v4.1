import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { ChokidarWatcher } from '../watchers/chokidar-watcher';
import { TsMorphAnalyzer } from '../analyzers/ts-morph-analyzer';

export interface BuildStatus {
  project: string;
  status: 'success' | 'failed' | 'in-progress' | 'pending';
  timestamp: string;
  duration?: number;
  errors?: string[];
  warnings?: string[];
}

export interface TypeSafetyReport {
  totalFiles: number;
  totalErrors: number;
  totalWarnings: number;
  coverage: number;
  lastCheck: string;
  criticalIssues: string[];
}

export interface CoverageReport {
  percentage: number;
  lines: { total: number; covered: number };
  functions: { total: number; covered: number };
  branches: { total: number; covered: number };
  statements: { total: number; covered: number };
  lastRun: string;
}

export interface ModuleStatus {
  name: string;
  type: 'app' | 'lib' | 'tool';
  status: 'ready' | 'needs-attention' | 'broken' | 'unknown';
  lastModified: string;
  exports: number;
  imports: number;
  dependencies: string[];
  issues: string[];
}

export interface DashboardData {
  timestamp: string;
  buildStatuses: BuildStatus[];
  typeSafety: TypeSafetyReport;
  coverage: CoverageReport;
  moduleStatuses: ModuleStatus[];
  recentActivity: Array<{
    type: 'build' | 'test' | 'type-check' | 'file-change' | 'deployment';
    message: string;
    timestamp: string;
    status: 'success' | 'error' | 'info' | 'warning';
  }>;
  healthScore: number;
}

export class SolariDashboard {
  private workspaceRoot: string;
  private dashboardPath: string;
  private reportsPath: string;
  private watcher: ChokidarWatcher;
  private analyzer: TsMorphAnalyzer;

  constructor(workspaceRoot: string = process.cwd()) {
    this.workspaceRoot = workspaceRoot;
    this.reportsPath = join(workspaceRoot, 'reports');
    this.dashboardPath = join(this.reportsPath, 'solari-dashboard.json');

    // Ensure reports directory exists
    if (!existsSync(this.reportsPath)) {
      mkdirSync(this.reportsPath, { recursive: true });
    }

    this.analyzer = new TsMorphAnalyzer(workspaceRoot);
    this.watcher = new ChokidarWatcher({
      paths: ['apps/**', 'libs/**', 'tools/**'],
      ignored: ['**/*.spec.ts', '**/*.test.ts', '**/dist/**'],
      ignoreInitial: true,
    });

    this.setupWatcherCallbacks();
  }

  /**
   * Initialize the dashboard
   */
  public async initialize(): Promise<void> {
    console.log('🚀 Initializing SolariMonitor Dashboard...');

    await this.updateDashboard();
    this.watcher.start();

    console.log('✅ SolariMonitor Dashboard is now active');
    console.log(`📊 Dashboard data: ${this.dashboardPath}`);
  }

  /**
   * Stop the dashboard
   */
  public async stop(): Promise<void> {
    await this.watcher.stop();
    console.log('🛑 SolariMonitor Dashboard stopped');
  }

  /**
   * Update dashboard data
   */
  public async updateDashboard(): Promise<void> {
    const dashboardData: DashboardData = {
      timestamp: new Date().toISOString(),
      buildStatuses: this.getBuildStatuses(),
      typeSafety: this.getTypeSafetyReport(),
      coverage: this.getCoverageReport(),
      moduleStatuses: this.getModuleStatuses(),
      recentActivity: this.getRecentActivity(),
      healthScore: 0, // Will be calculated
    };

    // Calculate health score
    dashboardData.healthScore = this.calculateHealthScore(dashboardData);

    // Save dashboard data
    writeFileSync(this.dashboardPath, JSON.stringify(dashboardData, null, 2));

    console.log(`📊 Dashboard updated - Health Score: ${dashboardData.healthScore}%`);
  }

  /**
   * Get build statuses from recent builds
   */
  private getBuildStatuses(): BuildStatus[] {
    const statuses: BuildStatus[] = [];

    // Check for nx build cache and logs
    const nxCachePath = join(this.workspaceRoot, '.nx', 'cache');
    const hasNxCache = existsSync(nxCachePath);
    // TODO: Integrate with actual build status from nxCachePath

    // Default status for main projects
    const projects = ['backend', 'frontend', 'types'];

    projects.forEach((project) => {
      statuses.push({
        project,
        status: hasNxCache ? 'success' : 'pending', // Basic integration with nx cache
        timestamp: new Date().toISOString(),
        duration: Math.floor(Math.random() * 5000) + 1000, // Mock duration
        errors: [],
        warnings: [],
      });
    });

    return statuses;
  }

  /**
   * Get type safety report
   */
  private getTypeSafetyReport(): TypeSafetyReport {
    try {
      const typeSafety = this.analyzer.checkTypeSafety();
      const analysis = this.analyzer.analyzeWorkspace();

      return {
        totalFiles: analysis.length,
        totalErrors: typeSafety.errors.length,
        totalWarnings: typeSafety.warnings.length,
        coverage: this.calculateTypeCoverage(analysis),
        lastCheck: new Date().toISOString(),
        criticalIssues: typeSafety.errors.slice(0, 5), // Top 5 critical issues
      };
    } catch (error) {
      return {
        totalFiles: 0,
        totalErrors: 1,
        totalWarnings: 0,
        coverage: 0,
        lastCheck: new Date().toISOString(),
        criticalIssues: [`Type analysis failed: ${error}`],
      };
    }
  }

  /**
   * Get test coverage report
   */
  private getCoverageReport(): CoverageReport {
    // Try to read coverage from common locations
    // TODO: Integrate with actual coverage data from:
    // - coverage/coverage-summary.json
    // - coverage/lcov-report/index.html

    // Mock coverage data for now
    return {
      percentage: 85,
      lines: { total: 1000, covered: 850 },
      functions: { total: 200, covered: 170 },
      branches: { total: 150, covered: 120 },
      statements: { total: 1200, covered: 1020 },
      lastRun: new Date().toISOString(),
    };
  }

  /**
   * Get module statuses
   */
  private getModuleStatuses(): ModuleStatus[] {
    const analysis = this.analyzer.analyzeWorkspace();
    const modules: ModuleStatus[] = [];

    analysis.forEach((file) => {
      if (file.fileName.includes('/src/')) {
        const moduleName = this.extractModuleName(file.fileName);
        const moduleType = this.determineModuleType(file.fileName);

        modules.push({
          name: moduleName,
          type: moduleType,
          status: file.errors.length > 0 ? 'broken' : 'ready',
          lastModified: new Date().toISOString(),
          exports: file.exports.length,
          imports: file.imports.length,
          dependencies: file.imports,
          issues: file.errors,
        });
      }
    });

    return modules;
  }

  /**
   * Get recent activity
   */
  private getRecentActivity(): DashboardData['recentActivity'] {
    // Read from activity log if it exists
    const activityLogPath = join(this.reportsPath, 'activity.json');

    if (existsSync(activityLogPath)) {
      try {
        const activityData = JSON.parse(readFileSync(activityLogPath, 'utf8'));
        return activityData.slice(-10); // Last 10 activities
      } catch (error) {
        console.warn('Could not read activity log:', error);
      }
    }

    // Default recent activities
    return [
      {
        type: 'build',
        message: 'Backend build completed successfully',
        timestamp: new Date().toISOString(),
        status: 'success',
      },
      {
        type: 'type-check',
        message: 'Type analysis updated',
        timestamp: new Date().toISOString(),
        status: 'info',
      },
    ];
  }

  /**
   * Calculate overall health score
   */
  private calculateHealthScore(data: DashboardData): number {
    let score = 100;

    // Deduct for build failures
    const failedBuilds = data.buildStatuses.filter((b) => b.status === 'failed').length;
    score -= failedBuilds * 20;

    // Deduct for type errors
    score -= Math.min(data.typeSafety.totalErrors * 5, 30);

    // Deduct for low coverage
    if (data.coverage.percentage < 80) {
      score -= 80 - data.coverage.percentage;
    }

    // Deduct for broken modules
    const brokenModules = data.moduleStatuses.filter((m) => m.status === 'broken').length;
    score -= brokenModules * 10;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Calculate type coverage
   */
  private calculateTypeCoverage(
    analysis: {
      functions: unknown[];
      classes: unknown[];
      interfaces: unknown[];
      types: unknown[];
    }[]
  ): number {
    const totalItems = analysis.reduce(
      (sum, file) => sum + file.functions.length + file.classes.length + file.interfaces.length,
      0
    );

    const typedItems = analysis.reduce(
      (sum, file) => sum + file.interfaces.length + file.types.length,
      0
    );

    return totalItems > 0 ? Math.round((typedItems / totalItems) * 100) : 100;
  }

  /**
   * Extract module name from file path
   */
  private extractModuleName(filePath: string): string {
    const parts = filePath.split('/');
    const srcIndex = parts.findIndex((part) => part === 'src');

    if (srcIndex > 0) {
      return parts[srcIndex - 1];
    }

    return parts[parts.length - 1].replace(/\.(ts|tsx)$/, '');
  }

  /**
   * Determine module type from file path
   */
  private determineModuleType(filePath: string): 'app' | 'lib' | 'tool' {
    if (filePath.includes('/apps/')) return 'app';
    if (filePath.includes('/libs/')) return 'lib';
    if (filePath.includes('/tools/')) return 'tool';
    return 'lib';
  }

  /**
   * Setup watcher callbacks
   */
  private setupWatcherCallbacks(): void {
    this.watcher.on('change', (event) => {
      this.logActivity('file-change', `File changed: ${event.path}`, 'info');
      // Debounced dashboard update
      setTimeout(() => this.updateDashboard(), 2000);
    });

    this.watcher.on('add', (event) => {
      this.logActivity('file-change', `New file added: ${event.path}`, 'success');
      setTimeout(() => this.updateDashboard(), 2000);
    });
  }

  /**
   * Log activity to the activity log
   */
  private logActivity(
    type: DashboardData['recentActivity'][0]['type'],
    message: string,
    status: DashboardData['recentActivity'][0]['status']
  ): void {
    const activityLogPath = join(this.reportsPath, 'activity.json');
    let activities: DashboardData['recentActivity'] = [];

    if (existsSync(activityLogPath)) {
      try {
        activities = JSON.parse(readFileSync(activityLogPath, 'utf8'));
      } catch (error) {
        console.warn('Could not read activity log:', error);
      }
    }

    activities.push({
      type,
      message,
      timestamp: new Date().toISOString(),
      status,
    });

    // Keep only last 50 activities
    if (activities.length > 50) {
      activities = activities.slice(-50);
    }

    writeFileSync(activityLogPath, JSON.stringify(activities, null, 2));
  }

  /**
   * Generate HTML dashboard
   */
  public generateHTMLDashboard(): string {
    const data: DashboardData = existsSync(this.dashboardPath)
      ? JSON.parse(readFileSync(this.dashboardPath, 'utf8'))
      : this.getDefaultDashboardData();

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SolariMonitor Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .dashboard { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; }
        .health-score { font-size: 3em; font-weight: bold; color: ${data.healthScore > 80 ? '#22c55e' : data.healthScore > 60 ? '#f59e0b' : '#ef4444'}; }
        .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .card h3 { margin: 0 0 15px 0; color: #333; }
        .status-good { color: #22c55e; }
        .status-warning { color: #f59e0b; }
        .status-error { color: #ef4444; }
        .module-list { list-style: none; padding: 0; }
        .module-item { padding: 8px; margin: 4px 0; background: #f9f9f9; border-radius: 4px; }
        .activity-list { list-style: none; padding: 0; max-height: 300px; overflow-y: auto; }
        .activity-item { padding: 8px; margin: 4px 0; border-left: 4px solid #ddd; padding-left: 12px; }
        .activity-success { border-left-color: #22c55e; }
        .activity-error { border-left-color: #ef4444; }
        .activity-warning { border-left-color: #f59e0b; }
        .activity-info { border-left-color: #3b82f6; }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="header">
            <h1>🌟 SolariMonitor Dashboard</h1>
            <div class="health-score">${data.healthScore}%</div>
            <p>Overall System Health</p>
            <small>Last updated: ${new Date(data.timestamp).toLocaleString()}</small>
        </div>

        <div class="cards">
            <div class="card">
                <h3>📊 Type Safety</h3>
                <p>Files: <strong>${data.typeSafety.totalFiles}</strong></p>
                <p>Errors: <span class="${data.typeSafety.totalErrors > 0 ? 'status-error' : 'status-good'}">${data.typeSafety.totalErrors}</span></p>
                <p>Warnings: <span class="${data.typeSafety.totalWarnings > 0 ? 'status-warning' : 'status-good'}">${data.typeSafety.totalWarnings}</span></p>
                <p>Coverage: <strong>${data.typeSafety.coverage}%</strong></p>
            </div>

            <div class="card">
                <h3>🔨 Build Status</h3>
                ${data.buildStatuses
                  .map(
                    (build) => `
                    <p>${build.project}: <span class="status-${build.status === 'success' ? 'good' : 'error'}">${build.status}</span></p>
                `
                  )
                  .join('')}
            </div>

            <div class="card">
                <h3>📈 Test Coverage</h3>
                <p>Overall: <strong>${data.coverage.percentage}%</strong></p>
                <p>Lines: ${data.coverage.lines.covered}/${data.coverage.lines.total}</p>
                <p>Functions: ${data.coverage.functions.covered}/${data.coverage.functions.total}</p>
                <p>Branches: ${data.coverage.branches.covered}/${data.coverage.branches.total}</p>
            </div>

            <div class="card">
                <h3>📦 Modules</h3>
                <ul class="module-list">
                    ${data.moduleStatuses
                      .slice(0, 10)
                      .map(
                        (module) => `
                        <li class="module-item">
                            <strong>${module.name}</strong> (${module.type})
                            <span class="status-${module.status === 'ready' ? 'good' : 'error'}">${module.status}</span>
                        </li>
                    `
                      )
                      .join('')}
                </ul>
            </div>

            <div class="card">
                <h3>🔄 Recent Activity</h3>
                <ul class="activity-list">
                    ${data.recentActivity
                      .map(
                        (activity) => `
                        <li class="activity-item activity-${activity.status}">
                            <strong>${activity.type}:</strong> ${activity.message}
                            <br><small>${new Date(activity.timestamp).toLocaleString()}</small>
                        </li>
                    `
                      )
                      .join('')}
                </ul>
            </div>
        </div>
    </div>
</body>
</html>`;

    const htmlPath = join(this.reportsPath, 'dashboard.html');
    writeFileSync(htmlPath, html);
    console.log(`📄 HTML Dashboard generated: ${htmlPath}`);

    return htmlPath;
  }

  private getDefaultDashboardData(): DashboardData {
    return {
      timestamp: new Date().toISOString(),
      buildStatuses: [],
      typeSafety: {
        totalFiles: 0,
        totalErrors: 0,
        totalWarnings: 0,
        coverage: 0,
        lastCheck: new Date().toISOString(),
        criticalIssues: [],
      },
      coverage: {
        percentage: 0,
        lines: { total: 0, covered: 0 },
        functions: { total: 0, covered: 0 },
        branches: { total: 0, covered: 0 },
        statements: { total: 0, covered: 0 },
        lastRun: new Date().toISOString(),
      },
      moduleStatuses: [],
      recentActivity: [],
      healthScore: 0,
    };
  }
}

// CLI usage
if (require.main === module) {
  const dashboard = new SolariDashboard();

  dashboard.initialize().then(() => {
    console.log('🎯 SolariMonitor Dashboard is running...');
    dashboard.generateHTMLDashboard();

    // Update dashboard every 30 seconds
    setInterval(() => {
      dashboard.updateDashboard();
      dashboard.generateHTMLDashboard();
    }, 30000);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down SolariMonitor...');
    await dashboard.stop();
    process.exit(0);
  });
}

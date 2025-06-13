#!/usr/bin/env node

import { Command } from 'commander';
import { TsMorphAnalyzer } from '../analyzers/ts-morph-analyzer';
import { ChokidarWatcher } from '../watchers/chokidar-watcher';
import { SolariDashboard } from '../monitor/solari-dashboard';
import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const program = new Command();

class SolariCLI {
  private analyzer: TsMorphAnalyzer;
  private dashboardInstance: SolariDashboard;
  private workspaceRoot: string;

  constructor() {
    this.workspaceRoot = process.cwd();
    this.analyzer = new TsMorphAnalyzer(this.workspaceRoot);
    this.dashboardInstance = new SolariDashboard(this.workspaceRoot);
  }

  /**
   * Initialize SolariMonitor
   */
  async init(): Promise<void> {
    console.log('🚀 Initializing SolariMonitor...');
    
    // Create necessary directories
    const dirs = ['reports', 'scaffolds', 'tools/analyzers', 'tools/watchers', 'tools/monitor'];
    dirs.forEach(dir => {
      const dirPath = join(this.workspaceRoot, dir);
      if (!existsSync(dirPath)) {
        execSync(`mkdir -p "${dirPath}"`);
        console.log(`📁 Created directory: ${dir}`);
      }
    });

    // Initialize dashboard
    await this.dashboardInstance.initialize();
    
    console.log('✅ SolariMonitor initialized successfully!');
    console.log('\n📋 Available commands:');
    console.log('  • solari analyze - Run type analysis');
    console.log('  • solari watch - Start file watcher');
    console.log('  • solari dashboard - Open dashboard');
    console.log('  • solari scaffold <type> <name> - Generate scaffolding');
    console.log('  • solari test <module> - Test specific module');
    console.log('  • solari health - Show system health');
  }

  /**
   * Run type analysis
   */
  async analyze(): Promise<void> {
    console.log('🔍 Running TypeScript analysis...');
    
    try {
      this.analyzer.generateTypeReport();
      const typeSafety = this.analyzer.checkTypeSafety();
      
      console.log('\n📊 Analysis Results:');
      console.log(`✅ Errors: ${typeSafety.errors.length}`);
      console.log(`⚠️ Warnings: ${typeSafety.warnings.length}`);
      
      if (typeSafety.errors.length > 0) {
        console.log('\n❌ Type Errors:');
        typeSafety.errors.slice(0, 5).forEach(error => {
          console.log(`  • ${error}`);
        });
      }
      
      if (typeSafety.warnings.length > 0) {
        console.log('\n⚠️ Type Warnings:');
        typeSafety.warnings.slice(0, 5).forEach(warning => {
          console.log(`  • ${warning}`);
        });
      }
      
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      process.exit(1);
    }
  }

  /**
   * Start file watcher
   */
  async watch(): Promise<void> {
    console.log('👀 Starting file watcher...');
    
    const watcher = new ChokidarWatcher({
      paths: ['apps/**', 'libs/**', 'tools/**'],
      ignored: ['**/*.spec.ts', '**/*.test.ts'],
      ignoreInitial: true
    });

    watcher.on('change', (event) => {
      console.log(`📝 File changed: ${event.path}`);
    });

    watcher.on('add', (event) => {
      console.log(`➕ File added: ${event.path}`);
    });

    watcher.start();

    console.log('✅ File watcher started. Press Ctrl+C to stop.');

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Stopping file watcher...');
      await watcher.stop();
      process.exit(0);
    });
  }

  /**
   * Open dashboard
   */
  async openDashboard(): Promise<void> {
    console.log('📊 Generating dashboard...');
    
    await this.dashboardInstance.updateDashboard();
    const htmlPath = this.dashboardInstance.generateHTMLDashboard();
    
    console.log(`📄 Dashboard generated: ${htmlPath}`);
    
    // Try to open in browser
    try {
      const platform = process.platform;
      if (platform === 'darwin') {
        execSync(`open "${htmlPath}"`);
      } else if (platform === 'win32') {
        execSync(`start "${htmlPath}"`);
      } else {
        execSync(`xdg-open "${htmlPath}"`);
      }
      console.log('🌐 Dashboard opened in browser');
    } catch (error) {
      console.log('💡 Please open the HTML file manually in your browser');
    }
  }

  /**
   * Generate scaffolding
   */
  async scaffold(type: string, name: string): Promise<void> {
    console.log(`🏗️ Generating ${type} scaffold: ${name}`);
    
    const validTypes = ['component', 'service', 'lib'];
    if (!validTypes.includes(type)) {
      console.error(`❌ Invalid scaffold type. Use: ${validTypes.join(', ')}`);
      process.exit(1);
    }

    try {
      this.analyzer.generateScaffold(name, type as any);
      console.log('✅ Scaffold generated successfully!');
      
      // Update dashboard
      await this.dashboardInstance.updateDashboard();
      
    } catch (error) {
      console.error('❌ Scaffold generation failed:', error);
      process.exit(1);
    }
  }

  /**
   * Test specific module
   */
  async testModule(moduleName: string): Promise<void> {
    console.log(`🧪 Testing module: ${moduleName}`);
    
    try {
      // Check if module exists
      const moduleAppsPath = join(this.workspaceRoot, 'apps', moduleName);
      const moduleLibsPath = join(this.workspaceRoot, 'libs', moduleName);
      
      let modulePath = '';
      if (existsSync(moduleAppsPath)) {
        modulePath = `apps/${moduleName}`;
      } else if (existsSync(moduleLibsPath)) {
        modulePath = `libs/${moduleName}`;
      } else {
        console.error(`❌ Module '${moduleName}' not found in apps/ or libs/`);
        process.exit(1);
      }

      // Run tests
      console.log(`🔄 Running tests for ${modulePath}...`);
      execSync(`npx nx test ${moduleName}`, { stdio: 'inherit' });
      
      console.log('✅ Tests completed successfully!');
      
    } catch (error) {
      console.error('❌ Tests failed:', error);
      process.exit(1);
    }
  }

  /**
   * Show system health
   */
  async health(): Promise<void> {
    console.log('🏥 Checking system health...');
    
    await this.dashboardInstance.updateDashboard();
    
    // Read dashboard data
    const dashboardPath = join(this.workspaceRoot, 'reports', 'solari-dashboard.json');
    if (!existsSync(dashboardPath)) {
      console.error('❌ Dashboard data not found. Run `solari init` first.');
      process.exit(1);
    }

    const data = JSON.parse(readFileSync(dashboardPath, 'utf8'));
    
    console.log(`\n🌟 Overall Health Score: ${data.healthScore}%`);
    
    // Type Safety
    console.log('\n📊 Type Safety:');
    console.log(`  Files: ${data.typeSafety.totalFiles}`);
    console.log(`  Errors: ${data.typeSafety.totalErrors}`);
    console.log(`  Warnings: ${data.typeSafety.totalWarnings}`);
    console.log(`  Coverage: ${data.typeSafety.coverage}%`);
    
    // Build Status
    console.log('\n🔨 Build Status:');
    data.buildStatuses.forEach((build: any) => {
      const status = build.status === 'success' ? '✅' : '❌';
      console.log(`  ${status} ${build.project}: ${build.status}`);
    });
    
    // Coverage
    console.log('\n📈 Test Coverage:');
    console.log(`  Overall: ${data.coverage.percentage}%`);
    console.log(`  Lines: ${data.coverage.lines.covered}/${data.coverage.lines.total}`);
    
    // Modules
    console.log('\n📦 Module Status:');
    const readyModules = data.moduleStatuses.filter((m: any) => m.status === 'ready').length;
    const brokenModules = data.moduleStatuses.filter((m: any) => m.status === 'broken').length;
    console.log(`  Ready: ${readyModules}`);
    console.log(`  Broken: ${brokenModules}`);
    
    // Health recommendations
    if (data.healthScore < 80) {
      console.log('\n💡 Recommendations:');
      if (data.typeSafety.totalErrors > 0) {
        console.log('  • Fix type errors to improve type safety');
      }
      if (data.coverage.percentage < 80) {
        console.log('  • Increase test coverage');
      }
      if (brokenModules > 0) {
        console.log('  • Fix broken modules');
      }
    }
  }

  /**
   * Build specific project
   */
  async build(projectName: string): Promise<void> {
    console.log(`🔨 Building project: ${projectName}`);
    
    try {
      execSync(`npx nx build ${projectName}`, { stdio: 'inherit' });
      console.log('✅ Build completed successfully!');
      
      // Update dashboard
      await this.dashboardInstance.updateDashboard();
      
    } catch (error) {
      console.error('❌ Build failed:', error);
      process.exit(1);
    }
  }

  /**
   * Deploy project
   */
  async deploy(projectName: string): Promise<void> {
    console.log(`🚀 Deploying project: ${projectName}`);
    
    try {
      // First build the project
      execSync(`npx nx build ${projectName} --prod`, { stdio: 'inherit' });
      
      // Deploy based on project type - both go to Render now
      console.log('🔄 Deploying to Render...');
      execSync('git push origin main', { stdio: 'inherit' });
      
      console.log('✅ Deployment initiated successfully!');
      
    } catch (error) {
      console.error('❌ Deployment failed:', error);
      process.exit(1);
    }
  }

  /**
   * Lint and fix code
   */
  async lint(fix: boolean = false): Promise<void> {
    console.log('🔍 Running linter...');
    
    try {
      const command = fix ? 'npx nx lint --fix' : 'npx nx lint';
      execSync(command, { stdio: 'inherit' });
      console.log('✅ Linting completed successfully!');
      
    } catch (error) {
      console.error('❌ Linting failed:', error);
      process.exit(1);
    }
  }

  /**
   * Run migration
   */
  async migrate(): Promise<void> {
    console.log('🔄 Running TypeScript migration...');
    
    try {
      // This would integrate with ts-migrate when configured
      console.log('💡 Migration tools will be configured in future updates');
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
  }
}

// CLI Setup
program
  .name('solari')
  .description('SolariMonitor CLI - Development Assistant for SolariHub')
  .version('1.0.0');

const cli = new SolariCLI();

program
  .command('init')
  .description('Initialize SolariMonitor')
  .action(() => cli.init());

program
  .command('analyze')
  .description('Run TypeScript analysis')
  .action(() => cli.analyze());

program
  .command('watch')
  .description('Start file watcher')
  .action(() => cli.watch());

program
  .command('dashboard')
  .description('Open SolariMonitor dashboard')
  .action(() => cli.openDashboard());

program
  .command('scaffold <type> <name>')
  .description('Generate scaffolding (component, service, lib)')
  .action((type, name) => cli.scaffold(type, name));

program
  .command('test <module>')
  .description('Test specific module')
  .action((module) => cli.testModule(module));

program
  .command('health')
  .description('Show system health')
  .action(() => cli.health());

program
  .command('build <project>')
  .description('Build specific project')
  .action((project) => cli.build(project));

program
  .command('deploy <project>')
  .description('Deploy specific project')
  .action((project) => cli.deploy(project));

program
  .command('lint')
  .description('Run linter')
  .option('--fix', 'Auto-fix linting issues')
  .action((options) => cli.lint(options.fix));

program
  .command('migrate')
  .description('Run TypeScript migration')
  .action(() => cli.migrate());

// Parse CLI arguments
program.parse();

export { SolariCLI }; 
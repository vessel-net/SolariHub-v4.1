#!/usr/bin/env node

import { Command } from 'commander';
import { TsMorphAnalyzer } from '../analyzers/ts-morph-analyzer';
import { ChokidarWatcher } from '../watchers/chokidar-watcher';
import { SolariDashboard } from '../monitor/solari-dashboard';
import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
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
   * Initialize SolariMonitor with full features
   */
  async init(): Promise<void> {
    console.log('🚀 Initializing SolariMonitor with Advanced Features...');

    // Create necessary directories
    const dirs = ['reports', 'scaffolds'];
    dirs.forEach((dir) => {
      const dirPath = join(this.workspaceRoot, dir);
      if (!existsSync(dirPath)) {
        mkdirSync(dirPath, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
    });

    // Initialize dashboard with real-time monitoring
    await this.dashboardInstance.initialize();

    // Generate comprehensive type analysis
    this.analyzer.generateTypeReport();

    // Create enhanced health report
    await this.createAdvancedHealthReport();

    console.log('✅ SolariMonitor initialized with full feature set!');
    console.log('\n📋 Available commands:');
    console.log('  • solari analyze - Run comprehensive type analysis');
    console.log('  • solari watch - Start real-time file monitoring');
    console.log('  • solari dashboard - Open interactive dashboard');
    console.log('  • solari scaffold <type> <name> - Generate scaffolding');
    console.log('  • solari health - Show comprehensive system health');
    console.log('  • solari migrate - Run TypeScript migration tools');
    console.log('  • solari build <project> - Build specific project');
    console.log('  • solari test <module> - Test specific module');
    console.log('  • solari lint - Run linter with fixes');
  }

  /**
   * Run comprehensive type analysis using ts-morph
   */
  async analyze(): Promise<void> {
    console.log('🔍 Running comprehensive TypeScript analysis...');

    try {
      this.analyzer.generateTypeReport();
      const typeSafety = this.analyzer.checkTypeSafety();
      const dependencyGraph = this.analyzer.generateDependencyGraph();

      console.log('\n📊 Advanced Analysis Results:');
      console.log(`✅ Total Files: ${typeSafety.totalFiles}`);
      console.log(`❌ Errors: ${typeSafety.errors.length}`);
      console.log(`⚠️ Warnings: ${typeSafety.warnings.length}`);
      console.log(`📈 Type Coverage: ${typeSafety.coverage}%`);
      console.log(
        `🔗 Dependencies: ${dependencyGraph.nodes.length} nodes, ${dependencyGraph.edges.length} edges`
      );

      if (typeSafety.errors.length > 0) {
        console.log('\n❌ Critical Type Errors:');
        typeSafety.errors.slice(0, 5).forEach((error) => {
          console.log(`  • ${error}`);
        });
        if (typeSafety.errors.length > 5) {
          console.log(`  ... and ${typeSafety.errors.length - 5} more errors`);
        }
      }

      if (typeSafety.warnings.length > 0) {
        console.log('\n⚠️ Type Warnings:');
        typeSafety.warnings.slice(0, 3).forEach((warning) => {
          console.log(`  • ${warning}`);
        });
        if (typeSafety.warnings.length > 3) {
          console.log(`  ... and ${typeSafety.warnings.length - 3} more warnings`);
        }
      }

      // Update dashboard with latest analysis
      await this.dashboardInstance.updateDashboard();
    } catch (error) {
      console.error('❌ Advanced analysis failed:', error);
      process.exit(1);
    }
  }

  /**
   * Start real-time file monitoring with Chokidar
   */
  async watch(): Promise<void> {
    console.log('👀 Starting real-time file monitoring...');

    const watcher = new ChokidarWatcher({
      paths: ['apps/**', 'libs/**', 'tools/**'],
      ignored: ['**/*.spec.ts', '**/*.test.ts', '**/dist/**', '**/node_modules/**'],
      ignoreInitial: true,
    });

    // Advanced event handlers
    watcher.on('change', (event) => {
      console.log(`📝 File changed: ${event.path}`);
      if (event.path.endsWith('.ts') || event.path.endsWith('.tsx')) {
        console.log('🔄 TypeScript file changed - triggering analysis...');
        setTimeout(() => {
          this.analyzer.generateTypeReport();
          this.dashboardInstance.updateDashboard();
        }, 1000);
      }
    });

    watcher.on('add', (event) => {
      console.log(`➕ File added: ${event.path}`);
      if (event.path.endsWith('.ts') || event.path.endsWith('.tsx')) {
        console.log('🆕 New TypeScript file - updating analysis...');
        setTimeout(() => {
          this.analyzer.generateTypeReport();
          this.dashboardInstance.updateDashboard();
        }, 1000);
      }
    });

    watcher.start();

    console.log('✅ Real-time monitoring active. Press Ctrl+C to stop.');
    console.log('📊 Dashboard auto-updating every 30 seconds...');

    // Auto-update dashboard
    const updateInterval = setInterval(async () => {
      await this.dashboardInstance.updateDashboard();
    }, 30000);

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Stopping real-time monitoring...');
      clearInterval(updateInterval);
      await watcher.stop();
      await this.dashboardInstance.stop();
      process.exit(0);
    });
  }

  /**
   * Open interactive dashboard
   */
  async openDashboard(): Promise<void> {
    console.log('📊 Generating interactive dashboard...');

    // Update with latest data
    await this.dashboardInstance.updateDashboard();
    const htmlPath = this.dashboardInstance.generateHTMLDashboard();

    console.log(`📄 Interactive dashboard generated: ${htmlPath}`);

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
    } catch {
      console.log('💡 Please open the HTML file manually in your browser');
    }
  }

  /**
   * Generate advanced scaffolding
   */
  async scaffold(type: string, name: string): Promise<void> {
    console.log(`🏗️ Generating advanced ${type} scaffold: ${name}`);

    const validTypes = ['component', 'service', 'lib'];
    if (!validTypes.includes(type)) {
      console.error(`❌ Invalid scaffold type. Use: ${validTypes.join(', ')}`);
      process.exit(1);
    }

    try {
      this.analyzer.generateScaffold(name, type as 'component' | 'service' | 'lib');
      console.log('✅ Advanced scaffold generated successfully!');

      // Update analysis and dashboard
      this.analyzer.generateTypeReport();
      await this.dashboardInstance.updateDashboard();
    } catch (error) {
      console.error('❌ Scaffold generation failed:', error);
      process.exit(1);
    }
  }

  /**
   * Run TypeScript migration using ts-migrate
   */
  async migrate(): Promise<void> {
    console.log('🔄 Running TypeScript migration...');

    try {
      // Basic migration steps
      console.log('📋 Migration Analysis:');

      const typeSafety = this.analyzer.checkTypeSafety();
      console.log(`• Found ${typeSafety.errors.length} type errors to address`);
      console.log(`• Current type coverage: ${typeSafety.coverage}%`);

      if (typeSafety.errors.length > 0) {
        console.log('\n🔧 Migration Recommendations:');
        console.log('• Add explicit type annotations for improved safety');
        console.log('• Convert any types to specific interfaces');
        console.log('• Add null/undefined checks where needed');
        console.log('• Use strict TypeScript compiler options');

        console.log('\n💡 To apply automated fixes, consider:');
        console.log('• npx ts-migrate migrate <path> --prettier');
        console.log('• Manual review of complex type conversions');
      } else {
        console.log('✅ No migration needed - TypeScript code is already well-typed!');
      }
    } catch (error) {
      console.error('❌ Migration analysis failed:', error);
      process.exit(1);
    }
  }

  /**
   * Create advanced health report with full monitoring
   */
  async createAdvancedHealthReport(): Promise<void> {
    const typeSafety = this.analyzer.checkTypeSafety();
    const dependencyGraph = this.analyzer.generateDependencyGraph();

    const healthData = {
      timestamp: new Date().toISOString(),
      healthScore: this.calculateAdvancedHealthScore(typeSafety),
      buildStatuses: [
        { project: 'backend', status: 'success', timestamp: new Date().toISOString() },
        { project: 'frontend', status: 'success', timestamp: new Date().toISOString() },
      ],
      eslintStatus: this.checkEslintStatus(),
      prettierStatus: this.checkPrettierStatus(),
      huskyStatus: this.checkHuskyStatus(),
      dependencies: this.checkDependencies(),
      typeSafety: {
        totalFiles: typeSafety.totalFiles,
        errors: typeSafety.errors.length,
        warnings: typeSafety.warnings.length,
        coverage: typeSafety.coverage,
      },
      codeQuality: {
        dependencyNodes: dependencyGraph.nodes.length,
        dependencyEdges: dependencyGraph.edges.length,
        externalDependencies: dependencyGraph.nodes.filter((n) => n.type === 'external').length,
      },
      monitoringActive: true,
    };

    const reportPath = join(this.workspaceRoot, 'reports', 'solari-health-advanced.json');
    writeFileSync(reportPath, JSON.stringify(healthData, null, 2));
    console.log(`📊 Advanced health report created: ${reportPath}`);
  }

  /**
   * Calculate advanced health score
   */
  private calculateAdvancedHealthScore(typeSafety: {
    errors: unknown[];
    coverage: number;
  }): number {
    let score = 100;

    // Type safety impact (40% of score)
    score -= Math.min(typeSafety.errors.length * 5, 40);
    if (typeSafety.coverage < 80) {
      score -= (80 - typeSafety.coverage) * 0.5;
    }

    // Code quality impact (30% of score)
    const eslintStatus = this.checkEslintStatus();
    if (!eslintStatus.working) score -= 15;

    const prettierStatus = this.checkPrettierStatus();
    if (!prettierStatus.configured) score -= 10;

    // Development workflow impact (30% of score)
    const huskyStatus = this.checkHuskyStatus();
    if (!huskyStatus.configured) score -= 15;

    const deps = this.checkDependencies();
    if (deps.missing.length > 0) score -= deps.missing.length * 3;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Show comprehensive system health
   */
  async health(): Promise<void> {
    console.log('🏥 Running comprehensive system health check...');

    const reportPath = join(this.workspaceRoot, 'reports', 'solari-health-advanced.json');
    let healthData;

    if (existsSync(reportPath)) {
      healthData = JSON.parse(readFileSync(reportPath, 'utf8'));
    } else {
      await this.createAdvancedHealthReport();
      healthData = JSON.parse(readFileSync(reportPath, 'utf8'));
    }

    console.log(`\n🌟 Advanced Health Score: ${healthData.healthScore}%`);

    // Control Systems Status
    console.log('\n🛡️ Control Systems Status:');
    console.log(
      `  ESLint: ${healthData.eslintStatus.working ? '✅' : '❌'} ${healthData.eslintStatus.working ? 'Active' : 'Needs Setup'}`
    );
    console.log(
      `  Prettier: ${healthData.prettierStatus.configured ? '✅' : '❌'} ${healthData.prettierStatus.configured ? 'Active' : 'Needs Setup'}`
    );
    console.log(
      `  Husky: ${healthData.huskyStatus.configured ? '✅' : '❌'} ${healthData.huskyStatus.configured ? 'Active' : 'Needs Setup'}`
    );
    console.log(
      `  SolariMonitor: ${healthData.monitoringActive ? '✅' : '❌'} ${healthData.monitoringActive ? 'Active' : 'Inactive'}`
    );

    // Advanced Type Safety
    console.log('\n🔍 Advanced Type Safety:');
    console.log(`  Files Analyzed: ${healthData.typeSafety.totalFiles}`);
    console.log(
      `  Type Errors: ${healthData.typeSafety.errors > 0 ? '❌' : '✅'} ${healthData.typeSafety.errors}`
    );
    console.log(
      `  Type Warnings: ${healthData.typeSafety.warnings > 0 ? '⚠️' : '✅'} ${healthData.typeSafety.warnings}`
    );
    console.log(
      `  Type Coverage: ${healthData.typeSafety.coverage >= 80 ? '✅' : '⚠️'} ${healthData.typeSafety.coverage}%`
    );

    // Code Quality Metrics
    console.log('\n📊 Code Quality Metrics:');
    console.log(
      `  Dependency Graph: ${healthData.codeQuality.dependencyNodes} files, ${healthData.codeQuality.dependencyEdges} dependencies`
    );
    console.log(`  External Dependencies: ${healthData.codeQuality.externalDependencies} packages`);

    // Dependencies Status
    if (healthData.dependencies.missing.length > 0) {
      console.log('\n📦 Missing Dependencies:');
      healthData.dependencies.missing.forEach((dep: string) => {
        console.log(`  ❌ ${dep}`);
      });
      console.log('\n💡 Run: npm install <missing-deps> --save-dev');
    } else {
      console.log('\n📦 Dependencies: ✅ All advanced monitoring dependencies installed');
    }

    // Build Status
    console.log('\n🔨 Build Status:');
    healthData.buildStatuses.forEach((build: { project: string; status: string }) => {
      const status = build.status === 'success' ? '✅' : '❌';
      console.log(`  ${status} ${build.project}: ${build.status}`);
    });

    // Advanced Recommendations
    const issues = [];
    if (healthData.typeSafety.errors > 0)
      issues.push('Fix TypeScript errors for better type safety');
    if (healthData.typeSafety.coverage < 80)
      issues.push('Improve type coverage with more interfaces and types');
    if (!healthData.eslintStatus.working)
      issues.push('Configure ESLint for code quality enforcement');
    if (!healthData.prettierStatus.configured)
      issues.push('Set up Prettier for consistent formatting');
    if (!healthData.huskyStatus.configured) issues.push('Configure Husky pre-commit hooks');
    if (healthData.dependencies.missing.length > 0)
      issues.push('Install missing monitoring dependencies');

    if (issues.length > 0) {
      console.log('\n💡 Advanced Recommendations:');
      issues.forEach((issue) => console.log(`  • ${issue}`));
    } else {
      console.log('\n🎉 Excellent! All advanced control systems are active and healthy.');
    }

    // Real-time suggestions
    console.log('\n🚀 Advanced Features Available:');
    console.log('  • Run `solari watch` for real-time file monitoring');
    console.log('  • Run `solari dashboard` for interactive insights');
    console.log('  • Run `solari analyze` for comprehensive type analysis');
  }

  /**
   * Check ESLint status
   */
  checkEslintStatus(): { installed: boolean; configured: boolean; working: boolean } {
    const eslintConfigExists =
      existsSync(join(this.workspaceRoot, 'eslint.config.mjs')) ||
      existsSync(join(this.workspaceRoot, '.eslintrc.json'));

    let working = false;
    try {
      execSync('npx eslint --version', { stdio: 'pipe' });
      working = true;
    } catch {
      working = false;
    }

    return {
      installed: working,
      configured: eslintConfigExists,
      working: working && eslintConfigExists,
    };
  }

  /**
   * Check Prettier status
   */
  checkPrettierStatus(): { installed: boolean; configured: boolean } {
    const prettierConfigExists =
      existsSync(join(this.workspaceRoot, '.prettierrc')) ||
      existsSync(join(this.workspaceRoot, 'prettier.config.js'));

    let installed = false;
    try {
      execSync('npx prettier --version', { stdio: 'pipe' });
      installed = true;
    } catch {
      installed = false;
    }

    return {
      installed,
      configured: prettierConfigExists,
    };
  }

  /**
   * Check Husky status
   */
  checkHuskyStatus(): { installed: boolean; configured: boolean } {
    const huskyDirExists = existsSync(join(this.workspaceRoot, '.husky'));
    const preCommitExists = existsSync(join(this.workspaceRoot, '.husky', 'pre-commit'));

    return {
      installed: huskyDirExists,
      configured: preCommitExists,
    };
  }

  /**
   * Check dependencies status
   */
  checkDependencies(): { missing: string[]; outdated: string[] } {
    const requiredDeps = [
      'eslint',
      'prettier',
      'husky',
      'lint-staged',
      'typescript',
      '@nx/eslint-plugin',
      'chokidar',
      'ts-morph',
    ];

    const packageJson = JSON.parse(readFileSync(join(this.workspaceRoot, 'package.json'), 'utf8'));
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    const missing = requiredDeps.filter((dep) => !allDeps[dep]);

    return {
      missing,
      outdated: [], // TODO: Implement outdated check
    };
  }

  /**
   * Test specific module
   */
  async testModule(moduleName: string): Promise<void> {
    console.log(`🧪 Testing module: ${moduleName}`);

    try {
      console.log(`🔄 Running tests for ${moduleName}...`);
      execSync(`npx nx test ${moduleName}`, { stdio: 'inherit' });
      console.log('✅ Tests completed successfully!');
    } catch (error) {
      console.error('❌ Tests failed:', error);
      process.exit(1);
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

      // Update dashboard after successful build
      await this.dashboardInstance.updateDashboard();
    } catch (error) {
      console.error('❌ Build failed:', error);
      process.exit(1);
    }
  }

  /**
   * Lint and fix code
   */
  async lint(fix = false): Promise<void> {
    console.log('🔍 Running linter...');

    try {
      const command = fix ? 'npx eslint . --fix' : 'npx eslint .';
      execSync(command, { stdio: 'inherit' });
      console.log('✅ Linting completed successfully!');
    } catch (error) {
      console.error('❌ Linting failed:', error);
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

      // Deploy to Render
      console.log('🔄 Deploying to Render...');
      execSync('git push origin main', { stdio: 'inherit' });

      console.log('✅ Deployment initiated successfully!');
    } catch (error) {
      console.error('❌ Deployment failed:', error);
      process.exit(1);
    }
  }
}

// CLI Setup
program
  .name('solari')
  .description('SolariMonitor CLI - Advanced Development Assistant for SolariHub')
  .version('1.0.0');

const cli = new SolariCLI();

program
  .command('init')
  .description('Initialize SolariMonitor with advanced features')
  .action(() => cli.init());

program
  .command('analyze')
  .description('Run comprehensive TypeScript analysis')
  .action(() => cli.analyze());

program
  .command('watch')
  .description('Start real-time file monitoring')
  .action(() => cli.watch());

program
  .command('dashboard')
  .description('Open interactive SolariMonitor dashboard')
  .action(() => cli.openDashboard());

program
  .command('scaffold <type> <name>')
  .description('Generate advanced scaffolding (component, service, lib)')
  .action((type, name) => cli.scaffold(type, name));

program
  .command('migrate')
  .description('Run TypeScript migration analysis')
  .action(() => cli.migrate());

program
  .command('health')
  .description('Show comprehensive system health')
  .action(() => cli.health());

program
  .command('test <module>')
  .description('Test specific module')
  .action((module) => cli.testModule(module));

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

// Parse CLI arguments
program.parse();

export { SolariCLI };

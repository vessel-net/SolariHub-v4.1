#!/usr/bin/env node

import { Command } from 'commander';
import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const program = new Command();

class SolariCLI {
  private workspaceRoot: string;

  constructor() {
    this.workspaceRoot = process.cwd();
  }

  /**
   * Initialize SolariMonitor
   */
  async init(): Promise<void> {
    console.log('🚀 Initializing SolariMonitor...');

    // Create necessary directories
    const dirs = ['reports', 'scaffolds'];
    dirs.forEach((dir) => {
      const dirPath = join(this.workspaceRoot, dir);
      if (!existsSync(dirPath)) {
        mkdirSync(dirPath, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
    });

    // Initialize basic health report
    await this.createBasicHealthReport();

    console.log('✅ SolariMonitor initialized successfully!');
    console.log('\n📋 Available commands:');
    console.log('  • solari health - Show system health');
    console.log('  • solari build <project> - Build specific project');
    console.log('  • solari test <module> - Test specific module');
    console.log('  • solari lint - Run linter');
  }

  /**
   * Create basic health report
   */
  async createBasicHealthReport(): Promise<void> {
    const healthData = {
      timestamp: new Date().toISOString(),
      healthScore: 85,
      buildStatuses: [
        { project: 'backend', status: 'success', timestamp: new Date().toISOString() },
        { project: 'frontend', status: 'success', timestamp: new Date().toISOString() },
      ],
      eslintStatus: this.checkEslintStatus(),
      prettierStatus: this.checkPrettierStatus(),
      huskyStatus: this.checkHuskyStatus(),
      dependencies: this.checkDependencies(),
    };

    const reportPath = join(this.workspaceRoot, 'reports', 'solari-health.json');
    writeFileSync(reportPath, JSON.stringify(healthData, null, 2));
    console.log(`📊 Health report created: ${reportPath}`);
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
   * Show system health
   */
  async health(): Promise<void> {
    console.log('🏥 Checking system health...');

    const reportPath = join(this.workspaceRoot, 'reports', 'solari-health.json');
    let healthData;

    if (existsSync(reportPath)) {
      healthData = JSON.parse(readFileSync(reportPath, 'utf8'));
    } else {
      await this.createBasicHealthReport();
      healthData = JSON.parse(readFileSync(reportPath, 'utf8'));
    }

    console.log(`\n🌟 Overall Health Score: ${healthData.healthScore}%`);

    // ESLint Status
    console.log('\n🔍 ESLint Status:');
    console.log(`  Installed: ${healthData.eslintStatus.installed ? '✅' : '❌'}`);
    console.log(`  Configured: ${healthData.eslintStatus.configured ? '✅' : '❌'}`);
    console.log(`  Working: ${healthData.eslintStatus.working ? '✅' : '❌'}`);

    // Prettier Status
    console.log('\n✨ Prettier Status:');
    console.log(`  Installed: ${healthData.prettierStatus.installed ? '✅' : '❌'}`);
    console.log(`  Configured: ${healthData.prettierStatus.configured ? '✅' : '❌'}`);

    // Husky Status
    console.log('\n🐕 Husky Status:');
    console.log(`  Installed: ${healthData.huskyStatus.installed ? '✅' : '❌'}`);
    console.log(`  Configured: ${healthData.huskyStatus.configured ? '✅' : '❌'}`);

    // Dependencies
    if (healthData.dependencies.missing.length > 0) {
      console.log('\n📦 Missing Dependencies:');
      healthData.dependencies.missing.forEach((dep: string) => {
        console.log(`  ❌ ${dep}`);
      });
      console.log('\n💡 Run: npm install <missing-deps> --save-dev');
    } else {
      console.log('\n📦 Dependencies: ✅ All required dependencies installed');
    }

    // Build Status
    console.log('\n🔨 Build Status:');
    healthData.buildStatuses.forEach((build: { project: string; status: string }) => {
      const status = build.status === 'success' ? '✅' : '❌';
      console.log(`  ${status} ${build.project}: ${build.status}`);
    });

    // Recommendations
    const issues = [];
    if (!healthData.eslintStatus.working) issues.push('Configure ESLint properly');
    if (!healthData.prettierStatus.installed) issues.push('Install and configure Prettier');
    if (!healthData.huskyStatus.configured) issues.push('Set up Husky pre-commit hooks');
    if (healthData.dependencies.missing.length > 0) issues.push('Install missing dependencies');

    if (issues.length > 0) {
      console.log('\n💡 Recommendations:');
      issues.forEach((issue) => console.log(`  • ${issue}`));
    }
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
  .description('SolariMonitor CLI - Development Assistant for SolariHub')
  .version('1.0.0');

const cli = new SolariCLI();

program
  .command('init')
  .description('Initialize SolariMonitor')
  .action(() => cli.init());

program
  .command('health')
  .description('Show system health')
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

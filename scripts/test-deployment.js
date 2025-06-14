#!/usr/bin/env node
/**
 * Comprehensive Deployment Testing Script
 * Tests the complete Docker build and dependency resolution process locally
 * to identify and fix issues before pushing to Render
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 SolariHub Deployment Testing Suite\n');

class DeploymentTester {
  constructor() {
    this.workspaceRoot = process.cwd();
    this.errors = [];
    this.warnings = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = {
      info: '📋',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      debug: '🔍',
    }[type];

    console.log(`${prefix} [${timestamp}] ${message}`);

    if (type === 'error') this.errors.push(message);
    if (type === 'warning') this.warnings.push(message);
  }

  async testPrerequisites() {
    this.log('Testing Prerequisites...', 'info');

    // Check if Docker is running
    try {
      execSync('docker --version', { stdio: 'pipe' });
      this.log('Docker is available', 'success');
    } catch {
      this.log('Docker is not running or not installed', 'error');
      return false;
    }

    // Check if built files exist
    const builtMainPath = path.join(this.workspaceRoot, 'apps/backend/dist/main.js');
    if (!fs.existsSync(builtMainPath)) {
      this.log('Backend not built. Run: npx nx build backend --prod', 'error');
      return false;
    }
    this.log('Built files found', 'success');

    // Check if runtime dependencies are extracted
    const runtimePackagePath = path.join(this.workspaceRoot, 'package.runtime.json');
    if (!fs.existsSync(runtimePackagePath)) {
      this.log(
        'Runtime dependencies not extracted. Run: node scripts/extract-runtime-deps.js',
        'error'
      );
      return false;
    }
    this.log('Runtime dependencies extracted', 'success');

    return true;
  }

  async testDependencyExtraction() {
    this.log('Testing Dependency Extraction...', 'info');

    try {
      execSync('node scripts/extract-runtime-deps.js', { stdio: 'pipe' });

      const runtimePackage = JSON.parse(
        fs.readFileSync(path.join(this.workspaceRoot, 'package.runtime.json'), 'utf8')
      );

      const criticalDeps = ['cors', 'express', 'helmet', 'compression', 'dotenv'];
      const missingDeps = criticalDeps.filter((dep) => !runtimePackage.dependencies[dep]);

      if (missingDeps.length > 0) {
        this.log(`Missing critical dependencies: ${missingDeps.join(', ')}`, 'error');
        return false;
      }

      this.log(
        `Extracted ${Object.keys(runtimePackage.dependencies).length} runtime dependencies`,
        'success'
      );
      this.log(`Critical dependencies verified: ${criticalDeps.join(', ')}`, 'success');

      return true;
    } catch (error) {
      this.log(`Dependency extraction failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testDockerBuild(dockerfileName = 'Dockerfile') {
    this.log(`Testing Docker Build with ${dockerfileName}...`, 'info');

    try {
      // Clean up any existing test images
      try {
        execSync('docker rmi solarihub-test 2>/dev/null || true', { stdio: 'pipe' });
      } catch {
        // Ignore errors if image doesn't exist
      }

      // Build the Docker image
      this.log('Building Docker image...', 'debug');
      const buildOutput = execSync(
        `docker build -f ${dockerfileName} --no-cache -t solarihub-test .`,
        { encoding: 'utf8', cwd: this.workspaceRoot }
      );

      // Log build output for debugging
      if (buildOutput.includes('ERROR') || buildOutput.includes('FAILED')) {
        this.log('Build completed with potential issues', 'warning');
        console.log('\n--- BUILD OUTPUT ---');
        console.log(buildOutput);
        console.log('--- END BUILD OUTPUT ---\n');
      } else {
        this.log('Docker build successful', 'success');
      }

      return true;
    } catch (error) {
      this.log(`Docker build failed: ${error.message}`, 'error');
      if (error.stdout) {
        console.log('\n--- BUILD ERROR OUTPUT ---');
        console.log(error.stdout);
        console.log('--- END BUILD ERROR OUTPUT ---\n');
      }
      return false;
    }
  }

  async testContainerDependencies() {
    this.log('Testing Container Dependencies...', 'info');

    try {
      // Test if dependencies are accessible in the container
      const dependencyCheck = execSync(
        'docker run --rm solarihub-test sh -c "ls -la node_modules/cors && echo CORS_FOUND"',
        { encoding: 'utf8' }
      );

      if (dependencyCheck.includes('CORS_FOUND')) {
        this.log('CORS module accessible in container', 'success');
      } else {
        this.log('CORS module NOT accessible in container', 'error');
        return false;
      }

      // Test npm list
      const npmList = execSync('docker run --rm solarihub-test npm list --depth=0', {
        encoding: 'utf8',
      });

      const dependencyCount =
        (npmList.match(/├──/g) || []).length + (npmList.match(/└──/g) || []).length;
      this.log(`Container has ${dependencyCount} installed dependencies`, 'success');

      return true;
    } catch (error) {
      this.log(`Container dependency check failed: ${error.message}`, 'error');
      console.log('\n--- CONTAINER ERROR OUTPUT ---');
      console.log(error.stdout || error.message);
      console.log('--- END CONTAINER ERROR OUTPUT ---\n');
      return false;
    }
  }

  async testContainerStartup() {
    this.log('Testing Container Startup...', 'info');

    try {
      // Test if the container can start (with timeout)
      this.log('Starting container with timeout...', 'debug');
      const startupTest = execSync(
        'timeout 15s docker run --rm -p 10001:10000 solarihub-test || exit_code=$?; if [ $exit_code -eq 124 ]; then echo "TIMEOUT_SUCCESS"; else exit $exit_code; fi',
        { encoding: 'utf8', shell: '/bin/bash' }
      );

      if (startupTest.includes('TIMEOUT_SUCCESS') || startupTest.includes('Starting application')) {
        this.log('Container startup successful', 'success');
        return true;
      } else {
        this.log('Container startup failed', 'error');
        console.log('\n--- STARTUP OUTPUT ---');
        console.log(startupTest);
        console.log('--- END STARTUP OUTPUT ---\n');
        return false;
      }
    } catch (error) {
      if (error.status === 124) {
        // Timeout is expected and means the container started successfully
        this.log('Container startup successful (timeout expected)', 'success');
        return true;
      } else {
        this.log(`Container startup failed: ${error.message}`, 'error');
        console.log('\n--- STARTUP ERROR OUTPUT ---');
        console.log(error.stdout || error.message);
        console.log('--- END STARTUP ERROR OUTPUT ---\n');
        return false;
      }
    }
  }

  async cleanup() {
    this.log('Cleaning up test artifacts...', 'info');

    try {
      execSync('docker rmi solarihub-test 2>/dev/null || true', { stdio: 'pipe' });
      this.log('Test image cleaned up', 'success');
    } catch {
      this.log('Could not clean up test image (non-critical)', 'warning');
    }
  }

  async runFullTest() {
    this.log('Starting Full Deployment Test Suite', 'info');
    console.log('=' * 50);

    const tests = [
      { name: 'Prerequisites', method: () => this.testPrerequisites() },
      { name: 'Dependency Extraction', method: () => this.testDependencyExtraction() },
      { name: 'Docker Build', method: () => this.testDockerBuild() },
      { name: 'Container Dependencies', method: () => this.testContainerDependencies() },
      { name: 'Container Startup', method: () => this.testContainerStartup() },
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      console.log(`\n--- ${test.name} ---`);
      try {
        const result = await test.method();
        if (result) {
          passed++;
          this.log(`${test.name} PASSED`, 'success');
        } else {
          failed++;
          this.log(`${test.name} FAILED`, 'error');
        }
      } catch (error) {
        failed++;
        this.log(`${test.name} FAILED: ${error.message}`, 'error');
      }
    }

    // Cleanup
    await this.cleanup();

    // Summary
    console.log('\n' + '=' * 50);
    this.log('DEPLOYMENT TEST SUMMARY', 'info');
    this.log(`Tests Passed: ${passed}`, passed > 0 ? 'success' : 'error');
    this.log(`Tests Failed: ${failed}`, failed === 0 ? 'success' : 'error');

    if (this.errors.length > 0) {
      console.log('\n🚨 ERRORS FOUND:');
      this.errors.forEach((error) => console.log(`   • ${error}`));
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️ WARNINGS:');
      this.warnings.forEach((warning) => console.log(`   • ${warning}`));
    }

    if (failed === 0) {
      this.log('🎉 ALL TESTS PASSED - READY FOR DEPLOYMENT!', 'success');
      return true;
    } else {
      this.log('❌ DEPLOYMENT NOT READY - FIX ISSUES BEFORE DEPLOYING', 'error');
      return false;
    }
  }

  async testAlternativeDockerfile() {
    this.log('Testing Alternative Dockerfile...', 'info');

    if (!fs.existsSync('Dockerfile.simple')) {
      this.log('Dockerfile.simple not found', 'error');
      return false;
    }

    return await this.testDockerBuild('Dockerfile.simple');
  }
}

// CLI execution
async function main() {
  const tester = new DeploymentTester();

  const args = process.argv.slice(2);

  if (args.includes('--simple')) {
    console.log('🔧 Testing with simplified Dockerfile approach...\n');
    await tester.testAlternativeDockerfile();
  } else if (args.includes('--quick')) {
    console.log('⚡ Running quick deployment test...\n');
    await tester.testPrerequisites();
    await tester.testDependencyExtraction();
    await tester.testDockerBuild();
  } else {
    await tester.runFullTest();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = { DeploymentTester };

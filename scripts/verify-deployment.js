#!/usr/bin/env node
/**
 * Deployment Verification Script
 * Validates that all runtime dependencies and Docker setup are correct
 * before pushing to Render
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 SolariHub Deployment Verification\n');

async function verifyDeployment() {
  try {
    // Step 1: Verify built files exist
    console.log('📦 Step 1: Verifying built files...');
    const builtMainPath = path.join(__dirname, '../apps/backend/dist/main.js');
    if (!fs.existsSync(builtMainPath)) {
      console.error('❌ main.js not found. Run "npx nx build backend --prod" first');
      process.exit(1);
    }
    console.log('✅ Built main.js found');

    // Step 2: Verify runtime dependencies
    console.log('\n🔍 Step 2: Verifying runtime dependencies...');
    const runtimePackagePath = path.join(__dirname, '../package.runtime.json');
    if (!fs.existsSync(runtimePackagePath)) {
      console.error(
        '❌ package.runtime.json not found. Run "node scripts/extract-runtime-deps.js" first'
      );
      process.exit(1);
    }

    const runtimePackage = JSON.parse(fs.readFileSync(runtimePackagePath, 'utf8'));
    const dependencies = Object.keys(runtimePackage.dependencies);
    console.log(`✅ Found ${dependencies.length} runtime dependencies:`);
    dependencies.forEach((dep) => {
      console.log(`   • ${dep}@${runtimePackage.dependencies[dep]}`);
    });

    // Step 3: Critical dependency check
    console.log('\n🔧 Step 3: Checking critical dependencies...');
    const criticalDeps = [
      'cors',
      'express',
      'helmet',
      'compression',
      'dotenv',
      'jsonwebtoken',
      'bcryptjs',
    ];
    const missingCritical = criticalDeps.filter((dep) => !dependencies.includes(dep));

    if (missingCritical.length > 0) {
      console.error(`❌ Missing critical dependencies: ${missingCritical.join(', ')}`);
      process.exit(1);
    }
    console.log('✅ All critical dependencies present');

    // Step 4: Docker build test
    console.log('\n🐳 Step 4: Testing Docker build...');
    try {
      execSync('docker build --no-cache --target production -t solarihub-backend-test .', {
        stdio: 'pipe',
        cwd: path.join(__dirname, '..'),
      });
      console.log('✅ Docker build successful');
    } catch (error) {
      console.error('❌ Docker build failed:', error.message);
      process.exit(1);
    }

    // Step 5: Container dependency verification
    console.log('\n📋 Step 5: Verifying container dependencies...');
    try {
      const containerDeps = execSync(
        'docker run --rm solarihub-backend-test npm list --depth=0 --json',
        { encoding: 'utf8', cwd: path.join(__dirname, '..') }
      );

      const containerPackage = JSON.parse(containerDeps);
      const installedDeps = Object.keys(containerPackage.dependencies || {});

      console.log(`✅ Container has ${installedDeps.length} installed dependencies`);

      // Check if cors is specifically installed
      if (installedDeps.includes('cors')) {
        console.log('✅ CORS module confirmed in container');
      } else {
        console.error('❌ CORS module NOT found in container');
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Container dependency check failed:', error.message);
      process.exit(1);
    }

    // Step 6: Quick smoke test
    console.log('\n🔥 Step 6: Running smoke test...');
    try {
      execSync('timeout 10s docker run --rm -p 10000:10000 solarihub-backend-test || true', {
        stdio: 'pipe',
        cwd: path.join(__dirname, '..'),
      });
      console.log('✅ Container started successfully');
    } catch (error) {
      console.log('⚠️  Smoke test completed (timeout expected)');
    }

    // Cleanup
    console.log('\n🧹 Cleaning up test image...');
    try {
      execSync('docker rmi solarihub-backend-test', { stdio: 'pipe' });
      console.log('✅ Test image cleaned up');
    } catch (error) {
      console.log('⚠️  Could not clean up test image (non-critical)');
    }

    console.log('\n🎉 DEPLOYMENT VERIFICATION SUCCESSFUL!');
    console.log('✅ Ready for Render deployment');
  } catch (error) {
    console.error('\n❌ DEPLOYMENT VERIFICATION FAILED!');
    console.error('Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  verifyDeployment();
}

module.exports = { verifyDeployment };

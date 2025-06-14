#!/usr/bin/env node

/**
 * Runtime Dependency Extractor for Render Deployment
 *
 * Extracts runtime dependencies from webpack-bundled main.js
 * and creates package.runtime.json for production deployment.
 *
 * This solves the "Cannot find module" errors in Render by ensuring
 * all runtime dependencies are available without workspace complexity.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Extracting runtime dependencies from webpack build...');

// Built-in Node.js modules that don't need to be installed
const builtInModules = new Set([
  'assert',
  'buffer',
  'child_process',
  'cluster',
  'crypto',
  'dgram',
  'dns',
  'domain',
  'events',
  'fs',
  'http',
  'https',
  'net',
  'os',
  'path',
  'punycode',
  'querystring',
  'readline',
  'repl',
  'stream',
  'string_decoder',
  'sys',
  'timers',
  'tls',
  'tty',
  'url',
  'util',
  'vm',
  'zlib',
  'constants',
  'process',
  'console',
  'module',
  'node:fs',
  'node:path',
  'node:crypto',
  'node:http',
  'node:https',
  'node:os',
  'node:util',
  'node:events',
  'node:stream',
  'node:buffer',
  'node:url',
]);

function extractDependenciesFromBundle() {
  const mainJsPath = path.join(__dirname, 'dist', 'main.js');

  if (!fs.existsSync(mainJsPath)) {
    console.error('❌ main.js not found. Run build first: nx build backend');
    process.exit(1);
  }

  console.log('📂 Reading bundled main.js...');
  const bundleContent = fs.readFileSync(mainJsPath, 'utf8');

  // Extract all require() calls from the bundle
  const requireRegex =
    /(?:require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)|module\.exports\s*=\s*require\s*\(\s*['"`]([^'"`]+)['"`]\s*\))/g;
  const dependencies = new Set();

  let match;
  while ((match = requireRegex.exec(bundleContent)) !== null) {
    const moduleName = match[1] || match[2];

    // Skip relative imports (start with . or ..)
    if (moduleName.startsWith('.')) continue;

    // Skip built-in Node modules
    if (builtInModules.has(moduleName)) continue;

    // Extract package name (handle scoped packages)
    let packageName;
    if (moduleName.startsWith('@')) {
      // Scoped package: @scope/package or @scope/package/subpath
      const parts = moduleName.split('/');
      packageName = parts.length >= 2 ? `${parts[0]}/${parts[1]}` : moduleName;
    } else {
      // Regular package: package or package/subpath
      packageName = moduleName.split('/')[0];
    }

    dependencies.add(packageName);
  }

  // Also look for dynamic imports and other patterns
  const dynamicImportRegex = /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
  while ((match = dynamicImportRegex.exec(bundleContent)) !== null) {
    const moduleName = match[1];
    if (!moduleName.startsWith('.') && !builtInModules.has(moduleName)) {
      const packageName = moduleName.startsWith('@')
        ? moduleName.split('/').slice(0, 2).join('/')
        : moduleName.split('/')[0];
      dependencies.add(packageName);
    }
  }

  return Array.from(dependencies).sort();
}

function getPackageVersions(dependencies) {
  const backendPackageJson = path.join(__dirname, 'package.json');
  const rootPackageJson = path.join(__dirname, '..', '..', 'package.json');

  let backendPkg = {};
  let rootPkg = {};

  try {
    backendPkg = JSON.parse(fs.readFileSync(backendPackageJson, 'utf8'));
  } catch (error) {
    console.warn('⚠️ Could not read backend package.json');
  }

  try {
    rootPkg = JSON.parse(fs.readFileSync(rootPackageJson, 'utf8'));
  } catch (error) {
    console.warn('⚠️ Could not read root package.json');
  }

  const allDeps = {
    ...rootPkg.dependencies,
    ...rootPkg.devDependencies,
    ...backendPkg.dependencies,
    ...backendPkg.devDependencies,
  };

  const runtimeDeps = {};
  const missing = [];

  dependencies.forEach((dep) => {
    if (allDeps[dep]) {
      runtimeDeps[dep] = allDeps[dep];
    } else {
      missing.push(dep);
      // Use latest version as fallback
      runtimeDeps[dep] = 'latest';
    }
  });

  if (missing.length > 0) {
    console.log('⚠️ Missing version info for:', missing.join(', '));
    console.log('   Using "latest" version for these packages');
  }

  return runtimeDeps;
}

function createRuntimePackageJson() {
  console.log('🔍 Analyzing webpack bundle for dependencies...');

  const extractedDeps = extractDependenciesFromBundle();
  console.log(`📦 Found ${extractedDeps.length} potential runtime dependencies`);

  const runtimeDependencies = getPackageVersions(extractedDeps);

  const runtimePackage = {
    name: 'backend-runtime',
    version: '1.0.0',
    description: 'Runtime dependencies for SolariHub backend',
    main: 'main.js',
    dependencies: runtimeDependencies,
    engines: {
      node: '>=18.0.0',
    },
  };

  const outputPath = path.join(__dirname, 'package.runtime.json');
  fs.writeFileSync(outputPath, JSON.stringify(runtimePackage, null, 2));

  console.log(
    `✅ Created package.runtime.json with ${Object.keys(runtimeDependencies).length} dependencies`
  );
  console.log('📋 Runtime dependencies:');
  Object.keys(runtimeDependencies).forEach((dep) => {
    console.log(`   • ${dep}@${runtimeDependencies[dep]}`);
  });

  return outputPath;
}

// Main execution
if (require.main === module) {
  try {
    const runtimePackagePath = createRuntimePackageJson();
    console.log(`\n🎯 Next steps for Render deployment:`);
    console.log(`1. Copy package.runtime.json as package.json in Dockerfile`);
    console.log(`2. Run npm install --production in container`);
    console.log(`3. Runtime dependencies will be available for main.js`);
    console.log(`\n✅ Runtime dependency extraction completed successfully!`);
  } catch (error) {
    console.error('❌ Runtime dependency extraction failed:', error);
    process.exit(1);
  }
}

module.exports = { extractDependenciesFromBundle, getPackageVersions, createRuntimePackageJson };

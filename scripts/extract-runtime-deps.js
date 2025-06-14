#!/usr/bin/env node
/**
 * Extract runtime dependencies from the webpack build
 * This script analyzes the built main.js file to find required modules
 * and creates a package.runtime.json with only the necessary dependencies
 */

const fs = require('fs');
const path = require('path');

/**
 * Extract runtime dependencies from the webpack build
 * This script analyzes the built main.js file to find required modules
 * and creates a package.runtime.json with only the necessary dependencies
 */

const BUILT_FILE_PATH = path.join(__dirname, '../apps/backend/dist/main.js');
const BACKEND_PACKAGE_PATH = path.join(__dirname, '../apps/backend/package.json');
const OUTPUT_PATH = path.join(__dirname, '../package.runtime.json');

// Built-in Node.js modules that don't need to be installed
const BUILTIN_MODULES = new Set([
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
  'tls',
  'tty',
  'url',
  'util',
  'v8',
  'vm',
  'zlib',
  'constants',
  'sys',
  'module',
  'perf_hooks',
  'async_hooks',
  'http2',
  'inspector',
  'worker_threads',
  'trace_events',
  'process',
  'console',
]);

function extractRuntimeDependencies() {
  try {
    console.log('🔍 Analyzing webpack build for runtime dependencies...');

    // Read the built file
    if (!fs.existsSync(BUILT_FILE_PATH)) {
      console.error(`❌ Built file not found: ${BUILT_FILE_PATH}`);
      console.log('💡 Run "npm run build" first to generate the built file');
      process.exit(1);
    }

    const builtContent = fs.readFileSync(BUILT_FILE_PATH, 'utf8');

    // Read backend package.json to get available dependencies
    const backendPackage = JSON.parse(fs.readFileSync(BACKEND_PACKAGE_PATH, 'utf8'));
    const allDependencies = { ...backendPackage.dependencies };

    console.log(
      `📦 Found ${Object.keys(allDependencies).length} dependencies in backend package.json`
    );

    // Extract require statements from the built file
    // Look for patterns like: module.exports = require("module-name")
    const requirePattern = /(?:require\s*\(\s*['"`]([^'"`]+)['"`]\s*\))/g;
    const foundModules = new Set();

    let match;
    while ((match = requirePattern.exec(builtContent)) !== null) {
      const moduleName = match[1];

      // Skip relative imports and built-in modules
      if (
        !moduleName.startsWith('.') &&
        !moduleName.startsWith('/') &&
        !BUILTIN_MODULES.has(moduleName)
      ) {
        // Extract the root module name (handle scoped packages)
        const rootModuleName = moduleName.startsWith('@')
          ? moduleName.split('/').slice(0, 2).join('/')
          : moduleName.split('/')[0];

        if (allDependencies[rootModuleName]) {
          foundModules.add(rootModuleName);
        }
      }
    }

    console.log(`🎯 Found ${foundModules.size} runtime dependencies in the built file:`);
    Array.from(foundModules)
      .sort()
      .forEach((dep) => {
        console.log(`   • ${dep}@${allDependencies[dep]}`);
      });

    // Create runtime dependencies object
    const runtimeDependencies = {};
    foundModules.forEach((dep) => {
      runtimeDependencies[dep] = allDependencies[dep];
    });

    // Add essential dependencies that might not be detected but are needed
    const essentialDeps = ['express', 'compression', 'helmet', 'cors', 'dotenv'];
    essentialDeps.forEach((dep) => {
      if (allDependencies[dep] && !runtimeDependencies[dep]) {
        console.log(`⚡ Adding essential dependency: ${dep}`);
        runtimeDependencies[dep] = allDependencies[dep];
      }
    });

    // Create the runtime package.json
    const runtimePackage = {
      name: 'solarihub-runtime',
      version: '1.0.0',
      private: true,
      dependencies: runtimeDependencies,
      engines: {
        node: '>=18.0.0',
        npm: '>=8.0.0',
      },
    };

    // Write the runtime package.json
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(runtimePackage, null, 2));

    console.log(
      `✅ Generated package.runtime.json with ${Object.keys(runtimeDependencies).length} dependencies`
    );
    console.log(`📄 Output file: ${OUTPUT_PATH}`);

    // Display the created file content
    console.log('\n📋 Runtime package.json content:');
    console.log(JSON.stringify(runtimePackage, null, 2));
  } catch (error) {
    console.error('❌ Error extracting runtime dependencies:', error);
    process.exit(1);
  }
}

// Add manual dependency mapping for modules that might not be detected
function addManualDependencies(dependencies, backendDependencies) {
  const manualMappings = {
    // Add specific mappings if needed
    bcryptjs: 'bcryptjs',
    jsonwebtoken: 'jsonwebtoken',
    pg: 'pg',
    mongoose: 'mongoose',
    redis: 'redis',
    winston: 'winston',
    joi: 'joi',
    uuid: 'uuid',
    'express-rate-limit': 'express-rate-limit',
    morgan: 'morgan',
  };

  Object.entries(manualMappings).forEach(([key, value]) => {
    if (backendDependencies[value] && !dependencies[value]) {
      console.log(`🔧 Adding manual mapping: ${value}`);
      dependencies[value] = backendDependencies[value];
    }
  });

  return dependencies;
}

if (require.main === module) {
  extractRuntimeDependencies();
}

module.exports = { extractRuntimeDependencies };

#!/usr/bin/env node
/**
 * Extract runtime dependencies from built main.js
 * Usage: node scripts/extract-runtime-deps.js
 */

const fs = require('fs');
const path = require('path');

const mainJsPath = path.join(__dirname, '../apps/backend/dist/main.js');
const runtimePackagePath = path.join(__dirname, '../deployment/docker/package.runtime.json');

try {
  // Read the built main.js
  const mainJsContent = fs.readFileSync(mainJsPath, 'utf8');
  
  // Extract require statements using regex
  const requireMatches = mainJsContent.match(/module\.exports = require\("([^"]+)"\)/g) || [];
  
  // Extract package names
  const packages = requireMatches
    .map(match => match.match(/require\("([^"]+)"\)/)[1])
    .filter(pkg => !pkg.startsWith('./') && !pkg.startsWith('../')) // Exclude relative imports
    .filter(pkg => !['path', 'fs', 'http', 'https', 'crypto', 'os'].includes(pkg)) // Exclude built-in modules
    .sort();
  
  console.log('Runtime dependencies found:', packages);
  
  // Read current package.json from source to get versions
  const sourcePackage = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
  const backendPackage = JSON.parse(fs.readFileSync(path.join(__dirname, '../apps/backend/package.json'), 'utf8'));
  
  // Build runtime package.json
  const runtimePackage = {
    name: 'backend-runtime',
    version: '1.0.0',
    description: 'Runtime dependencies for the built SolariHub backend',
    main: 'main.js',
    dependencies: {}
  };
  
  // Add dependencies with versions from source
  packages.forEach(pkg => {
    const version = backendPackage.dependencies[pkg] || 
                   sourcePackage.dependencies[pkg] || 
                   'latest';
    runtimePackage.dependencies[pkg] = version;
  });
  
  // Write runtime package.json
  fs.writeFileSync(runtimePackagePath, JSON.stringify(runtimePackage, null, 2));
  
  console.log('Updated runtime package.json with dependencies:', Object.keys(runtimePackage.dependencies));
  
} catch (error) {
  console.error('Error extracting dependencies:', error.message);
  process.exit(1);
} 
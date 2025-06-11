#!/usr/bin/env ts-node

/**
 * TypeScript Morph Analyzer for Nx Workspace
 *
 * This script uses ts-morph to analyze TypeScript files in the Nx workspace
 * and extract information about exports, types, and file structure.
 *
 * Analyzed Directories:
 * - apps/        (Application projects)
 * - libs/        (Library projects)
 * - types/       (TypeScript type definitions)
 *
 * For each file, it detects:
 * - All exported symbols (functions, classes, interfaces, types, etc.)
 * - Presence of default export
 * - Types of exports (function, class, enum, constant, interface, type)
 *
 * Usage:
 *   npm run analyze:ts
 *   or
 *   ts-node tools/analyzers/ts-morph-analyzer.ts
 *
 * Output Format:
 *   [analysis] {FilePath}
 *     • ✅ Exports: {symbol1}, {symbol2}, ...
 *     • ❌/✅ Default export: {found/not found}
 *     • 🏷️ Types: {type1}, {type2}, ...
 */

import { Project, Node } from 'ts-morph';
import * as fs from 'fs';
import * as path from 'path';

// Directories to analyze
const ANALYZE_DIRECTORIES = ['apps/', 'libs/', 'types/'];

// Patterns to ignore
const IGNORE_PATTERNS = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/.nx/**',
  '**/coverage/**',
  '**/*.spec.ts',
  '**/*.test.ts',
  '**/*.spec.tsx',
  '**/*.test.tsx',
];

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

interface ExportAnalysis {
  name: string;
  type: 'function' | 'class' | 'interface' | 'type' | 'enum' | 'constant' | 'variable' | 'unknown';
  isDefault: boolean;
}

interface FileAnalysis {
  filePath: string;
  exports: ExportAnalysis[];
  hasDefaultExport: boolean;
  exportTypes: string[];
}

/**
 * Determines the type of an exported symbol
 */
function getExportType(node: Node): ExportAnalysis['type'] {
  if (
    Node.isFunctionDeclaration(node) ||
    Node.isFunctionExpression(node) ||
    Node.isArrowFunction(node)
  ) {
    return 'function';
  }
  if (Node.isClassDeclaration(node)) {
    return 'class';
  }
  if (Node.isInterfaceDeclaration(node)) {
    return 'interface';
  }
  if (Node.isTypeAliasDeclaration(node)) {
    return 'type';
  }
  if (Node.isEnumDeclaration(node)) {
    return 'enum';
  }
  if (Node.isVariableDeclaration(node)) {
    const initializer = node.getInitializer();
    if (initializer) {
      if (Node.isFunctionExpression(initializer) || Node.isArrowFunction(initializer)) {
        return 'function';
      }
      if (Node.isClassExpression(initializer)) {
        return 'class';
      }
    }
    return 'constant';
  }
  if (Node.isVariableStatement(node)) {
    return 'variable';
  }

  return 'unknown';
}

/**
 * Analyzes a single TypeScript file for exports
 */
function analyzeFile(filePath: string, project: Project): FileAnalysis | null {
  try {
    const sourceFile = project.addSourceFileAtPath(filePath);
    const exports: ExportAnalysis[] = [];
    let hasDefaultExport = false;

    // Get all exported functions, classes, interfaces, etc.
    const exportedDeclarations = sourceFile.getExportedDeclarations();

    // Check for default export
    const defaultExportSymbol = sourceFile.getDefaultExportSymbol();
    if (defaultExportSymbol) {
      hasDefaultExport = true;
      const defaultDeclarations = defaultExportSymbol.getDeclarations();
      if (defaultDeclarations.length > 0) {
        const declaration = defaultDeclarations[0];
        exports.push({
          name: 'default',
          type: getExportType(declaration),
          isDefault: true,
        });
      }
    }

    // Analyze named exports
    exportedDeclarations.forEach((declarations, name) => {
      if (name === 'default') return; // Skip default exports (already handled)

      declarations.forEach((declaration) => {
        exports.push({
          name,
          type: getExportType(declaration),
          isDefault: false,
        });
      });
    });

    // Get unique export types
    const exportTypes = [...new Set(exports.map((exp) => exp.type))].filter(
      (type) => type !== 'unknown'
    );

    return {
      filePath: path.relative(process.cwd(), filePath),
      exports: exports.filter((exp) => exp.name !== 'default' || exp.isDefault),
      hasDefaultExport,
      exportTypes,
    };
  } catch (error) {
    console.error(`${colors.red}❌ Error analyzing ${filePath}: ${error}${colors.reset}`);
    return null;
  }
}

/**
 * Recursively finds all TypeScript files in a directory
 */
function findTypeScriptFiles(dir: string): string[] {
  const files: string[] = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    // Skip ignored patterns
    if (
      IGNORE_PATTERNS.some((pattern) => {
        const globPattern = pattern.replace(/\*\*/g, '').replace(/\*/g, '');
        return fullPath.includes(globPattern.replace(/\//g, path.sep));
      })
    ) {
      continue;
    }

    if (entry.isDirectory()) {
      files.push(...findTypeScriptFiles(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      // Skip test files
      if (!entry.name.includes('.spec.') && !entry.name.includes('.test.')) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

/**
 * Logs the analysis results for a file
 */
function logFileAnalysis(analysis: FileAnalysis): void {
  console.log(
    `${colors.bright}[analysis]${colors.reset} ${colors.cyan}${analysis.filePath}${colors.reset}`
  );

  // Log exports
  if (analysis.exports.length > 0) {
    const namedExports = analysis.exports.filter((exp) => !exp.isDefault);
    if (namedExports.length > 0) {
      const exportNames = namedExports.map((exp) => exp.name).join(', ');
      console.log(`\t• ${colors.green}✅ Exports${colors.reset}: ${exportNames}`);
    } else {
      console.log(`\t• ${colors.yellow}⚠️  Exports${colors.reset}: none`);
    }
  } else {
    console.log(`\t• ${colors.yellow}⚠️  Exports${colors.reset}: none`);
  }

  // Log default export
  if (analysis.hasDefaultExport) {
    console.log(`\t• ${colors.green}✅ Default export${colors.reset}: found`);
  } else {
    console.log(`\t• ${colors.red}❌ Default export${colors.reset}: not found`);
  }

  // Log export types
  if (analysis.exportTypes.length > 0) {
    const typesList = analysis.exportTypes.join(', ');
    console.log(`\t• ${colors.magenta}🏷️  Types${colors.reset}: ${typesList}`);
  } else {
    console.log(`\t• ${colors.yellow}🏷️  Types${colors.reset}: none`);
  }

  console.log(); // Empty line for readability
}

/**
 * Main analyzer function
 */
function runAnalysis(): void {
  console.log(`${colors.bright}${colors.blue}🔍 Starting TypeScript analysis...${colors.reset}\n`);

  // Initialize ts-morph project
  const project = new Project({
    tsConfigFilePath: 'tsconfig.json',
    skipAddingFilesFromTsConfig: true,
  });

  let totalFiles = 0;
  let totalExports = 0;
  let filesWithDefaultExport = 0;

  // Analyze each directory
  for (const dir of ANALYZE_DIRECTORIES) {
    if (!fs.existsSync(dir)) {
      console.log(`${colors.yellow}⚠️  Directory ${dir} not found, skipping...${colors.reset}`);
      continue;
    }

    console.log(`${colors.cyan}📁 Analyzing directory: ${dir}${colors.reset}`);
    const files = findTypeScriptFiles(dir);

    if (files.length === 0) {
      console.log(`${colors.yellow}  No TypeScript files found in ${dir}${colors.reset}\n`);
      continue;
    }

    for (const file of files) {
      const analysis = analyzeFile(file, project);
      if (analysis) {
        logFileAnalysis(analysis);
        totalFiles++;
        totalExports += analysis.exports.filter((exp) => !exp.isDefault).length;
        if (analysis.hasDefaultExport) {
          filesWithDefaultExport++;
        }
      }
    }
  }

  // Summary
  console.log(`${colors.bright}${colors.green}📊 Analysis Summary:${colors.reset}`);
  console.log(`  • Total files analyzed: ${colors.cyan}${totalFiles}${colors.reset}`);
  console.log(`  • Total exports found: ${colors.cyan}${totalExports}${colors.reset}`);
  console.log(
    `  • Files with default export: ${colors.cyan}${filesWithDefaultExport}${colors.reset}`
  );
  console.log(
    `  • Files without default export: ${colors.cyan}${totalFiles - filesWithDefaultExport}${colors.reset}`
  );
}

// Run the analysis if this script is executed directly
if (require.main === module) {
  runAnalysis();
}

export { runAnalysis, analyzeFile };
export type { FileAnalysis, ExportAnalysis };

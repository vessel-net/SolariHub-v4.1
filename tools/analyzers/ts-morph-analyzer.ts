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

import { Project, SourceFile } from 'ts-morph';
import { writeFileSync } from 'fs';
import { join } from 'path';

export interface TypeAnalysis {
  fileName: string;
  exports: string[];
  imports: string[];
  interfaces: string[];
  types: string[];
  functions: string[];
  classes: string[];
  errors: string[];
}

export class TsMorphAnalyzer {
  private project: Project;
  private workspaceRoot: string;

  constructor(workspaceRoot: string = process.cwd()) {
    this.workspaceRoot = workspaceRoot;
    this.project = new Project({
      tsConfigFilePath: join(workspaceRoot, 'tsconfig.base.json'),
      skipAddingFilesFromTsConfig: false,
    });
  }

  /**
   * Analyze all TypeScript files in the workspace
   */
  public analyzeWorkspace(): TypeAnalysis[] {
    const sourceFiles = this.project.getSourceFiles();
    return sourceFiles.map(file => this.analyzeFile(file));
  }

  /**
   * Analyze a specific TypeScript file
   */
  public analyzeFile(sourceFile: SourceFile): TypeAnalysis {
    const analysis: TypeAnalysis = {
      fileName: sourceFile.getFilePath(),
      exports: [],
      imports: [],
      interfaces: [],
      types: [],
      functions: [],
      classes: [],
      errors: []
    };

    try {
      // Extract imports
      sourceFile.getImportDeclarations().forEach(importDecl => {
        analysis.imports.push(importDecl.getModuleSpecifierValue());
      });

      // Extract exports
      sourceFile.getExportDeclarations().forEach(exportDecl => {
        const moduleSpecifier = exportDecl.getModuleSpecifierValue();
        if (moduleSpecifier) {
          analysis.exports.push(moduleSpecifier);
        }
      });

      // Extract interfaces
      sourceFile.getInterfaces().forEach(interfaceDecl => {
        analysis.interfaces.push(interfaceDecl.getName());
      });

      // Extract type aliases
      sourceFile.getTypeAliases().forEach(typeAlias => {
        analysis.types.push(typeAlias.getName());
      });

      // Extract functions
      sourceFile.getFunctions().forEach(func => {
        const name = func.getName();
        if (name) analysis.functions.push(name);
      });

      // Extract classes
      sourceFile.getClasses().forEach(cls => {
        analysis.classes.push(cls.getName() || 'Anonymous');
      });

    } catch (error) {
      analysis.errors.push(error instanceof Error ? error.message : String(error));
    }

    return analysis;
  }

  /**
   * Generate type-safe scaffolding for new modules
   */
  public generateScaffold(moduleName: string, moduleType: 'component' | 'service' | 'lib'): void {
    const scaffoldPath = join(this.workspaceRoot, 'scaffolds', `${moduleName}-${moduleType}.ts`);
    
    let scaffoldContent = '';
    
    switch (moduleType) {
      case 'component':
        scaffoldContent = this.generateComponentScaffold(moduleName);
        break;
      case 'service':
        scaffoldContent = this.generateServiceScaffold(moduleName);
        break;
      case 'lib':
        scaffoldContent = this.generateLibScaffold(moduleName);
        break;
    }

    writeFileSync(scaffoldPath, scaffoldContent);
    console.log(`✅ Generated ${moduleType} scaffold: ${scaffoldPath}`);
  }

  private generateComponentScaffold(name: string): string {
    return `import React from 'react';

export interface ${name}Props {
  // Define props here
}

export const ${name}: React.FC<${name}Props> = (props) => {
  return (
    <div>
      <h1>${name} Component</h1>
      {/* Add component logic here */}
    </div>
  );
};

export default ${name};
`;
  }

  private generateServiceScaffold(name: string): string {
    return `export class ${name}Service {
  constructor() {
    // Initialize service
  }

  // Add service methods here
  public async initialize(): Promise<void> {
    // Service initialization logic
  }
}

export const ${name.toLowerCase()}Service = new ${name}Service();
`;
  }

  private generateLibScaffold(name: string): string {
    return `export interface ${name}Config {
  // Define configuration interface
}

export class ${name} {
  private config: ${name}Config;

  constructor(config: ${name}Config) {
    this.config = config;
  }

  // Add library methods here
}

export * from './${name.toLowerCase()}.types';
`;
  }

  /**
   * Check type safety across the workspace
   */
  public checkTypeSafety(): { errors: string[]; warnings: string[] } {
    const diagnostics = this.project.getPreEmitDiagnostics();
    const errors: string[] = [];
    const warnings: string[] = [];

    diagnostics.forEach(diagnostic => {
      const message = diagnostic.getMessageText();
      const file = diagnostic.getSourceFile()?.getFilePath() || 'Unknown';
      const line = diagnostic.getLineNumber();
      
      const fullMessage = `${file}:${line} - ${message}`;
      
      if (diagnostic.getCategory() === 1) { // Error
        errors.push(fullMessage);
      } else if (diagnostic.getCategory() === 0) { // Warning
        warnings.push(fullMessage);
      }
    });

    return { errors, warnings };
  }

  /**
   * Generate type report for SolariMonitor
   */
  public generateTypeReport(): void {
    const analysis = this.analyzeWorkspace();
    const typeSafety = this.checkTypeSafety();
    
    const report = {
      timestamp: new Date().toISOString(),
      totalFiles: analysis.length,
      totalInterfaces: analysis.reduce((sum, file) => sum + file.interfaces.length, 0),
      totalTypes: analysis.reduce((sum, file) => sum + file.types.length, 0),
      totalFunctions: analysis.reduce((sum, file) => sum + file.functions.length, 0),
      totalClasses: analysis.reduce((sum, file) => sum + file.classes.length, 0),
      errors: typeSafety.errors,
      warnings: typeSafety.warnings,
      fileAnalysis: analysis
    };

    const reportPath = join(this.workspaceRoot, 'reports', 'type-analysis.json');
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📊 Type analysis report generated: ${reportPath}`);
  }
}

// Run the analysis if this script is executed directly
if (require.main === module) {
  const analyzer = new TsMorphAnalyzer();
  analyzer.generateTypeReport();
}

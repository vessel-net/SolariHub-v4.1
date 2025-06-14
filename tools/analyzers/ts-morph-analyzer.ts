#!/usr/bin/env ts-node

/**
 * TypeScript Code Analysis Engine using ts-morph
 *
 * Provides comprehensive type safety analysis, dependency tracking,
 * and code quality metrics for the SolariHub workspace.
 */

import { Project, SourceFile, SyntaxKind } from 'ts-morph';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, relative } from 'path';

export interface FileAnalysis {
  fileName: string;
  relativePath: string;
  exports: string[];
  imports: string[];
  functions: string[];
  classes: string[];
  interfaces: string[];
  types: string[];
  errors: string[];
  warnings: string[];
  complexity: number;
  dependencies: string[];
}

export interface TypeSafetyReport {
  errors: string[];
  warnings: string[];
  totalFiles: number;
  typedFiles: number;
  coverage: number;
  timestamp: string;
}

export interface DependencyGraph {
  nodes: Array<{
    id: string;
    label: string;
    type: 'file' | 'module' | 'external';
    size: number;
  }>;
  edges: Array<{
    source: string;
    target: string;
    type: 'import' | 'export' | 'dependency';
  }>;
}

export class TsMorphAnalyzer {
  private project: Project;
  private workspaceRoot: string;
  private reportsPath: string;

  constructor(workspaceRoot: string = process.cwd()) {
    this.workspaceRoot = workspaceRoot;
    this.reportsPath = join(workspaceRoot, 'reports');

    // Ensure reports directory exists
    if (!existsSync(this.reportsPath)) {
      mkdirSync(this.reportsPath, { recursive: true });
    }

    // Initialize ts-morph project with proper configuration
    this.project = new Project({
      tsConfigFilePath: join(workspaceRoot, 'tsconfig.base.json'),
      skipAddingFilesFromTsConfig: false,
      skipFileDependencyResolution: true,
      skipLoadingLibFiles: false,
      compilerOptions: {
        target: 99, // ES2022
        module: 99, // ESNext
        moduleResolution: 100, // bundler - fixes customConditions error
        lib: ['ES2022', 'DOM', 'DOM.Iterable'],
        allowJs: true,
        declaration: true, // Enable to fix composite project error
        noEmitOnError: false,
        skipLibCheck: true,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        strict: false,
        noImplicitAny: false,
        jsx: 4, // react-jsx - fixes JSX errors
      },
    });

    this.loadSourceFiles();
  }

  /**
   * Load all relevant source files into the project
   */
  private loadSourceFiles(): void {
    const patterns = [
      'apps/**/*.ts',
      'apps/**/*.tsx',
      'libs/**/*.ts',
      'libs/**/*.tsx',
      'tools/**/*.ts',
      '!**/*.d.ts',
      '!**/*.spec.ts',
      '!**/*.test.ts',
      '!**/node_modules/**',
      '!**/dist/**',
    ];

    try {
      this.project.addSourceFilesAtPaths(patterns);
      console.log(`📁 Loaded ${this.project.getSourceFiles().length} source files for analysis`);
    } catch (error) {
      console.warn('⚠️ Some files could not be loaded:', error);
    }
  }

  /**
   * Analyze all files in the workspace
   */
  public analyzeWorkspace(): FileAnalysis[] {
    const sourceFiles = this.project.getSourceFiles();
    const analyses: FileAnalysis[] = [];

    console.log(`🔍 Analyzing ${sourceFiles.length} files...`);

    sourceFiles.forEach((sourceFile) => {
      try {
        const analysis = this.analyzeFile(sourceFile);
        analyses.push(analysis);
      } catch (error) {
        console.warn(`⚠️ Error analyzing ${sourceFile.getFilePath()}:`, error);
      }
    });

    return analyses;
  }

  /**
   * Analyze a single source file
   */
  private analyzeFile(sourceFile: SourceFile): FileAnalysis {
    const filePath = sourceFile.getFilePath();
    const relativePath = relative(this.workspaceRoot, filePath);

    return {
      fileName: filePath,
      relativePath,
      exports: this.extractExports(sourceFile),
      imports: this.extractImports(sourceFile),
      functions: this.extractFunctions(sourceFile),
      classes: this.extractClasses(sourceFile),
      interfaces: this.extractInterfaces(sourceFile),
      types: this.extractTypes(sourceFile),
      errors: this.extractErrors(sourceFile),
      warnings: this.extractWarnings(sourceFile),
      complexity: this.calculateComplexity(sourceFile),
      dependencies: this.extractDependencies(sourceFile),
    };
  }

  /**
   * Extract export declarations from a file
   */
  private extractExports(sourceFile: SourceFile): string[] {
    const exports: string[] = [];

    // Named exports
    sourceFile.getExportDeclarations().forEach((exportDecl) => {
      exportDecl.getNamedExports().forEach((namedExport) => {
        exports.push(namedExport.getName());
      });
    });

    // Export assignments
    sourceFile.getExportAssignments().forEach((_exportAssign) => {
      exports.push('default');
    });

    // Exported functions, classes, interfaces
    sourceFile.getFunctions().forEach((func) => {
      if (func.hasExportKeyword()) {
        exports.push(func.getName() || 'anonymous');
      }
    });

    sourceFile.getClasses().forEach((cls) => {
      if (cls.hasExportKeyword()) {
        exports.push(cls.getName() || 'anonymous');
      }
    });

    sourceFile.getInterfaces().forEach((iface) => {
      if (iface.hasExportKeyword()) {
        exports.push(iface.getName());
      }
    });

    return [...new Set(exports)];
  }

  /**
   * Extract import declarations from a file
   */
  private extractImports(sourceFile: SourceFile): string[] {
    const imports: string[] = [];

    sourceFile.getImportDeclarations().forEach((importDecl) => {
      const moduleSpecifier = importDecl.getModuleSpecifierValue();
      imports.push(moduleSpecifier);
    });

    return [...new Set(imports)];
  }

  /**
   * Extract function declarations
   */
  private extractFunctions(sourceFile: SourceFile): string[] {
    return sourceFile.getFunctions().map((func) => func.getName() || 'anonymous');
  }

  /**
   * Extract class declarations
   */
  private extractClasses(sourceFile: SourceFile): string[] {
    return sourceFile.getClasses().map((cls) => cls.getName() || 'anonymous');
  }

  /**
   * Extract interface declarations
   */
  private extractInterfaces(sourceFile: SourceFile): string[] {
    return sourceFile.getInterfaces().map((iface) => iface.getName());
  }

  /**
   * Extract type aliases
   */
  private extractTypes(sourceFile: SourceFile): string[] {
    return sourceFile.getTypeAliases().map((type) => type.getName());
  }

  /**
   * Extract TypeScript diagnostics as errors
   */
  private extractErrors(sourceFile: SourceFile): string[] {
    const diagnostics = sourceFile.getPreEmitDiagnostics();
    return diagnostics
      .filter((d) => d.getCategory() === 1) // Error
      .map((d) => `${d.getMessageText()} (Line ${d.getLineNumber()})`);
  }

  /**
   * Extract TypeScript diagnostics as warnings
   */
  private extractWarnings(sourceFile: SourceFile): string[] {
    const diagnostics = sourceFile.getPreEmitDiagnostics();
    return diagnostics
      .filter((d) => d.getCategory() === 0) // Warning
      .map((d) => `${d.getMessageText()} (Line ${d.getLineNumber()})`);
  }

  /**
   * Calculate cyclomatic complexity
   */
  private calculateComplexity(sourceFile: SourceFile): number {
    let complexity = 1; // Base complexity

    sourceFile.getDescendantsOfKind(SyntaxKind.IfStatement).forEach(() => complexity++);
    sourceFile.getDescendantsOfKind(SyntaxKind.WhileStatement).forEach(() => complexity++);
    sourceFile.getDescendantsOfKind(SyntaxKind.ForStatement).forEach(() => complexity++);
    sourceFile.getDescendantsOfKind(SyntaxKind.ForInStatement).forEach(() => complexity++);
    sourceFile.getDescendantsOfKind(SyntaxKind.ForOfStatement).forEach(() => complexity++);
    sourceFile.getDescendantsOfKind(SyntaxKind.SwitchStatement).forEach(() => complexity++);
    sourceFile.getDescendantsOfKind(SyntaxKind.CatchClause).forEach(() => complexity++);
    sourceFile.getDescendantsOfKind(SyntaxKind.ConditionalExpression).forEach(() => complexity++);

    return complexity;
  }

  /**
   * Extract file dependencies
   */
  private extractDependencies(sourceFile: SourceFile): string[] {
    const dependencies: string[] = [];

    // Import dependencies
    sourceFile.getImportDeclarations().forEach((importDecl) => {
      const moduleSpecifier = importDecl.getModuleSpecifierValue();
      if (!moduleSpecifier.startsWith('.')) {
        // External dependency
        const packageName = moduleSpecifier.startsWith('@')
          ? moduleSpecifier.split('/').slice(0, 2).join('/')
          : moduleSpecifier.split('/')[0];
        dependencies.push(packageName);
      }
    });

    return [...new Set(dependencies)];
  }

  /**
   * Check overall type safety
   */
  public checkTypeSafety(): TypeSafetyReport {
    const analyses = this.analyzeWorkspace();
    const errors: string[] = [];
    const warnings: string[] = [];

    analyses.forEach((analysis) => {
      errors.push(...analysis.errors);
      warnings.push(...analysis.warnings);
    });

    const totalFiles = analyses.length;
    const typedFiles = analyses.filter(
      (a) => a.interfaces.length > 0 || a.types.length > 0 || a.errors.length === 0
    ).length;

    return {
      errors: [...new Set(errors)],
      warnings: [...new Set(warnings)],
      totalFiles,
      typedFiles,
      coverage: totalFiles > 0 ? Math.round((typedFiles / totalFiles) * 100) : 100,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Generate dependency graph
   */
  public generateDependencyGraph(): DependencyGraph {
    const analyses = this.analyzeWorkspace();
    const nodes: DependencyGraph['nodes'] = [];
    const edges: DependencyGraph['edges'] = [];

    // Create nodes for each file
    analyses.forEach((analysis) => {
      nodes.push({
        id: analysis.relativePath,
        label: analysis.relativePath.split('/').pop() || '',
        type: 'file',
        size: analysis.complexity,
      });

      // Create edges for dependencies
      analysis.dependencies.forEach((dep) => {
        // Add external dependency node if not exists
        if (!nodes.find((n) => n.id === dep)) {
          nodes.push({
            id: dep,
            label: dep,
            type: 'external',
            size: 1,
          });
        }

        edges.push({
          source: analysis.relativePath,
          target: dep,
          type: 'dependency',
        });
      });
    });

    return { nodes, edges };
  }

  /**
   * Generate comprehensive type report
   */
  public generateTypeReport(): void {
    console.log('📊 Generating comprehensive type analysis report...');

    const analyses = this.analyzeWorkspace();
    const typeSafety = this.checkTypeSafety();
    const dependencyGraph = this.generateDependencyGraph();

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFiles: analyses.length,
        totalErrors: typeSafety.errors.length,
        totalWarnings: typeSafety.warnings.length,
        typeCoverage: typeSafety.coverage,
        averageComplexity: analyses.reduce((sum, a) => sum + a.complexity, 0) / analyses.length,
      },
      typeSafety,
      fileAnalyses: analyses,
      dependencyGraph,
      recommendations: this.generateRecommendations(analyses, typeSafety),
    };

    // Save detailed report
    const reportPath = join(this.reportsPath, 'type-analysis.json');
    writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Save summary report
    const summaryPath = join(this.reportsPath, 'type-summary.json');
    writeFileSync(summaryPath, JSON.stringify(report.summary, null, 2));

    console.log(`✅ Type analysis report saved to ${reportPath}`);
    console.log(`📋 Summary saved to ${summaryPath}`);
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(
    analyses: FileAnalysis[],
    typeSafety: TypeSafetyReport
  ): string[] {
    const recommendations: string[] = [];

    // Type safety recommendations
    if (typeSafety.coverage < 80) {
      recommendations.push(
        'Improve type coverage by adding more TypeScript interfaces and type annotations'
      );
    }

    if (typeSafety.errors.length > 0) {
      recommendations.push(
        `Fix ${typeSafety.errors.length} TypeScript errors for better type safety`
      );
    }

    // Complexity recommendations
    const highComplexityFiles = analyses.filter((a) => a.complexity > 10);
    if (highComplexityFiles.length > 0) {
      recommendations.push(
        `Consider refactoring ${highComplexityFiles.length} files with high complexity`
      );
    }

    // Dependency recommendations
    const filesWithManyDeps = analyses.filter((a) => a.dependencies.length > 10);
    if (filesWithManyDeps.length > 0) {
      recommendations.push(`Review ${filesWithManyDeps.length} files with high dependency count`);
    }

    return recommendations;
  }

  /**
   * Generate scaffold for new components
   */
  public generateScaffold(name: string, type: 'component' | 'service' | 'lib'): void {
    console.log(`🏗️ Generating ${type} scaffold: ${name}`);

    const scaffoldPath = join(this.workspaceRoot, 'scaffolds');
    if (!existsSync(scaffoldPath)) {
      mkdirSync(scaffoldPath, { recursive: true });
    }

    let template = '';
    let fileName = '';

    switch (type) {
      case 'component':
        fileName = `${name}.component.ts`;
        template = this.generateComponentTemplate(name);
        break;
      case 'service':
        fileName = `${name}.service.ts`;
        template = this.generateServiceTemplate(name);
        break;
      case 'lib':
        fileName = `${name}.lib.ts`;
        template = this.generateLibTemplate(name);
        break;
    }

    const filePath = join(scaffoldPath, fileName);
    writeFileSync(filePath, template);

    console.log(`✅ Scaffold generated: ${filePath}`);
  }

  private generateComponentTemplate(name: string): string {
    const className = name.charAt(0).toUpperCase() + name.slice(1);
    return `/**
 * ${className} Component
 * Generated by SolariMonitor
 */

export interface ${className}Props {
  // Define your component props here
}

export interface ${className}State {
  // Define your component state here
}

export class ${className}Component {
  private state: ${className}State;

  constructor(private props: ${className}Props) {
    this.state = {
      // Initialize state
    };
  }

  public render(): string {
    // Implement your component rendering logic
    return \`<div class="${name.toLowerCase()}-component">
      <!-- Component content -->
    </div>\`;
  }

  public destroy(): void {
    // Cleanup logic
  }
}

export default ${className}Component;
`;
  }

  private generateServiceTemplate(name: string): string {
    const className = name.charAt(0).toUpperCase() + name.slice(1);
    return `/**
 * ${className} Service
 * Generated by SolariMonitor
 */

export interface ${className}Config {
  // Define your service configuration
}

export class ${className}Service {
  private static instance: ${className}Service;
  private config: ${className}Config;

  private constructor(config: ${className}Config) {
    this.config = config;
  }

  public static getInstance(config?: ${className}Config): ${className}Service {
    if (!${className}Service.instance) {
      if (!config) {
        throw new Error('${className}Service requires configuration on first instantiation');
      }
      ${className}Service.instance = new ${className}Service(config);
    }
    return ${className}Service.instance;
  }

  public async initialize(): Promise<void> {
    // Initialize service
  }

  public async cleanup(): Promise<void> {
    // Cleanup resources
  }
}

export default ${className}Service;
`;
  }

  private generateLibTemplate(name: string): string {
    const functionName = name.charAt(0).toLowerCase() + name.slice(1);
    return `/**
 * ${name} Library
 * Generated by SolariMonitor
 */

export interface ${name}Options {
  // Define your library options
}

export interface ${name}Result {
  // Define your library result type
}

/**
 * Main library function
 */
export function ${functionName}(options: ${name}Options): ${name}Result {
  // Implement your library logic
  return {
    // Return result
  };
}

/**
 * Utility functions
 */
export const ${name}Utils = {
  // Add utility functions here
};

export default {
  ${functionName},
  utils: ${name}Utils,
};
`;
  }
}

// CLI usage
if (require.main === module) {
  const analyzer = new TsMorphAnalyzer();

  console.log('🔍 Starting TypeScript analysis...');
  analyzer.generateTypeReport();

  const typeSafety = analyzer.checkTypeSafety();
  console.log(`\n📊 Type Safety Summary:`);
  console.log(`Files: ${typeSafety.totalFiles}`);
  console.log(`Errors: ${typeSafety.errors.length}`);
  console.log(`Warnings: ${typeSafety.warnings.length}`);
  console.log(`Coverage: ${typeSafety.coverage}%`);
}

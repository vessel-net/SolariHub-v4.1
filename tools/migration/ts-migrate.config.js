module.exports = {
  // Project configuration
  project: {
    name: 'SolariHub',
    rootDir: '.',
    srcDir: ['apps', 'libs', 'tools'],
    excludeDirs: ['node_modules', 'dist', 'build', '.nx', 'coverage'],
  },

  // Migration settings
  migration: {
    // Files to process
    include: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
    exclude: [
      '**/*.spec.ts',
      '**/*.test.ts',
      '**/*.spec.tsx',
      '**/*.test.tsx',
      '**/node_modules/**',
      '**/dist/**',
      '**/.nx/**',
    ],

    // TypeScript configuration
    typescript: {
      strict: true,
      noImplicitAny: true,
      strictNullChecks: true,
      strictFunctionTypes: true,
      noImplicitReturns: true,
      noFallthroughCasesInSwitch: true,
    },

    // Plugins to run during migration
    plugins: [
      // Core plugins
      'ts-migrate-plugin-strip-ts-ignore',
      'ts-migrate-plugin-add-conversions',
      'ts-migrate-plugin-declare-missing-class-properties',
      'ts-migrate-plugin-hoist-class-statics',
      
      // Type annotation plugins
      'ts-migrate-plugin-any-alias',
      'ts-migrate-plugin-explicit-any',
      'ts-migrate-plugin-jsdoc',
      
      // Import/export plugins
      'ts-migrate-plugin-react-class-state',
      'ts-migrate-plugin-react-class-lifecycle',
      'ts-migrate-plugin-react-default-props',
      'ts-migrate-plugin-react-props',
    ],

    // Plugin-specific configuration
    pluginOptions: {
      'ts-migrate-plugin-explicit-any': {
        shouldUpdateAirbnbImports: false,
      },
      'ts-migrate-plugin-react-props': {
        shouldUpdateReactDefaultProps: true,
      },
    },
  },

  // Output configuration
  output: {
    // Generate migration report
    generateReport: true,
    reportPath: './reports/ts-migrate-report.json',
    
    // Backup original files
    createBackups: true,
    backupDir: './backups/ts-migrate',
    
    // Log level
    logLevel: 'info', // 'debug', 'info', 'warn', 'error'
  },

  // Rules for different file types
  rules: {
    // React component rules
    react: {
      enforcePropsInterface: true,
      enforceStateInterface: true,
      preferFunctionComponents: true,
      requireDefaultProps: false,
    },

    // Node.js/Express rules
    node: {
      enforceTypedRoutes: true,
      requireRequestTyping: true,
      enforceErrorHandling: true,
    },

    // Library rules
    library: {
      enforceExportTypes: true,
      requirePublicApiTypes: true,
      enforceDocumentation: false,
    },
  },

  // Custom transformations
  transformations: {
    // Convert console.log to proper logging
    replaceConsoleLog: {
      enabled: false, // Enable when ready
      replacement: 'logger.info',
    },

    // Convert var to const/let
    modernizeVariables: {
      enabled: true,
      preferConst: true,
    },

    // Add missing return types
    addReturnTypes: {
      enabled: true,
      inferFromBody: true,
    },
  },

  // Quality gates
  qualityGates: {
    // Maximum number of 'any' types allowed
    maxAnyTypes: 50,
    
    // Minimum type coverage percentage
    minTypeCoverage: 80,
    
    // Maximum TypeScript errors allowed
    maxTsErrors: 10,
    
    // Required interfaces for key components
    requiredInterfaces: [
      'Props',
      'State', 
      'Config',
      'Response',
      'Request',
    ],
  },

  // Integration with other tools
  integrations: {
    // ESLint integration
    eslint: {
      enabled: true,
      configPath: './eslint.config.mjs',
      fixOnMigration: true,
    },

    // Prettier integration
    prettier: {
      enabled: true,
      configPath: './.prettierrc',
      formatOnMigration: true,
    },

    // SolariMonitor integration
    solariMonitor: {
      enabled: true,
      reportToMonitor: true,
      updateDashboard: true,
    },
  },

  // Progressive migration strategy
  progressive: {
    enabled: true,
    
    // Migration phases
    phases: [
      {
        name: 'Phase 1: Core Types',
        description: 'Migrate core type definitions and interfaces',
        files: ['libs/types/**/*'],
        strictness: 'high',
      },
      {
        name: 'Phase 2: Backend API',
        description: 'Migrate backend services and routes',
        files: ['apps/backend/**/*'],
        strictness: 'high',
      },
      {
        name: 'Phase 3: Frontend Components',
        description: 'Migrate React components',
        files: ['apps/frontend/**/*'],
        strictness: 'medium',
      },
      {
        name: 'Phase 4: Tools & Utilities',
        description: 'Migrate development tools',
        files: ['tools/**/*'],
        strictness: 'low',
      },
    ],

    // Phase execution order
    executeInOrder: true,
    stopOnPhaseFailure: false,
  },

  // Workspace-specific rules
  workspace: {
    // Nx monorepo considerations
    nx: {
      respectProjectBoundaries: true,
      enforceModuleBoundaries: true,
      validateImports: true,
    },

    // Shared library rules
    sharedLibraries: {
      enforceStrictTypes: true,
      requireExportedTypes: true,
      noInternalImports: true,
    },
  },
}; 
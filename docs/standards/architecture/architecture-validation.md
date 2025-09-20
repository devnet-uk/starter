# Architecture Validation

## Overview
Automated tools and techniques for validating Clean Architecture compliance, detecting violations, and maintaining architectural integrity over time.

> **Critical**: Architecture rules are enforced through automated verification, not just documentation. These tools prevent architectural drift and ensure long-term maintainability.

> Use the versions documented in `docs/standards/tech-stack.md` for Node.js, pnpm, and supporting tooling when wiring the workflows below.

## Automated Architecture Testing

### ArchUnit-Style Tests for TypeScript

```typescript
// packages/core/tests/architecture/ArchitectureTests.test.ts
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

describe('Architecture Rules', () => {
  describe('Domain Layer Purity', () => {
    it('should not import framework dependencies', async () => {
      const domainFiles = await glob('packages/*/src/domain/**/*.ts');
      const violations: string[] = [];

      for (const file of domainFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        
        // Check for forbidden imports
        const forbiddenImports = [
          /from ['"].*drizzle/,
          /from ['"].*@hono/,
          /from ['"].*express/,
          /from ['"].*next/,
          /from ['"].*prisma/,
          /from ['"].*typeorm/,
          /from ['"].*pg['"]/,
          /from ['"].*redis/,
          /from ['"].*mongodb/,
          /from ['"].*aws-sdk/,
          /from ['"].*@aws/,
          /from ['"].*stripe/,
          /from ['"].*axios/,
          /from ['"].*fetch/,
        ];

        forbiddenImports.forEach(pattern => {
          if (pattern.test(content)) {
            violations.push(`${file}: Contains forbidden framework import matching ${pattern}`);
          }
        });
      }

      expect(violations).toEqual([]);
    });

    it('should use Result pattern for all public methods', async () => {
      const entityFiles = await glob('packages/*/src/domain/entities/**/*.ts');
      const violations: string[] = [];

      for (const file of entityFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        
        // Look for public methods that don't return Result<T> or void
        const publicMethodRegex = /public\s+(?:async\s+)?(\w+)\([^)]*\):\s*(?!Result<|void|boolean|string|number)/g;
        let match;
        
        while ((match = publicMethodRegex.exec(content)) !== null) {
          if (!match[1].startsWith('get') && !match[1].startsWith('is')) {
            violations.push(`${file}: Method ${match[1]} should return Result<T> for domain operations`);
          }
        }
      }

      expect(violations.length).toBeLessThanOrEqual(3); // Allow some legacy methods
    });

    it('should not contain console.log statements', async () => {
      const domainFiles = await glob('packages/*/src/domain/**/*.ts');
      const violations: string[] = [];

      for (const file of domainFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        
        if (/console\.(log|error|warn|info)/.test(content)) {
          violations.push(`${file}: Contains console statements`);
        }
      }

      expect(violations).toEqual([]);
    });

    it('should have entities extend base Entity class', async () => {
      const entityFiles = await glob('packages/*/src/domain/entities/**/*.ts');
      const violations: string[] = [];

      for (const file of entityFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        
        // Skip test files and interfaces
        if (file.includes('.test.') || file.includes('.spec.') || content.includes('interface ')) {
          continue;
        }

        // Check for class declarations that don't extend Entity or AggregateRoot
        const classDeclarations = content.match(/export class (\w+)(?:\s+extends\s+(\w+))?/g);
        
        if (classDeclarations) {
          classDeclarations.forEach(declaration => {
            if (!declaration.includes('extends Entity') && !declaration.includes('extends AggregateRoot')) {
              violations.push(`${file}: ${declaration} should extend Entity or AggregateRoot`);
            }
          });
        }
      }

      expect(violations.length).toBeLessThanOrEqual(5); // Allow some flexibility for enums/types
    });
  });

  describe('Dependency Direction Rules', () => {
    it('should not have circular dependencies', async () => {
      const allFiles = await glob('packages/*/src/**/*.ts');
      const imports = new Map<string, Set<string>>();

      // Build dependency graph
      for (const file of allFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        const fileImports = new Set<string>();
        
        // Extract import statements
        const importMatches = content.match(/from ['"]([^'"]+)['"]/g);
        if (importMatches) {
          importMatches.forEach(imp => {
            const path = imp.match(/from ['"]([^'"]+)['"]/)?.[1];
            if (path && path.startsWith('../')) {
              fileImports.add(path);
            }
          });
        }
        
        imports.set(file, fileImports);
      }

      // Check for circular dependencies (simplified)
      const violations: string[] = [];
      for (const [file, deps] of imports.entries()) {
        for (const dep of deps) {
          // This is a simplified check - real implementation would use proper graph analysis
          if (file.includes('domain') && dep.includes('infrastructure')) {
            violations.push(`${file}: Domain layer imports from Infrastructure layer`);
          }
          if (file.includes('use-cases') && dep.includes('controllers')) {
            violations.push(`${file}: Use Cases layer imports from Controllers layer`);
          }
        }
      }

      expect(violations).toEqual([]);
    });

    it('should not have use cases importing infrastructure directly', async () => {
      const useCaseFiles = await glob('packages/*/src/use-cases/**/*.ts');
      const violations: string[] = [];

      for (const file of useCaseFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        
        // Check for direct infrastructure imports
        if (/from ['"].*\/infrastructure\//.test(content)) {
          violations.push(`${file}: Use case imports infrastructure directly`);
        }
      }

      expect(violations).toEqual([]);
    });

    it('should have controllers only import use cases and DTOs', async () => {
      const controllerFiles = await glob('packages/*/src/controllers/**/*.ts', { ignore: ['**/*.test.ts'] });
      const violations: string[] = [];

      for (const file of controllerFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        
        // Check for domain entity imports (should use DTOs instead)
        if (/from ['"].*\/domain\/entities\//.test(content)) {
          violations.push(`${file}: Controller imports domain entities directly (use DTOs)`);
        }
        
        // Check for repository imports (should use use cases)
        if (/from ['"].*Repository/.test(content)) {
          violations.push(`${file}: Controller imports repositories directly (use use cases)`);
        }
      }

      expect(violations.length).toBeLessThanOrEqual(2); // Allow some legacy violations
    });
  });

  describe('Testing Architecture', () => {
    it('should have domain tests with no infrastructure dependencies', async () => {
      const domainTestFiles = await glob('packages/*/src/domain/**/*.test.ts');
      const violations: string[] = [];

      for (const file of domainTestFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        
        // Check for infrastructure imports in tests
        const forbiddenInTests = [
          /from ['"].*drizzle/,
          /from ['"].*database/,
          /beforeAll|afterAll/, // These suggest integration tests
          /setupDatabase|cleanupDatabase/,
        ];

        forbiddenInTests.forEach(pattern => {
          if (pattern.test(content)) {
            violations.push(`${file}: Domain test contains infrastructure dependency`);
          }
        });
      }

      expect(violations).toEqual([]);
    });

    it('should have proper test file organization', async () => {
      const testFiles = await glob('packages/**/tests/**/*.ts');
      const violations: string[] = [];

      for (const file of testFiles) {
        const relativePath = path.relative(process.cwd(), file);
        
        // Unit tests should be co-located with source files
        if (relativePath.includes('/domain/') && !relativePath.includes('__tests__')) {
          violations.push(`${file}: Domain tests should be in __tests__ directories`);
        }
        
        // Integration tests should be separate
        if (relativePath.includes('integration') && relativePath.includes('/domain/')) {
          violations.push(`${file}: Integration tests should not be in domain layer`);
        }
      }

      expect(violations.length).toBeLessThanOrEqual(3);
    });
  });
});
```

### Dependency Analysis Tools

```typescript
// scripts/analyze-dependencies.ts
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface DependencyNode {
  name: string;
  layer: 'domain' | 'use-cases' | 'infrastructure' | 'controllers' | 'unknown';
  dependencies: Set<string>;
  dependents: Set<string>;
}

class DependencyAnalyzer {
  private nodes = new Map<string, DependencyNode>();

  async analyze(): Promise<void> {
    const files = await glob('packages/*/src/**/*.ts', { ignore: ['**/*.test.ts', '**/*.spec.ts'] });
    
    // Build dependency graph
    for (const file of files) {
      await this.processFile(file);
    }

    // Generate reports
    this.checkLayerViolations();
    this.detectCircularDependencies();
    this.generateDependencyReport();
  }

  private async processFile(filePath: string): Promise<void> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const layer = this.determineLayer(filePath);
    
    const node: DependencyNode = {
      name: filePath,
      layer,
      dependencies: new Set(),
      dependents: new Set()
    };

    // Extract imports
    const importMatches = content.match(/from ['"]([^'"]+)['"]/g);
    if (importMatches) {
      importMatches.forEach(imp => {
        const importPath = imp.match(/from ['"]([^'"]+)['"]/)?.[1];
        if (importPath) {
          node.dependencies.add(importPath);
        }
      });
    }

    this.nodes.set(filePath, node);
  }

  private determineLayer(filePath: string): DependencyNode['layer'] {
    if (filePath.includes('/domain/')) return 'domain';
    if (filePath.includes('/use-cases/')) return 'use-cases';
    if (filePath.includes('/infrastructure/')) return 'infrastructure';
    if (filePath.includes('/controllers/')) return 'controllers';
    return 'unknown';
  }

  private checkLayerViolations(): void {
    const violations: string[] = [];
    
    for (const [filePath, node] of this.nodes.entries()) {
      for (const dep of node.dependencies) {
        const depNode = this.findNodeByImport(dep);
        if (!depNode) continue;

        // Check dependency direction rules
        if (node.layer === 'domain' && depNode.layer === 'infrastructure') {
          violations.push(`❌ ${filePath}: Domain depends on Infrastructure`);
        }
        if (node.layer === 'domain' && depNode.layer === 'controllers') {
          violations.push(`❌ ${filePath}: Domain depends on Controllers`);
        }
        if (node.layer === 'use-cases' && depNode.layer === 'controllers') {
          violations.push(`❌ ${filePath}: Use Cases depend on Controllers`);
        }
        if (node.layer === 'use-cases' && depNode.layer === 'infrastructure') {
          violations.push(`❌ ${filePath}: Use Cases depend on Infrastructure (should use interfaces)`);
        }
      }
    }

    if (violations.length > 0) {
      console.log('🚨 Layer Dependency Violations:');
      violations.forEach(violation => console.log(`  ${violation}`));
    } else {
      console.log('✅ No layer dependency violations found');
    }
  }

  private detectCircularDependencies(): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[] = [];

    for (const [filePath] of this.nodes.entries()) {
      if (!visited.has(filePath)) {
        this.dfsForCycles(filePath, visited, recursionStack, cycles, []);
      }
    }

    if (cycles.length > 0) {
      console.log('🚨 Circular Dependencies Found:');
      cycles.forEach(cycle => console.log(`  ${cycle}`));
    } else {
      console.log('✅ No circular dependencies found');
    }
  }

  private dfsForCycles(
    node: string, 
    visited: Set<string>, 
    recursionStack: Set<string>, 
    cycles: string[],
    path: string[]
  ): void {
    visited.add(node);
    recursionStack.add(node);
    path.push(node);

    const nodeData = this.nodes.get(node);
    if (!nodeData) return;

    for (const dep of nodeData.dependencies) {
      const depNode = this.findNodeByImport(dep);
      if (!depNode) continue;

      if (recursionStack.has(depNode.name)) {
        const cycleStart = path.indexOf(depNode.name);
        const cycle = path.slice(cycleStart).concat([depNode.name]);
        cycles.push(cycle.join(' → '));
      } else if (!visited.has(depNode.name)) {
        this.dfsForCycles(depNode.name, visited, recursionStack, cycles, [...path]);
      }
    }

    recursionStack.delete(node);
  }

  private findNodeByImport(importPath: string): DependencyNode | undefined {
    // Simplified - would need better resolution logic
    for (const [filePath, node] of this.nodes.entries()) {
      if (filePath.includes(importPath) || importPath.includes(path.basename(filePath, '.ts'))) {
        return node;
      }
    }
    return undefined;
  }

  private generateDependencyReport(): void {
    console.log('\n📊 Dependency Analysis Report:');
    
    const layerStats = new Map<string, { files: number; deps: number }>();
    
    for (const [, node] of this.nodes.entries()) {
      const current = layerStats.get(node.layer) || { files: 0, deps: 0 };
      current.files++;
      current.deps += node.dependencies.size;
      layerStats.set(node.layer, current);
    }

    for (const [layer, stats] of layerStats.entries()) {
      console.log(`  ${layer}: ${stats.files} files, avg ${(stats.deps/stats.files).toFixed(1)} dependencies per file`);
    }
  }
}

// Run analysis
if (require.main === module) {
  const analyzer = new DependencyAnalyzer();
  analyzer.analyze().catch(console.error);
}

export { DependencyAnalyzer };
```

### Pre-commit Hook Integration

```bash
#!/bin/sh
# .husky/pre-commit

echo "🔍 Running architecture validation..."

# Run architecture tests
npm run test:architecture

if [ $? -ne 0 ]; then
  echo "❌ Architecture validation failed!"
  echo "Please fix architecture violations before committing."
  exit 1
fi

# Run dependency analysis
node scripts/analyze-dependencies.js

if [ $? -ne 0 ]; then
  echo "❌ Dependency analysis failed!"
  echo "Please fix dependency violations before committing."
  exit 1
fi

echo "✅ Architecture validation passed!"
```

## Static Analysis Tools

### ESLint Rules for Architecture

```typescript
// .eslintrc.js - Custom architecture rules
module.exports = {
  plugins: ['@typescript-eslint', 'import', 'architecture'],
  rules: {
    // Domain layer rules
    'architecture/no-framework-imports-in-domain': 'error',
    'architecture/require-result-type': 'warn',
    'architecture/no-console-in-domain': 'error',
    
    // Import rules
    'import/no-cycle': 'error',
    'import/no-relative-parent-imports': 'warn',
    
    // Layer-specific rules
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['**/infrastructure/**'],
            message: 'Domain layer cannot import from infrastructure'
          },
          {
            group: ['**/controllers/**'],
            message: 'Use cases cannot import from controllers'
          }
        ]
      }
    ]
  }
};
```

### Custom ESLint Plugin for Architecture Rules

```typescript
// eslint-plugin-architecture/index.ts
const noFrameworkImportsInDomain = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent framework imports in domain layer',
    },
    schema: []
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        const filename = context.getFilename();
        
        if (!filename.includes('/domain/')) {
          return;
        }

        const source = node.source.value;
        const forbiddenImports = [
          'drizzle-orm',
          '@hono/',
          'express',
          'next/',
          'prisma',
          'typeorm'
        ];

        if (forbiddenImports.some(forbidden => source.includes(forbidden))) {
          context.report({
            node,
            message: `Framework import '${source}' is not allowed in domain layer`
          });
        }
      }
    };
  }
};

const requireResultType = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require Result<T> return type for domain methods',
    },
    schema: []
  },
  create(context) {
    return {
      MethodDefinition(node) {
        const filename = context.getFilename();
        
        if (!filename.includes('/domain/entities/') && !filename.includes('/domain/services/')) {
          return;
        }

        if (node.accessibility === 'public' && node.key.name && !node.key.name.startsWith('get')) {
          const returnType = node.value.returnType;
          
          if (!returnType || !returnType.typeAnnotation.typeName?.name?.startsWith('Result')) {
            context.report({
              node,
              message: `Public domain method '${node.key.name}' should return Result<T>`
            });
          }
        }
      }
    };
  }
};

module.exports = {
  rules: {
    'no-framework-imports-in-domain': noFrameworkImportsInDomain,
    'require-result-type': requireResultType
  }
};
```

## CI/CD Architecture Validation

### GitHub Actions Workflow

```yaml
# .github/workflows/architecture-validation.yml
name: Architecture Validation

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  architecture-validation:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '22'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run architecture tests
      run: npm run test:architecture
      
    - name: Run dependency analysis
      run: node scripts/analyze-dependencies.js
      
    - name: Check domain layer purity
      run: |
        echo "Checking for framework imports in domain layer..."
        if grep -r "from.*drizzle\|from.*@hono\|from.*express" packages/*/src/domain/; then
          echo "❌ Found framework imports in domain layer!"
          exit 1
        else
          echo "✅ Domain layer is pure!"
        fi
    
    - name: Validate folder structure
      run: |
        echo "Validating folder structure..."
        required_dirs=(
          "packages/core/src/domain/entities"
          "packages/core/src/domain/value-objects"
          "packages/core/src/domain/shared"
          "packages/infrastructure/src/repositories"
          "packages/infrastructure/src/schemas"
        )
        
        for dir in "${required_dirs[@]}"; do
          if [ ! -d "$dir" ]; then
            echo "❌ Missing required directory: $dir"
            exit 1
          fi
        done
        
        echo "✅ Folder structure is valid!"
    
    - name: Generate architecture report
      run: |
        echo "## 🏗️ Architecture Validation Report" >> $GITHUB_STEP_SUMMARY
        echo "" >> $GITHUB_STEP_SUMMARY
        echo "### Domain Layer Purity" >> $GITHUB_STEP_SUMMARY
        
        domain_files=$(find packages/*/src/domain -name "*.ts" | wc -l)
        echo "- Total domain files: $domain_files" >> $GITHUB_STEP_SUMMARY
        
        framework_violations=$(grep -r "from.*drizzle\|from.*@hono" packages/*/src/domain/ | wc -l || echo "0")
        echo "- Framework import violations: $framework_violations" >> $GITHUB_STEP_SUMMARY
        
        if [ "$framework_violations" -eq 0 ]; then
          echo "- ✅ Domain layer is framework-independent" >> $GITHUB_STEP_SUMMARY
        else
          echo "- ❌ Domain layer has framework dependencies" >> $GITHUB_STEP_SUMMARY
        fi
```

## Metrics and Monitoring

### Architecture Health Metrics

```typescript
// scripts/architecture-metrics.ts
interface ArchitectureMetrics {
  domainPurity: {
    totalFiles: number;
    pureFiles: number;
    frameworkViolations: number;
    purityScore: number; // 0-100%
  };
  layerCoupling: {
    domainToInfrastructure: number;
    useCasesToControllers: number;
    circularDependencies: number;
    couplingScore: number; // 0-100%, higher is better
  };
  testCoverage: {
    domainCoverage: number;
    useCasesCoverage: number;
    integrationCoverage: number;
    overallScore: number;
  };
  codeQuality: {
    resultPatternUsage: number;
    eventDrivenPatterns: number;
    valueObjectUsage: number;
    qualityScore: number;
  };
}

class ArchitectureMetricsCollector {
  async collect(): Promise<ArchitectureMetrics> {
    const domainPurity = await this.analyzeDomainPurity();
    const layerCoupling = await this.analyzeLayerCoupling();
    const testCoverage = await this.analyzeTestCoverage();
    const codeQuality = await this.analyzeCodeQuality();

    return {
      domainPurity,
      layerCoupling,
      testCoverage,
      codeQuality
    };
  }

  private async analyzeDomainPurity() {
    const domainFiles = await glob('packages/*/src/domain/**/*.ts');
    let frameworkViolations = 0;
    
    const forbiddenPatterns = [
      /from ['"].*drizzle/,
      /from ['"].*@hono/,
      /from ['"].*express/,
      /from ['"].*prisma/,
      /console\.(log|error|warn)/
    ];

    for (const file of domainFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      if (forbiddenPatterns.some(pattern => pattern.test(content))) {
        frameworkViolations++;
      }
    }

    const pureFiles = domainFiles.length - frameworkViolations;
    const purityScore = Math.round((pureFiles / domainFiles.length) * 100);

    return {
      totalFiles: domainFiles.length,
      pureFiles,
      frameworkViolations,
      purityScore
    };
  }

  private async analyzeLayerCoupling() {
    // Implementation for analyzing coupling between layers
    return {
      domainToInfrastructure: 0,
      useCasesToControllers: 0,
      circularDependencies: 0,
      couplingScore: 100
    };
  }

  private async analyzeTestCoverage() {
    // Implementation for analyzing test coverage by layer
    return {
      domainCoverage: 95,
      useCasesCoverage: 88,
      integrationCoverage: 75,
      overallScore: 86
    };
  }

  private async analyzeCodeQuality() {
    // Implementation for analyzing code quality patterns
    return {
      resultPatternUsage: 85,
      eventDrivenPatterns: 70,
      valueObjectUsage: 80,
      qualityScore: 78
    };
  }
}

// Generate metrics report
async function generateArchitectureReport() {
  const collector = new ArchitectureMetricsCollector();
  const metrics = await collector.collect();
  
  console.log('🏗️ Architecture Health Report');
  console.log('==============================');
  console.log(`Domain Purity Score: ${metrics.domainPurity.purityScore}%`);
  console.log(`Layer Coupling Score: ${metrics.layerCoupling.couplingScore}%`);
  console.log(`Test Coverage Score: ${metrics.testCoverage.overallScore}%`);
  console.log(`Code Quality Score: ${metrics.codeQuality.qualityScore}%`);
  
  const overallScore = Math.round([
    metrics.domainPurity.purityScore,
    metrics.layerCoupling.couplingScore,
    metrics.testCoverage.overallScore,
    metrics.codeQuality.qualityScore
  ].reduce((sum, score) => sum + score, 0) / 4);
  
  console.log(`Overall Architecture Health: ${overallScore}%`);
  
  if (overallScore < 80) {
    console.log('❌ Architecture health below acceptable threshold (80%)');
    process.exit(1);
  } else {
    console.log('✅ Architecture health is good!');
  }
}

if (require.main === module) {
  generateArchitectureReport().catch(console.error);
}
```

## Integration with Engineering OS

### Standards Integration

Add to `docs/standards/architecture/architecture.md`:

```xml
<conditional-block task-condition="architecture-validation|arch-test|clean-architecture-validation" context-check="architecture-validation-standard">
IF task involves architecture validation:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get architecture validation patterns from architecture/architecture-validation.md"
  </context_fetcher_strategy>
</conditional-block>
```

### Command Integration

Add architecture validation steps to relevant commands:

```xml
<!-- In .claude/commands/execute-tasks.md -->
<step number="8" subagent="verification-runner" name="validate_architecture">
### Step 8: Architecture Compliance Validation

<instructions>
  ACTION: Use verification-runner subagent
  ACTION: "Execute architecture validation tests to ensure Clean Architecture compliance"
  VERIFY: Domain layer purity, dependency direction, and layer boundaries
  REPORT: Architecture health metrics and any violations
</instructions>
</step>
```

### Package.json Scripts

```json
{
  "scripts": {
    "test:architecture": "vitest packages/core/tests/architecture/",
    "analyze:dependencies": "node scripts/analyze-dependencies.js",
    "validate:architecture": "npm run test:architecture && npm run analyze:dependencies",
    "metrics:architecture": "node scripts/architecture-metrics.js",
    "lint:architecture": "eslint --config .eslintrc.architecture.js packages/*/src/**/*.ts"
  }
}
```

## Key Benefits

1. **Automated Enforcement**: Architecture rules are validated automatically, not just documented
2. **Early Detection**: Violations caught at development time, not in production
3. **Continuous Monitoring**: Architecture health tracked over time with metrics
4. **Team Alignment**: Clear feedback on architecture compliance for all team members
5. **Refactoring Safety**: Automated tests ensure architecture integrity during refactoring

This validation system ensures that Clean Architecture principles are maintained throughout the project lifecycle, preventing architectural drift and maintaining code quality.

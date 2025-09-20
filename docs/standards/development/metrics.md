# Development Metrics and Quality Tracking

## Core Quality Metrics

> Pipelines and tooling referenced in this standard (Node.js, pnpm, analysis utilities) must use the versions recorded in `docs/standards/tech-stack.md`.

<conditional-block task-condition="metrics|quality-tracking|dashboard" context-check="core-quality-metrics">
IF task involves quality metrics or tracking:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get core quality metrics from development/metrics.md#core-quality-metrics"
  </context_fetcher_strategy>
</conditional-block>

### Essential Metrics

**Test Coverage Metrics:**
- Line coverage percentage
- Branch coverage percentage  
- Function coverage percentage
- Statement coverage percentage
- Uncovered lines count
- Test execution time

**Type Coverage Metrics:**
- TypeScript coverage percentage
- Any type usage count
- Type error count
- Strict mode compliance

**Code Quality Metrics:**
- BiomeJS violations count
- Cyclomatic complexity scores
- Code duplication percentage
- Technical debt ratio
- Security vulnerability count

**Performance Metrics:**
- Bundle size (initial load)
- Bundle size (total)
- Build time
- Test execution time
- Core Web Vitals scores

## Metrics Collection Commands

<conditional-block task-condition="metrics-commands|monitoring-commands" context-check="metrics-commands">
IF task involves metrics collection:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get metrics commands from development/metrics.md#metrics-collection-commands"
  </context_fetcher_strategy>
</conditional-block>

### Standard Commands

```json
// package.json scripts for metrics
{
  "scripts": {
    "metrics:coverage": "vitest run --coverage --reporter=json > coverage-report.json",
    "metrics:types": "npx type-coverage --detail --ignore-files='**/*.d.ts'",
    "metrics:build": "pnpm build --analyze > build-report.json",
    "metrics:perf": "vitest run --reporter=json > test-perf.json",
    "metrics:quality": "biome ci --reporter=json > quality-report.json",
    "metrics:bundle": "npx bundle-analyzer build/static/js/*.js",
    "metrics:all": "pnpm metrics:coverage && pnpm metrics:types && pnpm metrics:build && pnpm metrics:quality",
    "metrics:dashboard": "node scripts/generate-metrics-dashboard.js"
  }
}
```

### Advanced Metrics Collection

```typescript
// scripts/collect-metrics.ts
import { execSync } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';
import path from 'path';

interface MetricsReport {
  timestamp: string;
  coverage: CoverageMetrics;
  types: TypeMetrics;
  quality: QualityMetrics;
  performance: PerformanceMetrics;
  bundle: BundleMetrics;
}

interface CoverageMetrics {
  lines: number;
  branches: number;
  functions: number;
  statements: number;
  uncoveredLines: number;
}

interface TypeMetrics {
  totalTypes: number;
  coveredTypes: number;
  percentage: number;
  anyTypes: number;
}

interface QualityMetrics {
  errors: number;
  warnings: number;
  complexity: number;
  duplication: number;
  techDebt: number;
}

interface PerformanceMetrics {
  buildTime: number;
  testTime: number;
  bundleSize: number;
  initialLoad: number;
}

interface BundleMetrics {
  totalSize: number;
  gzipSize: number;
  chunks: number;
  largestChunk: number;
}

export class MetricsCollector {
  async collectAll(): Promise<MetricsReport> {
    console.log('📊 Collecting development metrics...');
    
    const coverage = await this.collectCoverage();
    const types = await this.collectTypeMetrics();
    const quality = await this.collectQualityMetrics();
    const performance = await this.collectPerformanceMetrics();
    const bundle = await this.collectBundleMetrics();
    
    const report: MetricsReport = {
      timestamp: new Date().toISOString(),
      coverage,
      types,
      quality,
      performance,
      bundle
    };
    
    await this.generateReport(report);
    return report;
  }
  
  private async collectCoverage(): Promise<CoverageMetrics> {
    console.log('🧪 Collecting test coverage metrics...');
    
    try {
      execSync('vitest run --coverage --reporter=json > temp-coverage.json', { stdio: 'inherit' });
      const coverageData = JSON.parse(readFileSync('temp-coverage.json', 'utf8'));
      
      return {
        lines: coverageData.total.lines.pct,
        branches: coverageData.total.branches.pct,
        functions: coverageData.total.functions.pct,
        statements: coverageData.total.statements.pct,
        uncoveredLines: coverageData.total.lines.total - coverageData.total.lines.covered
      };
    } catch (error) {
      console.warn('⚠️  Coverage collection failed:', error);
      return { lines: 0, branches: 0, functions: 0, statements: 0, uncoveredLines: 0 };
    }
  }
  
  private async collectTypeMetrics(): Promise<TypeMetrics> {
    console.log('🔧 Collecting TypeScript metrics...');
    
    try {
      const output = execSync('npx type-coverage --detail --json', { encoding: 'utf8' });
      const typeData = JSON.parse(output);
      
      return {
        totalTypes: typeData.total,
        coveredTypes: typeData.correct,
        percentage: parseFloat(typeData.percentage),
        anyTypes: typeData.any
      };
    } catch (error) {
      console.warn('⚠️  Type metrics collection failed:', error);
      return { totalTypes: 0, coveredTypes: 0, percentage: 0, anyTypes: 0 };
    }
  }
  
  private async collectQualityMetrics(): Promise<QualityMetrics> {
    console.log('✨ Collecting code quality metrics...');
    
    try {
      const output = execSync('biome ci --reporter=json', { encoding: 'utf8' });
      const qualityData = JSON.parse(output);
      
      return {
        errors: qualityData.summary.errors,
        warnings: qualityData.summary.warnings,
        complexity: this.calculateComplexity(),
        duplication: this.calculateDuplication(),
        techDebt: this.calculateTechDebt()
      };
    } catch (error) {
      console.warn('⚠️  Quality metrics collection failed:', error);
      return { errors: 0, warnings: 0, complexity: 0, duplication: 0, techDebt: 0 };
    }
  }
  
  private async collectPerformanceMetrics(): Promise<PerformanceMetrics> {
    console.log('⚡ Collecting performance metrics...');
    
    const buildStart = Date.now();
    try {
      execSync('pnpm build', { stdio: 'inherit' });
      const buildTime = Date.now() - buildStart;
      
      const testStart = Date.now();
      execSync('vitest run', { stdio: 'inherit' });
      const testTime = Date.now() - testStart;
      
      const bundleSize = this.getBundleSize();
      const initialLoad = this.getInitialLoadSize();
      
      return {
        buildTime,
        testTime,
        bundleSize,
        initialLoad
      };
    } catch (error) {
      console.warn('⚠️  Performance metrics collection failed:', error);
      return { buildTime: 0, testTime: 0, bundleSize: 0, initialLoad: 0 };
    }
  }
  
  private async collectBundleMetrics(): Promise<BundleMetrics> {
    console.log('📦 Collecting bundle metrics...');
    
    try {
      const bundleStats = this.analyzeBundleSize();
      
      return {
        totalSize: bundleStats.totalSize,
        gzipSize: bundleStats.gzipSize,
        chunks: bundleStats.chunks,
        largestChunk: bundleStats.largestChunk
      };
    } catch (error) {
      console.warn('⚠️  Bundle metrics collection failed:', error);
      return { totalSize: 0, gzipSize: 0, chunks: 0, largestChunk: 0 };
    }
  }
  
  private calculateComplexity(): number {
    // Calculate cyclomatic complexity across codebase
    try {
      const output = execSync('npx madge --circular --json src/', { encoding: 'utf8' });
      const complexity = JSON.parse(output);
      return complexity.circular?.length || 0;
    } catch {
      return 0;
    }
  }
  
  private calculateDuplication(): number {
    // Calculate code duplication percentage
    try {
      const output = execSync('npx jscpd --reporters json --output temp-duplication.json src/', { encoding: 'utf8' });
      const duplication = JSON.parse(readFileSync('temp-duplication.json', 'utf8'));
      return duplication.statistics.total.percentage;
    } catch {
      return 0;
    }
  }
  
  private calculateTechDebt(): number {
    // Calculate technical debt ratio (simplified)
    try {
      const output = execSync('find src/ -name "*.ts" -o -name "*.tsx" | xargs grep -c "TODO\\|FIXME\\|HACK" || true', { encoding: 'utf8' });
      return parseInt(output.trim()) || 0;
    } catch {
      return 0;
    }
  }
  
  private getBundleSize(): number {
    // Get total bundle size in bytes
    try {
      const output = execSync('du -sb dist/ | cut -f1', { encoding: 'utf8' });
      return parseInt(output.trim());
    } catch {
      return 0;
    }
  }
  
  private getInitialLoadSize(): number {
    // Get initial load bundle size
    try {
      const output = execSync('find dist/ -name "*.js" -exec wc -c {} + | tail -1 | awk \'{print $1}\'', { encoding: 'utf8' });
      return parseInt(output.trim());
    } catch {
      return 0;
    }
  }
  
  private analyzeBundleSize(): any {
    // Analyze bundle composition
    try {
      const output = execSync('npx webpack-bundle-analyzer dist/static/js/*.js --analyzer-mode json', { encoding: 'utf8' });
      return JSON.parse(output);
    } catch {
      return { totalSize: 0, gzipSize: 0, chunks: 0, largestChunk: 0 };
    }
  }
  
  private async generateReport(report: MetricsReport): Promise<void> {
    const reportPath = path.join(process.cwd(), 'metrics-report.json');
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('📋 Metrics report generated:', reportPath);
    
    // Generate human-readable summary
    this.generateSummary(report);
  }
  
  private generateSummary(report: MetricsReport): void {
    console.log('\n📊 DEVELOPMENT METRICS SUMMARY');
    console.log('='.repeat(50));
    console.log(`📅 Timestamp: ${report.timestamp}`);
    console.log('\n🧪 Test Coverage:');
    console.log(`  Lines: ${report.coverage.lines}%`);
    console.log(`  Branches: ${report.coverage.branches}%`);
    console.log(`  Functions: ${report.coverage.functions}%`);
    console.log('\n🔧 TypeScript:');
    console.log(`  Type Coverage: ${report.types.percentage}%`);
    console.log(`  Any Types: ${report.types.anyTypes}`);
    console.log('\n✨ Code Quality:');
    console.log(`  Errors: ${report.quality.errors}`);
    console.log(`  Warnings: ${report.quality.warnings}`);
    console.log(`  Tech Debt Items: ${report.quality.techDebt}`);
    console.log('\n⚡ Performance:');
    console.log(`  Build Time: ${(report.performance.buildTime / 1000).toFixed(2)}s`);
    console.log(`  Test Time: ${(report.performance.testTime / 1000).toFixed(2)}s`);
    console.log(`  Bundle Size: ${(report.bundle.totalSize / 1024 / 1024).toFixed(2)}MB`);
  }
}
```

## Project Quality Thresholds

<conditional-block task-condition="thresholds|quality-gates" context-check="quality-thresholds">
IF task involves quality thresholds:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get quality thresholds from development/metrics.md#project-quality-thresholds"
  </context_fetcher_strategy>
</conditional-block>

### Standard Project Thresholds

```json
// package.json - Quality gate thresholds
{
  "metrics": {
    "thresholds": {
      "coverage": {
        "lines": 80,
        "branches": 75,
        "functions": 80,
        "statements": 80
      },
      "typesCoverage": {
        "minimum": 90,
        "anyTypesMax": 20
      },
      "quality": {
        "errorsMax": 0,
        "warningsMax": 10,
        "complexityMax": 50,
        "techDebtMax": 25
      },
      "performance": {
        "buildTimeMax": 60000,
        "testTimeMax": 30000,
        "bundleSizeMax": 5242880,
        "initialLoadMax": 1048576
      }
    }
  }
}
```

### Greenfield Project Thresholds

```json
// Enhanced thresholds for new projects
{
  "metrics": {
    "greenfield": {
      "thresholds": {
        "coverage": {
          "lines": 95,
          "branches": 90,
          "functions": 95,
          "statements": 95,
          "domain": 100,
          "usecases": 100
        },
        "typesCoverage": {
          "minimum": 98,
          "anyTypesMax": 5
        },
        "quality": {
          "errorsMax": 0,
          "warningsMax": 0,
          "complexityMax": 25,
          "techDebtMax": 0
        },
        "performance": {
          "buildTimeMax": 30000,
          "testTimeMax": 15000,
          "bundleSizeMax": 2097152,
          "initialLoadMax": 524288
        }
      }
    }
  }
}
```

## Metrics Dashboard Generation

<conditional-block task-condition="dashboard|reporting" context-check="metrics-dashboard">
IF task involves metrics dashboard:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get dashboard generation from development/metrics.md#metrics-dashboard-generation"
  </context_fetcher_strategy>
</conditional-block>

### HTML Dashboard Generator

```typescript
// scripts/generate-dashboard.ts
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

export class MetricsDashboard {
  generateHTML(report: MetricsReport): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Development Metrics Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .metric-card { background: white; padding: 20px; margin: 10px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric-value { font-size: 2em; font-weight: bold; color: #2563eb; }
        .metric-label { color: #6b7280; font-size: 0.9em; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
        .chart-container { width: 100%; height: 400px; }
        .status-good { color: #059669; }
        .status-warning { color: #d97706; }
        .status-error { color: #dc2626; }
        .timestamp { text-align: center; color: #6b7280; margin-bottom: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 Development Metrics Dashboard</h1>
        <div class="timestamp">Last Updated: ${report.timestamp}</div>
        
        <div class="grid">
            <div class="metric-card">
                <div class="metric-label">Test Coverage</div>
                <div class="metric-value ${this.getCoverageStatus(report.coverage.lines)}">
                    ${report.coverage.lines}%
                </div>
                <div>Lines: ${report.coverage.lines}% | Branches: ${report.coverage.branches}%</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-label">Type Coverage</div>
                <div class="metric-value ${this.getTypeStatus(report.types.percentage)}">
                    ${report.types.percentage}%
                </div>
                <div>Any types: ${report.types.anyTypes}</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-label">Code Quality</div>
                <div class="metric-value ${this.getQualityStatus(report.quality.errors, report.quality.warnings)}">
                    ${report.quality.errors}E / ${report.quality.warnings}W
                </div>
                <div>Tech debt items: ${report.quality.techDebt}</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-label">Build Performance</div>
                <div class="metric-value">
                    ${(report.performance.buildTime / 1000).toFixed(1)}s
                </div>
                <div>Test time: ${(report.performance.testTime / 1000).toFixed(1)}s</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-label">Bundle Size</div>
                <div class="metric-value ${this.getBundleStatus(report.bundle.totalSize)}">
                    ${(report.bundle.totalSize / 1024 / 1024).toFixed(2)}MB
                </div>
                <div>Gzip: ${(report.bundle.gzipSize / 1024 / 1024).toFixed(2)}MB</div>
            </div>
        </div>
        
        <div class="metric-card">
            <h3>Coverage Trend</h3>
            <div class="chart-container">
                <canvas id="coverageChart"></canvas>
            </div>
        </div>
        
        <div class="metric-card">
            <h3>Bundle Size Trend</h3>
            <div class="chart-container">
                <canvas id="bundleChart"></canvas>
            </div>
        </div>
    </div>
    
    <script>
        // Coverage chart
        const coverageCtx = document.getElementById('coverageChart').getContext('2d');
        new Chart(coverageCtx, {
            type: 'line',
            data: {
                labels: ['Lines', 'Branches', 'Functions', 'Statements'],
                datasets: [{
                    label: 'Coverage %',
                    data: [${report.coverage.lines}, ${report.coverage.branches}, ${report.coverage.functions}, ${report.coverage.statements}],
                    borderColor: '#2563eb',
                    backgroundColor: '#2563eb20',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { min: 0, max: 100 }
                }
            }
        });
        
        // Bundle chart
        const bundleCtx = document.getElementById('bundleChart').getContext('2d');
        new Chart(bundleCtx, {
            type: 'doughnut',
            data: {
                labels: ['Initial Load', 'Lazy Loaded'],
                datasets: [{
                    data: [${report.performance.initialLoad}, ${report.bundle.totalSize - report.performance.initialLoad}],
                    backgroundColor: ['#2563eb', '#e5e7eb']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    </script>
</body>
</html>`;
  }
  
  private getCoverageStatus(coverage: number): string {
    if (coverage >= 90) return 'status-good';
    if (coverage >= 70) return 'status-warning';
    return 'status-error';
  }
  
  private getTypeStatus(coverage: number): string {
    if (coverage >= 95) return 'status-good';
    if (coverage >= 85) return 'status-warning';
    return 'status-error';
  }
  
  private getQualityStatus(errors: number, warnings: number): string {
    if (errors === 0 && warnings <= 5) return 'status-good';
    if (errors === 0 && warnings <= 20) return 'status-warning';
    return 'status-error';
  }
  
  private getBundleStatus(size: number): string {
    const sizeInMB = size / 1024 / 1024;
    if (sizeInMB <= 2) return 'status-good';
    if (sizeInMB <= 5) return 'status-warning';
    return 'status-error';
  }
}
```

## CI/CD Integration

<conditional-block task-condition="ci-cd|automation" context-check="metrics-cicd">
IF task involves CI/CD metrics:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get CI/CD integration from development/metrics.md#ci-cd-integration"
  </context_fetcher_strategy>
</conditional-block>

### GitHub Actions Workflow

```yaml
# .github/workflows/metrics.yml
name: Quality Metrics

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  metrics:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: '10.16.0'
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Collect all metrics
        run: pnpm metrics:all
        
      - name: Generate metrics dashboard
        run: pnpm metrics:dashboard
        
      - name: Upload metrics report
        uses: actions/upload-artifact@v4
        with:
          name: metrics-report
          path: |
            metrics-report.json
            metrics-dashboard.html
            coverage-report.json
            
      - name: Comment metrics on PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const report = JSON.parse(fs.readFileSync('metrics-report.json', 'utf8'));
            
            const comment = \`
            ## 📊 Quality Metrics Report
            
            | Metric | Value | Status |
            |--------|-------|--------|
            | Test Coverage | ${report.coverage.lines}% | ${report.coverage.lines >= 80 ? '✅' : '❌'} |
            | Type Coverage | ${report.types.percentage}% | ${report.types.percentage >= 90 ? '✅' : '❌'} |
            | Code Quality | ${report.quality.errors}E / ${report.quality.warnings}W | ${report.quality.errors === 0 ? '✅' : '❌'} |
            | Bundle Size | ${(report.bundle.totalSize / 1024 / 1024).toFixed(2)}MB | ${report.bundle.totalSize <= 5242880 ? '✅' : '❌'} |
            | Build Time | ${(report.performance.buildTime / 1000).toFixed(2)}s | ${report.performance.buildTime <= 60000 ? '✅' : '❌'} |
            
            [View detailed dashboard](../artifacts)
            \`;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
```

### Quality Gates

```bash
#!/bin/bash
# scripts/quality-gates.sh
set -e

echo "🚪 Running quality gates..."

# Load thresholds from package.json
COVERAGE_THRESHOLD=$(node -p "require('./package.json').metrics.thresholds.coverage.lines")
TYPE_THRESHOLD=$(node -p "require('./package.json').metrics.thresholds.typesCoverage.minimum")

# Collect metrics
pnpm metrics:all

# Parse results
COVERAGE=$(node -p "require('./metrics-report.json').coverage.lines")
TYPE_COVERAGE=$(node -p "require('./metrics-report.json').types.percentage")
ERRORS=$(node -p "require('./metrics-report.json').quality.errors")
BUNDLE_SIZE=$(node -p "require('./metrics-report.json').bundle.totalSize")

echo "📊 Current Metrics:"
echo "  Coverage: ${COVERAGE}% (threshold: ${COVERAGE_THRESHOLD}%)"
echo "  Types: ${TYPE_COVERAGE}% (threshold: ${TYPE_THRESHOLD}%)"
echo "  Errors: ${ERRORS}"
echo "  Bundle: ${BUNDLE_SIZE} bytes"

# Check gates
FAILED=0

if (( $(echo "$COVERAGE < $COVERAGE_THRESHOLD" | bc -l) )); then
  echo "❌ Coverage below threshold: ${COVERAGE}% < ${COVERAGE_THRESHOLD}%"
  FAILED=1
fi

if (( $(echo "$TYPE_COVERAGE < $TYPE_THRESHOLD" | bc -l) )); then
  echo "❌ Type coverage below threshold: ${TYPE_COVERAGE}% < ${TYPE_THRESHOLD}%"
  FAILED=1
fi

if [ "$ERRORS" -gt 0 ]; then
  echo "❌ Code quality errors found: ${ERRORS}"
  FAILED=1
fi

if [ "$BUNDLE_SIZE" -gt 5242880 ]; then
  echo "❌ Bundle size too large: ${BUNDLE_SIZE} > 5MB"
  FAILED=1
fi

if [ "$FAILED" -eq 1 ]; then
  echo "❌ Quality gates failed"
  exit 1
fi

echo "✅ All quality gates passed!"
```

## Usage Examples

### Daily Metrics Collection

```bash
# Run full metrics collection
pnpm metrics:all

# Generate dashboard
pnpm metrics:dashboard

# Open dashboard in browser
open metrics-dashboard.html
```

### Continuous Monitoring

```bash
# Add to cron job for daily metrics
0 9 * * * cd /path/to/project && pnpm metrics:all && pnpm metrics:dashboard

# Or use npm script for pre-commit
pnpm pre-commit:metrics
```

### Integration with Development Workflow

```bash
# Before creating PR
pnpm metrics:all
pnpm quality:check

# During development
pnpm metrics:coverage --watch
```

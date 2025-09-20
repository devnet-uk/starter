# CI/CD Pipeline

## GitHub Actions Workflow

> Align tool versions with `docs/standards/tech-stack.md` (Node.js 22 LTS, pnpm 10.16.0, Biome latest stable). Update this workflow when the tech stack file changes.

### Main Pipeline
```yaml
# .github/workflows/main.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ vars.TURBO_TEAM }}

jobs:
  lint:
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
      
      - name: Run linting with BiomeJS (latest stable, see tech-stack.md)
        run: pnpm lint
      
      - name: Check formatting with BiomeJS
        run: pnpm format:check
        
      - name: Run BiomeJS check
        run: pnpm biome check --reporter=github

  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: '10.16.0'
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Run type checking
        run: pnpm type-check

  test:
    runs-on: ubuntu-latest
    # This job executes the testing strategy defined in ../development/testing-strategy.md
    services:
      postgres:
        image: postgres:17.6
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: '10.16.0'
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Run unit tests
        run: pnpm test:unit --coverage
      
      - name: Run integration tests
        run: pnpm test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  accessibility:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: '10.16.0'
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Build application
        run: pnpm build
      
      - name: Start server
        run: |
          pnpm start &
          sleep 10
        env:
          PORT: 3000
      
      - name: Run Pa11y accessibility tests
        run: |
          pnpm exec pa11y-ci --config .pa11yci.json
      
      - name: Run Axe accessibility tests
        run: |
          pnpm test:accessibility
      
      - name: Run WAVE API tests
        if: github.event_name == 'pull_request'
        run: |
          pnpm test:wave
        env:
          WAVE_API_KEY: ${{ secrets.WAVE_API_KEY }}
      
      - name: Upload accessibility reports
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: accessibility-reports
          path: |
            reports/pa11y/
            reports/axe/
            reports/wave/

  e2e:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: '10.16.0'
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Install Playwright
        run: pnpm exec playwright install --with-deps
      
      - name: Run E2E tests with accessibility checks
        run: pnpm test:e2e:accessibility
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/

  build:
    runs-on: ubuntu-latest
    needs: [lint, type-check, test, accessibility]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: '10.16.0'
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Build packages
        run: pnpm build
      
      - name: Check bundle size
        run: pnpm size-limit

  deploy:
    runs-on: ubuntu-latest
    needs: [build]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel
        run: |
          npm i -g vercel
          vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }}
```

### Security Scanning
```yaml
# .github/workflows/security.yml
name: Security Scan

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  pull_request:
    paths:
      - 'package.json'
      - 'pnpm-lock.yaml'

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      
      - name: Run npm audit
        run: pnpm audit --audit-level=moderate
      
      - name: Run CodeQL
        uses: github/codeql-action/analyze@v2

  license-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Check licenses
        run: |
          npx license-checker --production --onlyAllow "MIT;Apache-2.0;BSD-3-Clause;BSD-2-Clause;ISC"

  secret-scanning:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Accessibility Testing Workflow
```yaml
# .github/workflows/accessibility.yml
name: Accessibility Testing

on:
  pull_request:
    types: [opened, synchronize, reopened]
  push:
    branches: [main]

jobs:
  accessibility-audit:
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
      
      - name: Build application
        run: pnpm build
      
      - name: Start application
        run: |
          pnpm start &
          npx wait-on http://localhost:3000
        env:
          PORT: 3000
      
      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun --config=.lighthouserc.js
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
      
      - name: Run Pa11y tests
        run: |
          pnpm exec pa11y-ci --config .pa11yci.json --threshold 0
      
      - name: Run Axe tests
        run: |
          pnpm test:axe
      
      - name: Generate accessibility report
        if: always()
        run: |
          node scripts/generate-a11y-report.js
      
      - name: Comment PR with results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('reports/accessibility-summary.md', 'utf8');
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: report
            });
      
      - name: Upload reports
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: accessibility-audit
          path: reports/
```

## Accessibility Testing Configuration

### Pa11y Configuration
```json
// .pa11yci.json
{
  "defaults": {
    "timeout": 30000,
    "viewport": {
      "width": 1280,
      "height": 1024
    },
    "runners": ["axe", "htmlcs"],
    "standard": "WCAG2AA",
    "chromeLaunchConfig": {
      "args": ["--no-sandbox", "--disable-dev-shm-usage"]
    }
  },
  "urls": [
    {
      "url": "http://localhost:3000",
      "screenCapture": "reports/pa11y/home.png"
    },
    {
      "url": "http://localhost:3000/login",
      "screenCapture": "reports/pa11y/login.png",
      "actions": [
        "wait for element #email to be visible",
        "set field #email to test@example.com",
        "set field #password to password123",
        "click element button[type=submit]",
        "wait for path to not be /login"
      ]
    },
    {
      "url": "http://localhost:3000/dashboard",
      "screenCapture": "reports/pa11y/dashboard.png",
      "threshold": 2,
      "ignore": ["WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.Fail"]
    }
  ]
}
```

### Axe Testing Configuration
```javascript
// test/accessibility/axe.config.js
module.exports = {
  rules: {
    'color-contrast': { enabled: true },
    'valid-lang': { enabled: true },
    'meta-viewport': { enabled: true },
    'duplicate-id': { enabled: true },
    'aria-roles': { enabled: true },
    'aria-hidden-focus': { enabled: true },
    'button-name': { enabled: true },
    'document-title': { enabled: true },
    'html-has-lang': { enabled: true },
    'image-alt': { enabled: true },
    'label': { enabled: true },
    'link-name': { enabled: true },
    'list': { enabled: true },
    'listitem': { enabled: true },
    'meta-refresh': { enabled: true },
    'region': { enabled: true }
  },
  reporter: 'v2',
  checks: [
    {
      id: 'color-contrast-enhanced',
      options: {
        contrastRatio: {
          normal: {
            expected: 7
          },
          large: {
            expected: 4.5
          }
        }
      }
    }
  ],
  locale: 'en'
};
```

### Lighthouse Configuration
```javascript
// .lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000',
        'http://localhost:3000/login',
        'http://localhost:3000/dashboard'
      ],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        throttling: {
          cpuSlowdownMultiplier: 1
        },
        screenEmulation: {
          disabled: true
        }
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        
        // Accessibility specific assertions
        'aria-allowed-attr': ['error', { maxLength: 0 }],
        'aria-hidden-body': ['error', { maxLength: 0 }],
        'aria-hidden-focus': ['error', { maxLength: 0 }],
        'aria-input-field-name': ['error', { maxLength: 0 }],
        'aria-meter-name': ['error', { maxLength: 0 }],
        'aria-progressbar-name': ['error', { maxLength: 0 }],
        'aria-required-attr': ['error', { maxLength: 0 }],
        'aria-required-children': ['error', { maxLength: 0 }],
        'aria-required-parent': ['error', { maxLength: 0 }],
        'aria-roles': ['error', { maxLength: 0 }],
        'aria-toggle-field-name': ['error', { maxLength: 0 }],
        'aria-tooltip-name': ['error', { maxLength: 0 }],
        'aria-treeitem-name': ['error', { maxLength: 0 }],
        'aria-valid-attr-value': ['error', { maxLength: 0 }],
        'aria-valid-attr': ['error', { maxLength: 0 }],
        'button-name': ['error', { maxLength: 0 }],
        'bypass': ['error', { maxLength: 0 }],
        'color-contrast': ['error', { maxLength: 0 }],
        'definition-list': ['error', { maxLength: 0 }],
        'dlitem': ['error', { maxLength: 0 }],
        'document-title': ['error', { maxLength: 0 }],
        'duplicate-id-active': ['error', { maxLength: 0 }],
        'duplicate-id-aria': ['error', { maxLength: 0 }],
        'form-field-multiple-labels': ['error', { maxLength: 0 }],
        'frame-title': ['error', { maxLength: 0 }],
        'heading-order': ['error', { maxLength: 0 }],
        'html-has-lang': ['error', { maxLength: 0 }],
        'html-lang-valid': ['error', { maxLength: 0 }],
        'image-alt': ['error', { maxLength: 0 }],
        'input-button-name': ['error', { maxLength: 0 }],
        'input-image-alt': ['error', { maxLength: 0 }],
        'label': ['error', { maxLength: 0 }],
        'link-name': ['error', { maxLength: 0 }],
        'list': ['error', { maxLength: 0 }],
        'listitem': ['error', { maxLength: 0 }],
        'meta-refresh': ['error', { maxLength: 0 }],
        'meta-viewport': ['error', { maxLength: 0 }],
        'object-alt': ['error', { maxLength: 0 }],
        'select-name': ['error', { maxLength: 0 }],
        'skip-link': ['error', { maxLength: 0 }],
        'tabindex': ['error', { maxLength: 0 }],
        'table-duplicate-name': ['error', { maxLength: 0 }],
        'td-headers-attr': ['error', { maxLength: 0 }],
        'th-has-data-cells': ['error', { maxLength: 0 }],
        'valid-lang': ['error', { maxLength: 0 }],
        'video-caption': ['error', { maxLength: 0 }]
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
};
```

### Playwright Accessibility Tests
```typescript
// tests/e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await injectAxe(page);
  });
  
  test('should have no accessibility violations on homepage', async ({ page }) => {
    await checkA11y(page, undefined, {
      detailedReport: true,
      detailedReportOptions: {
        html: true
      }
    });
  });
  
  test('should have proper focus management', async ({ page }) => {
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT']).toContain(firstFocused);
    
    // Test skip links
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeHidden();
    
    await page.keyboard.press('Tab');
    await expect(skipLink).toBeVisible();
  });
  
  test('should have proper ARIA labels', async ({ page }) => {
    const nav = page.locator('nav');
    await expect(nav).toHaveAttribute('aria-label', /main navigation/i);
    
    const searchButton = page.locator('button[aria-label]').first();
    await expect(searchButton).toHaveAttribute('aria-label', /.+/);
  });
  
  test('should support screen reader announcements', async ({ page }) => {
    const liveRegion = page.locator('[aria-live]');
    await expect(liveRegion).toHaveAttribute('aria-live', /polite|assertive/);
    
    // Trigger an action that should announce
    await page.click('button[type="submit"]');
    await expect(liveRegion).not.toBeEmpty();
  });
  
  test('should have sufficient color contrast', async ({ page }) => {
    await checkA11y(page, undefined, {
      rules: {
        'color-contrast': { enabled: true }
      }
    });
  });
  
  test('should work with keyboard only', async ({ page }) => {
    // Navigate through interactive elements
    const interactiveElements = await page.$eval(
      'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
      elements => elements.length
    );
    
    expect(interactiveElements).toBeGreaterThan(0);
    
    // Test form submission with keyboard
    await page.keyboard.press('Tab');
    await page.keyboard.type('test@example.com');
    await page.keyboard.press('Tab');
    await page.keyboard.type('password');
    await page.keyboard.press('Enter');
    
    // Verify navigation occurred
    await expect(page).toHaveURL(/dashboard|login/);
  });
});
```

### Test Scripts
```typescript
// scripts/test-accessibility.ts
import { chromium } from 'playwright';
import { AxePuppeteer } from '@axe-core/puppeteer';
import * as pa11y from 'pa11y';
import * as fs from 'fs';
import * as path from 'path';

interface AccessibilityResults {
  axe: any;
  pa11y: any;
  wave?: any;
}

async function runAccessibilityTests(url: string): Promise<AccessibilityResults> {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url);
  
  // Run Axe tests
  const axeResults = await new AxePuppeteer(page).analyze();
  
  // Run Pa11y tests
  const pa11yResults = await pa11y(url, {
    runners: ['axe', 'htmlcs'],
    standard: 'WCAG2AA'
  });
  
  // Run WAVE tests if API key available
  let waveResults;
  if (process.env.WAVE_API_KEY) {
    const waveResponse = await fetch(
      `https://wave.webaim.org/api/request?key=${process.env.WAVE_API_KEY}&url=${encodeURIComponent(url)}`
    );
    waveResults = await waveResponse.json();
  }
  
  await browser.close();
  
  return {
    axe: axeResults,
    pa11y: pa11yResults,
    wave: waveResults
  };
}

async function generateReport(results: AccessibilityResults) {
  const reportDir = path.join(process.cwd(), 'reports', 'accessibility');
  
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  // Generate HTML report
  const htmlReport = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <title>Accessibility Report</title>
      <style>
        body { font-family: system-ui; max-width: 1200px; margin: 0 auto; padding: 20px; }
        .pass { color: green; }
        .fail { color: red; }
        .warning { color: orange; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px; text-align: left; border: 1px solid #ddd; }
      </style>
    </head>
    <body>
      <h1>Accessibility Test Report</h1>
      
      <h2>Summary</h2>
      <table>
        <tr>
          <th>Tool</th>
          <th>Violations</th>
          <th>Warnings</th>
          <th>Passes</th>
        </tr>
        <tr>
          <td>Axe</td>
          <td class="fail">${results.axe.violations.length}</td>
          <td class="warning">${results.axe.incomplete.length}</td>
          <td class="pass">${results.axe.passes.length}</td>
        </tr>
        <tr>
          <td>Pa11y</td>
          <td class="fail">${results.pa11y.issues.filter((i: any) => i.type === 'error').length}</td>
          <td class="warning">${results.pa11y.issues.filter((i: any) => i.type === 'warning').length}</td>
          <td class="pass">N/A</td>
        </tr>
        ${results.wave ? `
        <tr>
          <td>WAVE</td>
          <td class="fail">${results.wave.categories.error.count}</td>
          <td class="warning">${results.wave.categories.alert.count}</td>
          <td class="pass">${results.wave.categories.feature.count}</td>
        </tr>
        ` : ''}
      </table>
      
      <h2>Detailed Violations</h2>
      ${results.axe.violations.map((v: any) => `
        <div>
          <h3>${v.help}</h3>
          <p>Impact: <strong>${v.impact}</strong></p>
          <p>Tags: ${v.tags.join(', ')}</p>
          <ul>
            ${v.nodes.map((n: any) => `
              <li>
                <code>${n.html}</code>
                <br>
                ${n.failureSummary}
              </li>
            `).join('')}
          </ul>
        </div>
      `).join('')}
    </body>
    </html>
  `;
  
  fs.writeFileSync(path.join(reportDir, 'report.html'), htmlReport);
  
  // Generate JSON report
  fs.writeFileSync(
    path.join(reportDir, 'report.json'),
    JSON.stringify(results, null, 2)
  );
  
  // Generate Markdown summary
  const mdSummary = `
# Accessibility Report Summary

## Test Results

| Tool | Violations | Warnings | Status |
|------|------------|----------|---------|
| Axe | ${results.axe.violations.length} | ${results.axe.incomplete.length} | ${results.axe.violations.length === 0 ? '✅ Pass' : '❌ Fail'} |
| Pa11y | ${results.pa11y.issues.filter((i: any) => i.type === 'error').length} | ${results.pa11y.issues.filter((i: any) => i.type === 'warning').length} | ${results.pa11y.issues.filter((i: any) => i.type === 'error').length === 0 ? '✅ Pass' : '❌ Fail'} |
${results.wave ? `| WAVE | ${results.wave.categories.error.count} | ${results.wave.categories.alert.count} | ${results.wave.categories.error.count === 0 ? '✅ Pass' : '❌ Fail'} |` : ''}

${results.axe.violations.length > 0 ? `
## Critical Issues

${results.axe.violations.slice(0, 5).map((v: any) => `
- **${v.help}** (${v.impact})
  - ${v.nodes.length} occurrence(s)
`).join('')}
` : '✅ No critical accessibility violations found!'}
  `;
  
  fs.writeFileSync(path.join(reportDir, 'summary.md'), mdSummary);
  
  return mdSummary;
}

// Run tests
async function main() {
  const urls = [
    'http://localhost:3000',
    'http://localhost:3000/login',
    'http://localhost:3000/dashboard'
  ];
  
  const allResults = [];
  
  for (const url of urls) {
    console.log(`Testing ${url}...`);
    const results = await runAccessibilityTests(url);
    allResults.push({ url, results });
  }
  
  const summary = await generateReport(allResults[0].results);
  console.log(summary);
  
  // Exit with error if violations found
  const hasViolations = allResults.some(
    r => r.results.axe.violations.length > 0
  );
  
  process.exit(hasViolations ? 1 : 0);
}

main().catch(console.error);
```

## Deployment Strategy

### Environment Progression
1. **Development** - Auto-deploy from feature branches
2. **Staging** - Auto-deploy from main
3. **Production** - Manual approval required

### Feature Flags
```typescript
// Using LaunchDarkly or similar
const flags = {
  newFeature: process.env.ENABLE_NEW_FEATURE === 'true',
  betaAccess: process.env.BETA_ACCESS === 'true',
};
```

### Rollback Plan
```bash
# Instant rollback via Vercel
vercel rollback [deployment-url] --token=$VERCEL_TOKEN

# Database rollback
pnpm db:migrate:down
```

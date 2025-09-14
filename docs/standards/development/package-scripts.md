# Package Scripts Standard

## Overview

This standard defines the exact package.json scripts for all Engineering OS projects, with **zero tolerance for fake implementations**.

> **Critical**: Scripts MUST perform real operations. Echo statements, `true` commands, or other fake implementations are **ABSOLUTELY PROHIBITED**.


## Required Scripts by Package Type

### Root Package Scripts

**File: `package.json` (root)**
```json
{
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "lint:fix": "turbo run lint:fix",
    "format": "turbo run format",
    "test": "turbo run test",
    "test:watch": "turbo run test:watch",
    "test:coverage": "turbo run test:coverage",
    "type-check": "turbo run type-check",
    "clean": "turbo run clean",
    "prepare": "husky install",
    "pre-commit": "lint-staged",
    "coverage:check": "vitest run --coverage --reporter=summary"
  }
}
```

### Domain Layer Package Scripts (Strictest)

**File: `packages/core/package.json`**
```json
{
  "scripts": {
    "build": "tsc --project tsconfig.build.json",
    "dev": "tsc --project tsconfig.build.json --watch",
    "lint": "biome check .",
    "lint:fix": "biome check . --apply",
    "format": "biome format . --write",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf dist .tsbuildinfo"
  }
}
```

### Infrastructure Layer Package Scripts

**File: `packages/infrastructure/package.json`**
```json
{
  "scripts": {
    "build": "tsc --project tsconfig.build.json",
    "dev": "tsc --project tsconfig.build.json --watch",
    "lint": "biome check .",
    "lint:fix": "biome check . --apply",
    "format": "biome format . --write",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf dist .tsbuildinfo",
    "db:generate": "drizzle-kit generate:pg",
    "db:migrate": "drizzle-kit push:pg",
    "db:studio": "drizzle-kit studio"
  }
}
```

### UI Package Scripts

**File: `packages/ui/package.json`**
```json
{
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "lint": "biome check .",
    "lint:fix": "biome check . --apply",
    "format": "biome format . --write",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf dist .tsbuildinfo",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}
```

### Next.js App Scripts

**File: `apps/web/package.json`**
```json
{
  "scripts": {
    "build": "next build",
    "dev": "next dev --port 4000",
    "start": "next start --port 4000",
    "lint": "next lint && biome check .",
    "lint:fix": "next lint --fix && biome check . --apply",
    "format": "biome format . --write",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "test:coverage": "vitest run --coverage",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf .next dist .tsbuildinfo"
  }
}
```

### API/Backend App Scripts

**File: `apps/api/package.json`**
```json
{
  "scripts": {
    "build": "tsc",
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js",
    "lint": "biome check .",
    "lint:fix": "biome check . --apply",
    "format": "biome format . --write",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "vitest run --config vitest.e2e.config.ts",
    "test:coverage": "vitest run --coverage",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf dist .tsbuildinfo"
  }
}
```

## ❌ ABSOLUTELY PROHIBITED Scripts

### Fake Implementations

These are **NEVER ACCEPTABLE** and will cause verification failures:

```json
{
  "scripts": {
    "lint": "echo 'BiomeJS linting - Phase 0 Step 3'",     // ❌ FAKE
    "test": "echo 'Tests passed'",                          // ❌ FAKE
    "build": "echo 'Build complete'",                       // ❌ FAKE
    "type-check": "echo 'Types checked'",                   // ❌ FAKE
    "format": "echo 'Formatting complete'",                 // ❌ FAKE
    "coverage": "echo 'Coverage: 100%'",                    // ❌ FAKE
    "clean": "true",                                        // ❌ FAKE
    "check": "exit 0"                                       // ❌ FAKE
  }
}
```

### Placeholder Scripts

These are also **PROHIBITED**:

```json
{
  "scripts": {
    "lint": "# TODO: Implement linting",                    // ❌ PLACEHOLDER
    "test": "# TODO: Add tests",                            // ❌ PLACEHOLDER
    "build": "# TODO: Add build script"                     // ❌ PLACEHOLDER
  }
}
```

## Script Validation Requirements

### Linting Scripts Must Actually Lint

```bash
# ✅ CORRECT - Real BiomeJS execution
"lint": "biome check ."

# ✅ CORRECT - Real ESLint execution (if not using BiomeJS)
"lint": "eslint src --ext .ts,.tsx"

# ❌ WRONG - Fake implementation
"lint": "echo 'Linting complete'"
```

### Test Scripts Must Actually Run Tests

```bash
# ✅ CORRECT - Real test execution
"test": "vitest run"
"test": "jest"
"test": "mocha"

# ❌ WRONG - Fake implementations
"test": "echo 'All tests pass'"
"test": "true"
"test": "exit 0"
```

### Build Scripts Must Actually Build

```bash
# ✅ CORRECT - Real build operations
"build": "tsc"
"build": "vite build"
"build": "next build"
"build": "tsup"

# ❌ WRONG - Fake implementations
"build": "echo 'Build successful'"
"build": "mkdir -p dist && touch dist/index.js"
```

## Coverage Threshold Scripts

### Required Coverage Scripts

All packages with tests MUST include:

```json
{
  "scripts": {
    "coverage:check": "vitest run --coverage --reporter=summary --coverage.thresholds.lines=${PROJECT_COVERAGE}",
    "coverage:report": "vitest run --coverage --reporter=html",
    "coverage:ci": "vitest run --coverage --reporter=lcov"
  }
}
```

### Project-Specific Coverage Variables

Replace `${PROJECT_COVERAGE}` with actual values:
- Greenfield projects: 98%
- Standard projects: 80%
- Legacy projects: 70%

```json
{
  "scripts": {
    "coverage:check": "vitest run --coverage --coverage.thresholds.lines=98"
  }
}
```

## Verification Tests

<!-- Verification block for package scripts compliance -->
<verification-block context-check="verification-package-scripts">
  <verification_definitions>
    <test name="package_json_exists">
      TEST: test -f package.json
      REQUIRED: true
      BLOCKING: true
      ERROR: "package.json missing. Every package must have a package.json file."
      FIX_COMMAND: "Create package.json with required scripts from package-scripts.md template"
      DESCRIPTION: "Verifies that a package.json file exists in the current directory"
    </test>
    <test name="lint_script_exists">
      TEST: grep -q '"lint":' package.json
      REQUIRED: true
      BLOCKING: true
      ERROR: "Lint script missing from package.json. Linting is mandatory."
      FIX_COMMAND: "Add '\"lint\": \"biome check .\"' to scripts section"
      DESCRIPTION: "Ensures a lint script is defined in package.json for code quality"
      DEPENDS_ON: ["package_json_exists"]
    </test>
    <test name="lint_script_not_fake">
      TEST: ! grep -q '"lint":.*echo' package.json
      REQUIRED: true
      BLOCKING: true
      ERROR: "Lint script is fake (uses echo). Scripts must perform real operations."
      FIX_COMMAND: "Replace fake lint script with '\"lint\": \"biome check .\"'"
      DESCRIPTION: "Validates that lint script performs real linting, not fake echo statements"
      DEPENDS_ON: ["lint_script_exists"]
    </test>
    <test name="test_script_exists">
      TEST: grep -q '"test":' package.json
      REQUIRED: true
      BLOCKING: true
      ERROR: "Test script missing from package.json. Testing is mandatory."
      FIX_COMMAND: "Add '\"test\": \"vitest run\"' to scripts section"
      DESCRIPTION: "Ensures a test script is defined in package.json for running tests"
      DEPENDS_ON: ["package_json_exists"]
    </test>
    <test name="test_script_not_fake">
      TEST: ! grep -q '"test":.*echo' package.json && ! grep -q '"test":.*true' package.json
      REQUIRED: true
      BLOCKING: true
      ERROR: "Test script is fake (uses echo or true). Scripts must perform real operations."
      FIX_COMMAND: "Replace fake test script with '\"test\": \"vitest run\"'"
      DESCRIPTION: "Validates that test script actually runs tests, not fake implementations"
      DEPENDS_ON: ["test_script_exists"]
    </test>
    <test name="build_script_exists">
      TEST: grep -q '"build":' package.json
      REQUIRED: true
      BLOCKING: true
      ERROR: "Build script missing from package.json. Build capability is mandatory."
      FIX_COMMAND: "Add appropriate build script ('\"build\": \"tsc\"' or similar)"
      DESCRIPTION: "Ensures a build script is defined in package.json for compilation"
      DEPENDS_ON: ["package_json_exists"]
    </test>
    <test name="build_script_not_fake">
      TEST: ! grep -q '"build":.*echo' package.json && ! grep -q '"build":.*true' package.json
      REQUIRED: true
      BLOCKING: true
      ERROR: "Build script is fake (uses echo or true). Scripts must perform real operations."
      FIX_COMMAND: "Replace fake build script with real build command"
      DESCRIPTION: "Validates that build script performs real compilation, not fake operations"
      DEPENDS_ON: ["build_script_exists"]
    </test>
    <test name="type_check_script_exists">
      TEST: grep -q '"type-check":' package.json
      REQUIRED: true
      BLOCKING: true
      ERROR: "Type-check script missing from package.json. Type checking is mandatory."
      FIX_COMMAND: "Add '\"type-check\": \"tsc --noEmit\"' to scripts section"
      DESCRIPTION: "Ensures a type-check script is defined for TypeScript validation"
      DEPENDS_ON: ["package_json_exists"]
    </test>
    <test name="type_check_script_not_fake">
      TEST: ! grep -q '"type-check":.*echo' package.json && ! grep -q '"type-check":.*true' package.json
      REQUIRED: true
      BLOCKING: true
      ERROR: "Type-check script is fake. Scripts must perform real operations."
      FIX_COMMAND: "Replace fake type-check script with '\"type-check\": \"tsc --noEmit\"'"
      DESCRIPTION: "Validates that type-check script runs real TypeScript validation"
      DEPENDS_ON: ["type_check_script_exists"]
    </test>
    <test name="coverage_script_configured">
      TEST: grep -q '"coverage' package.json || test ! -d src
      REQUIRED: true
      BLOCKING: true
      ERROR: "Coverage script missing for package with source code."
      FIX_COMMAND: "Add coverage scripts from package-scripts.md template"
      DESCRIPTION: "Ensures coverage scripts are configured for packages with source code"
      DEPENDS_ON: ["package_json_exists"]
    </test>
    <test name="scripts_actually_work">
      TEST: npm run lint --silent >/dev/null 2>&1
      REQUIRED: true
      BLOCKING: true
      ERROR: "Lint script fails to execute. Scripts must be functional."
      FIX_COMMAND: "Fix lint script configuration and dependencies"
      DESCRIPTION: "Validates that lint script can actually execute without errors"
      DEPENDS_ON: ["lint_script_exists", "lint_script_not_fake", "test_script_exists", "build_script_exists"]
    </test>
  </verification_definitions>
</verification-block>

## Script Categories by Purpose

### Quality Assurance Scripts (Mandatory)
- `lint`: Code linting
- `lint:fix`: Auto-fix linting issues
- `format`: Code formatting
- `type-check`: TypeScript type checking
- `test`: Unit tests
- `test:coverage`: Test coverage

### Development Scripts (Mandatory)
- `build`: Production build
- `dev`: Development mode
- `clean`: Clean build artifacts

### Optional but Recommended
- `test:watch`: Watch mode testing
- `test:e2e`: End-to-end tests
- `storybook`: Component documentation
- `db:*`: Database operations

## Common Anti-Patterns

### Anti-Pattern: Simulation Scripts

```json
// ❌ WRONG - Simulates success without doing work
{
  "scripts": {
    "lint": "echo 'BiomeJS check: 0 errors, 0 warnings'",
    "test": "echo 'Test Suites: 5 passed, 5 total'"
  }
}
```

### Anti-Pattern: Conditional Fake Scripts

```json
// ❌ WRONG - Even conditional fakes are prohibited
{
  "scripts": {
    "lint": "if [ -f biome.json ]; then biome check .; else echo 'No config'; fi"
  }
}
```

### Anti-Pattern: TODO Comments in Scripts

```json
// ❌ WRONG - Scripts with TODO comments
{
  "scripts": {
    "test": "echo 'TODO: Add actual tests'"
  }
}
```

## Performance Optimization

### Parallel Script Execution

```json
{
  "scripts": {
    "check": "run-p lint test type-check",
    "ci": "run-s build test coverage:check"
  }
}
```

### Environment-Specific Scripts

```json
{
  "scripts": {
    "dev": "NODE_ENV=development next dev",
    "build:prod": "NODE_ENV=production next build",
    "test:ci": "CI=true vitest run --reporter=verbose"
  }
}
```

## Integration with Monorepo Tools

### Turbo Configuration

```json
{
  "scripts": {
    "build": "turbo run build",
    "test": "turbo run test --parallel",
    "lint": "turbo run lint --continue"
  }
}
```

### pnpm Workspace Scripts

```json
{
  "scripts": {
    "build:all": "pnpm -r run build",
    "test:all": "pnpm -r run test",
    "lint:all": "pnpm -r run lint"
  }
}
```

## Troubleshooting Common Issues

### Issue: Script Not Found
**Cause**: Missing script in package.json
**Fix**: Add required script from templates

### Issue: Script Fails
**Cause**: Missing dependencies or incorrect configuration
**Fix**: Install dependencies and check configuration

### Issue: Fake Script Detected
**Cause**: Echo statements or placeholder commands
**Fix**: Replace with real implementation

### Issue: Coverage Threshold Not Met
**Cause**: Coverage script not configured properly
**Fix**: Add proper coverage configuration with project threshold

This standard ensures all package scripts perform real operations and prevents the fake implementations that compromised Phoenix Phase 0 quality gates.
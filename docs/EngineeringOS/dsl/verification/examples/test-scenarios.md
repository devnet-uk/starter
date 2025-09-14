# Verification System Test Scenarios
<!-- Relocated from docs/standards/verification to docs/EngineeringOS/dsl/verification/examples (authoring guidance examples) -->

## Overview

This document contains test scenarios to validate the Engineering OS verification system implementation. These scenarios test the complete flow from standards loading to verification execution.

## Test Environment Setup

For testing purposes, we simulate different project states and verify that the system behaves correctly.

## Scenario 1: Greenfield Project with High Coverage

### Project Setup
```bash
# Mock project structure
mkdir -p test-project/src test-project/.husky test-project/docs/product
cd test-project

# package.json with high coverage requirement
cat > package.json << 'EOF'
{
  "name": "greenfield-app",
  "version": "0.1.0",
  "scripts": {
    "test": "vitest",
    "coverage:check": "vitest run --coverage --threshold=98",
    "type-check": "tsc --noEmit",
    "prepare": "husky init"
  },
  "devDependencies": {
    "husky": "^9.1.7",
    "vitest": "^3.2.4",
    "@commitlint/cli": "^19.6.0",
    "@commitlint/config-conventional": "^19.6.0"
  }
}
EOF

# vitest.config.ts with coverage configuration
cat > vitest.config.ts << 'EOF'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      thresholds: {
        global: {
          statements: 98,
          branches: 98,
          functions: 98,
          lines: 98
        }
      }
    }
  }
})
EOF

# Husky hooks properly configured
mkdir -p .husky
cat > .husky/pre-commit << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"
pnpm biome check --apply . || exit 1
pnpm type-check || exit 1
EOF
chmod +x .husky/pre-commit

cat > .husky/commit-msg << 'EOF'  
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"
npx --no -- commitlint --edit "$1"
EOF
chmod +x .husky/commit-msg

# commitlint configuration
cat > commitlint.config.js << 'EOF'
module.exports = {
  extends: ['@commitlint/config-conventional']
}
EOF

# biome.json configuration
cat > biome.json << 'EOF'
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json"
}
EOF
```

### Expected Variable Detection Results
```bash
PROJECT_COVERAGE: 98  (from vitest.config.ts)
PROJECT_TYPE: greenfield  (version 0.1.0, no node_modules, modern tooling)
PROJECT_NAME: greenfield-app  (from package.json)
PROJECT_PHASES: false  (no phase indicators)
GIT_HOOKS: pre-commit commit-msg  (from .husky directory and commitlint config)
```

### Expected Verification Results
```
🔍 VERIFICATION RESULTS

✅ Passed: 12 tests
❌ Failed: 0 tests  
⏭️ Skipped: 0 tests

=== VERIFICATION SUMMARY ===

✅ husky_installed (from local-quality.md)
   Status: Husky v9+ properly installed with hooks

✅ pre_commit_hook_exists (from local-quality.md)
   Status: Pre-commit hook found at .husky/pre-commit

✅ pre_commit_hook_executable (from local-quality.md)
   Status: Hook is executable

✅ coverage_threshold_configured (from testing-strategy.md)
   Status: Coverage threshold set to 98% in vitest.config.ts

✅ commitlint_config_exists (from local-quality.md)
   Status: commitlint.config.js found with conventional config

✅ conventional_commit_format (from git-workflow.md)
   Status: Latest commit follows conventional format

✅ branch_naming_convention (from git-workflow.md)
   Status: Current branch follows naming convention

All quality gates passed! Project meets Engineering OS standards.
```

## Scenario 2: Legacy Project with Missing Configuration

### Project Setup
```bash
# Mock legacy project structure
mkdir -p legacy-project/src legacy-project/lib
cd legacy-project

# package.json without modern tooling
cat > package.json << 'EOF'
{
  "name": "legacy-app",
  "version": "2.1.5",
  "scripts": {
    "test": "jest",
    "build": "webpack"
  },
  "devDependencies": {
    "jest": "^27.0.0",
    "eslint": "^8.0.0"
  }
}
EOF

# Old-style eslint config (legacy indicator)
cat > .eslintrc.js << 'EOF'
module.exports = {
  env: { node: true }
}
EOF

# No husky, no modern tooling
# No coverage configuration
# Many JavaScript files with var usage
mkdir -p src
for i in {1..60}; do
  cat > src/file$i.js << 'EOF'
var oldStyle = function() {
  var data = {};
  return data;
};
EOF
done
```

### Expected Variable Detection Results
```bash
PROJECT_COVERAGE: 70  (legacy project default)
PROJECT_TYPE: legacy  (>50 JS files with var usage, eslint without biome)
PROJECT_NAME: legacy-app  (from package.json)
PROJECT_PHASES: false  (no phase indicators)
GIT_HOOKS: pre-commit  (basic default)
```

### Expected Verification Results
```
🔍 VERIFICATION RESULTS

✅ Passed: 3 tests
❌ Failed: 7 tests  
⏭️ Skipped: 2 tests (dependency failures)

=== FAILED TESTS ===

❌ husky_installed (from local-quality.md)
   Expected: Husky v9+ properly installed
   Actual: No .husky directory found
   Error: Husky not properly installed. Run 'npx husky init' to set up git hooks.
   Fix: npx husky init

❌ coverage_threshold_configured (from testing-strategy.md)
   Expected: Coverage threshold set to 70%
   Actual: No coverage configuration found in package.json or jest config
   Error: Coverage threshold not configured for 70% requirement.
   Fix: Add coverage threshold to jest configuration

❌ biome_configured (from code-style.md)
   Expected: biome.json configuration file
   Actual: Using legacy ESLint configuration
   Error: BiomeJS not configured. Modern projects should use BiomeJS for formatting and linting.
   Fix: Remove .eslintrc.js and run 'pnpm add -D @biomejs/biome && pnpm biome init'

❌ pre_commit_hook_exists (from local-quality.md)
   Expected: Pre-commit hook at .husky/pre-commit
   Actual: No pre-commit hook found
   Error: Pre-commit hook file missing. Create .husky/pre-commit with quality checks.
   Fix: Create pre-commit hook after installing Husky

❌ commit_msg_hook_exists (from local-quality.md)
   Expected: Commit-msg hook at .husky/commit-msg
   Actual: No commit-msg hook found
   Error: Commit-msg hook missing. Create .husky/commit-msg with commitlint validation.
   Fix: Install @commitlint/cli and create commit-msg hook

❌ commitlint_config_exists (from local-quality.md)
   Expected: commitlint.config.js or similar
   Actual: No commitlint configuration found
   Error: Commitlint configuration missing. Create commitlint.config.js with conventional commit rules.
   Fix: Create commitlint.config.js with conventional config

❌ type_check_configured (from development/local-quality.md)
   Expected: TypeScript type checking in package.json scripts
   Actual: No type-check script found
   Error: TypeScript type checking not configured.
   Fix: Add "type-check": "tsc --noEmit" to package.json scripts

=== SKIPPED TESTS ===

⏭️ pre_commit_hook_executable (from local-quality.md)
   Reason: Depends on pre_commit_hook_exists which failed

⏭️ coverage_check_script (from local-quality.md)  
   Reason: Depends on coverage_threshold_configured which failed

=== SUMMARY ===

Verification completed in 1.8s
Critical issues found: 7
Recommendations: Address critical issues before proceeding with Engineering OS workflows

CRITICAL FIXES NEEDED:
1. Install and configure Husky: npx husky init
2. Add coverage configuration to jest or migrate to Vitest
3. Replace ESLint with BiomeJS for modern tooling
4. Set up commitlint for conventional commits
5. Add TypeScript type checking
```

## Scenario 3: Project with Phased Development

### Project Setup
```bash
# Mock phased project
mkdir -p phased-project/docs/product
cd phased-project

# Git history with phase commits
git init
git config user.name "Test User"
git config user.email "test@example.com"

# Create commits with phase indicators
git commit --allow-empty -m "feat(phase-0): initial project setup"
git commit --allow-empty -m "feat(phase-1): user authentication system"
git commit --allow-empty -m "fix(phase-1): authentication bug fixes"
git commit --allow-empty -m "feat(phase-2): dashboard implementation"

# Roadmap with phases
cat > docs/product/roadmap.md << 'EOF'
# Project Roadmap

## Phase 0: Foundation (Complete)
- Project setup and architecture
- Development environment

## Phase 1: Authentication (In Progress)  
- User registration and login
- Password reset functionality

## Phase 2: Core Features (Planned)
- User dashboard
- Data visualization
EOF

# Package.json with phase-aware coverage
cat > package.json << 'EOF'
{
  "name": "phased-project",
  "version": "1.0.0",
  "scripts": {
    "coverage:check": "vitest run --coverage --threshold=85",
    "test": "vitest"
  }
}
EOF
```

### Expected Variable Detection Results
```bash
PROJECT_COVERAGE: 85  (from package.json)
PROJECT_TYPE: standard  (mature version, standard tooling)
PROJECT_NAME: phased-project  (from package.json)
PROJECT_PHASES: true  (git commits with phase-N pattern, roadmap.md mentions phases)
GIT_HOOKS: pre-commit  (basic default)
```

### Expected Verification Results
```
🔍 VERIFICATION RESULTS

✅ Passed: 8 tests
❌ Failed: 2 tests  
⏭️ Skipped: 1 test

=== PASSED TESTS ===

✅ phase_scopes_in_commits (from git-workflow.md)
   Status: Recent commits include phase scopes (phase-0, phase-1, phase-2)

✅ coverage_threshold_configured (from testing-strategy.md)
   Status: Coverage threshold set to 85% for standard project

✅ git_repository_initialized (from git-workflow.md)
   Status: Git repository properly initialized

✅ conventional_commit_format (from git-workflow.md)
   Status: Recent commits follow conventional format with phase scopes

=== FAILED TESTS ===

❌ husky_installed (from local-quality.md)
   Expected: Husky v9+ properly installed
   Actual: No .husky directory found  
   Error: Husky not properly installed. Run 'npx husky init' to set up git hooks.
   Fix: npx husky init

❌ phase_scopes_configured (from local-quality.md)
   Expected: commitlint configuration with phase scope validation
   Actual: No commitlint configuration found
   Error: Phase scopes not configured for phased project. Add scope-enum rule with phase scopes.
   Fix: Configure commitlint with phase-0, phase-1, phase-2 scope validation

Phased project detected with good commit practices but missing hook configuration.
```

## Scenario 4: Perfect Modern Project

### Project Setup
```bash
# Mock perfectly configured modern project
mkdir -p perfect-project/src perfect-project/.husky
cd perfect-project

# Complete modern configuration
cat > package.json << 'EOF'
{
  "name": "perfect-app",
  "version": "1.0.0", 
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "test": "vitest",
    "test:coverage": "vitest run --coverage",
    "coverage:check": "vitest run --coverage --threshold=90",
    "type-check": "tsc --noEmit",
    "prepare": "husky init",
    "lint": "biome check .",
    "format": "biome format --write ."
  },
  "devDependencies": {
    "husky": "^9.1.7",
    "lint-staged": "^15.2.10", 
    "@commitlint/cli": "^19.6.0",
    "@commitlint/config-conventional": "^19.6.0",
    "vitest": "^3.2.4",
    "@biomejs/biome": "^1.9.4",
    "typescript": "^5.7.0"
  }
}
EOF

# All required configuration files
cat > biome.json << 'EOF'
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "formatter": {
    "enabled": true
  },
  "linter": {
    "enabled": true
  }
}
EOF

cat > vitest.config.ts << 'EOF'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      thresholds: {
        global: {
          statements: 90,
          branches: 90, 
          functions: 90,
          lines: 90
        }
      }
    }
  }
})
EOF

cat > commitlint.config.js << 'EOF'
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', [
      'auth', 'dashboard', 'api', 'ui', 'docs', 'deps', 'config'
    ]]
  }
}
EOF

cat > .lintstagedrc.json << 'EOF'
{
  "*.{ts,tsx,js,jsx}": [
    "biome check --apply",
    "vitest related --run --passWithNoTests"
  ],
  "*.{json,md,yml,yaml}": [
    "biome format --write"
  ]
}
EOF

# Perfect Husky setup
mkdir -p .husky
cat > .husky/pre-commit << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"
pnpm biome check --apply . || exit 1
pnpm type-check || exit 1
pnpm test:pre-commit || exit 1
EOF
chmod +x .husky/pre-commit

cat > .husky/commit-msg << 'EOF'
#!/usr/bin/env sh  
. "$(dirname -- "$0")/_/husky.sh"
npx --no -- commitlint --edit "$1"
EOF
chmod +x .husky/commit-msg

cat > .husky/pre-push << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"  
pnpm test || exit 1
pnpm build || exit 1
EOF
chmod +x .husky/pre-push

# TypeScript configuration
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "strict": true,
    "noEmit": true
  }
}
EOF
```

### Expected Variable Detection Results  
```bash
PROJECT_COVERAGE: 90  (from vitest.config.ts)
PROJECT_TYPE: standard  (mature version 1.0.0, complete tooling)
PROJECT_NAME: perfect-app  (from package.json)
PROJECT_PHASES: false  (no phase indicators)
GIT_HOOKS: pre-commit commit-msg pre-push  (all hooks configured)
```

### Expected Verification Results
```
🔍 VERIFICATION RESULTS

✅ Passed: 15 tests
❌ Failed: 0 tests  
⏭️ Skipped: 0 tests

=== ALL TESTS PASSED ===

✅ husky_installed (from local-quality.md)
   Status: Husky v9+ properly installed

✅ pre_commit_hook_exists (from local-quality.md)  
   Status: Pre-commit hook found and executable

✅ commit_msg_hook_exists (from local-quality.md)
   Status: Commit-msg hook found and executable  

✅ pre_push_hook_exists (from local-quality.md)
   Status: Pre-push hook found and executable

✅ lint_staged_config_exists (from local-quality.md)
   Status: .lintstagedrc.json properly configured

✅ lint_staged_includes_biome (from local-quality.md) 
   Status: BiomeJS integrated with lint-staged

✅ lint_staged_includes_tests (from local-quality.md)
   Status: Test execution integrated with lint-staged

✅ coverage_threshold_configured (from testing-strategy.md)
   Status: Coverage threshold set to 90% in vitest.config.ts

✅ commitlint_config_exists (from local-quality.md)
   Status: commitlint.config.js with conventional config

✅ conventional_extends (from local-quality.md)
   Status: Extends @commitlint/config-conventional

✅ biome_configured (from code-style.md)
   Status: biome.json properly configured  

✅ typescript_configured (from code-style.md)
   Status: TypeScript with strict mode enabled

✅ type_check_script (from local-quality.md)
   Status: type-check script configured in package.json

✅ git_repository_initialized (from git-workflow.md)
   Status: Git repository properly initialized

✅ quality_scripts_configured (from local-quality.md)
   Status: All quality check scripts present

=== SUMMARY ===

Verification completed in 0.9s
Perfect configuration! All Engineering OS standards met.
This project is ready for high-quality development workflows.
```

## Integration Test: Complete Workflow

### Test the Full create-spec → execute-tasks → verify Flow

```bash
# 1. Mock user runs /create-spec "User dashboard with charts"
# System creates spec directory and files

# 2. Mock user runs /execute-tasks  
# System loads standards, implements feature

# 3. Verification runs automatically in step 6 of execute-tasks
# System checks implementation against all loaded standards

# Expected verification flow:
1. Extract verification blocks from loaded standards:
   - development/local-quality.md (12 tests)
   - development/testing-strategy.md (8 tests)  
   - security/api-security.md (6 tests)
   - code-style/react-patterns.md (4 tests)

2. Variable substitution:
   - ${PROJECT_COVERAGE} → 85
   - ${PROJECT_TYPE} → standard
   - ${PROJECT_NAME} → dashboard-app

3. Dependency resolution:
   - Run git_repository_initialized first
   - Run husky_installed before hook tests
   - Run coverage tests after vitest setup tests

4. Test execution in parallel groups:
   - Group 1: Independent file existence checks
   - Group 2: Configuration validation tests  
   - Group 3: Integration tests requiring setup

5. Result reporting:
   - 28 tests passed, 2 failed
   - Critical: Missing API rate limiting config
   - Warning: Test coverage at 82% vs required 85%
   - User choice: Fix issues or proceed
```

## Performance Validation

### Expected Performance Metrics

```
Verification Performance Report:
==============================

Extraction Phase: 95ms
- Standards parsing: 60ms
- Variable identification: 15ms  
- Dependency graph: 20ms

Variable Substitution: 45ms
- PROJECT_COVERAGE detection: 15ms
- PROJECT_TYPE detection: 12ms
- Text replacement: 18ms

Test Execution: 1,850ms
- Group 1 (file checks): 200ms (8 tests parallel)
- Group 2 (config validation): 650ms (12 tests parallel) 
- Group 3 (integration tests): 1,000ms (8 tests sequential)

Result Processing: 25ms
- Status aggregation: 10ms
- Error message formatting: 15ms

Total Verification Time: 2.015s
Context Usage: 8.2% (well under 10% target)
Memory Efficiency: No duplicate content loaded

PERFORMANCE TARGET MET ✅
```

## Error Handling Validation  

### Test Error Scenarios

```bash
# Scenario 1: Missing git repository
rm -rf .git
# Expected: git-related tests skipped with clear warnings

# Scenario 2: Corrupted package.json  
echo "invalid json" > package.json
# Expected: JSON parsing fails gracefully, uses directory name

# Scenario 3: Permission errors
chmod 000 .husky
# Expected: Hook tests fail with permission error messages

# Scenario 4: Unknown variables in standards
# Add ${UNKNOWN_VAR} to a test
# Expected: Warning logged, test skipped, other tests continue

# Scenario 5: Test command timeout
# Mock a hanging command in verification
# Expected: 30s timeout, test marked as failed, other tests continue
```

These test scenarios validate that the Engineering OS verification system works correctly across different project configurations and handles edge cases gracefully while providing clear, actionable feedback to users.

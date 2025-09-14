# Local Development Quality Gates

## Pre-Commit Hooks Configuration

<conditional-block task-condition="pre-commit|husky|quality-gate|lint-staged" context-check="pre-commit-setup">
IF task involves pre-commit hooks or quality gates:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get pre-commit configuration from development/local-quality.md#pre-commit-hooks-configuration"
  </context_fetcher_strategy>
</conditional-block>

### Husky Setup

```json
// package.json additions
{
  "scripts": {
    "prepare": "husky install",
    "test:pre-commit": "vitest related --run",
    "coverage:check": "vitest run --coverage --threshold=80",
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "husky": "^9.0.0",
    "lint-staged": "^15.0.0",
    "@commitlint/cli": "^19.0.0",
    "@commitlint/config-conventional": "^19.0.0"
  }
}
```

### Pre-Commit Hook Implementation

```bash
#!/usr/bin/env sh
# .husky/pre-commit
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running pre-commit quality checks..."

# Run BiomeJS checks (uses existing Engineering OS BiomeJS config)
echo "📝 Checking code style with BiomeJS..."
pnpm biome check --apply . || {
  echo "❌ BiomeJS checks failed"
  exit 1
}

# Type checking
echo "🔧 Running TypeScript type check..."
pnpm type-check || {
  echo "❌ Type checking failed"
  exit 1
}

# Run tests for changed files
echo "🧪 Running tests for changed files..."
pnpm test:pre-commit || {
  echo "❌ Tests failed for changed files"
  exit 1
}

# Verify coverage threshold
echo "📊 Checking coverage threshold..."
pnpm coverage:check || {
  echo "❌ Coverage threshold not met"
  exit 1
}

echo "✅ All pre-commit checks passed!"
```

<!-- Verification block for pre-commit hook configuration -->
<verification-block context-check="verification-pre-commit-setup">
  <verification_definitions>
    <test name="husky_installed">
      TEST: test -d .husky && (test -f .husky/_/husky.sh || test -f .husky/install.mjs)
      REQUIRED: true
      BLOCKING: true
      ERROR: "Husky not properly installed. Run 'npx husky init' to set up git hooks."
      FIX_COMMAND: "npx husky init"
      DESCRIPTION: "Verifies Husky is installed to enforce local quality gates via git hooks."
    </test>
    <test name="pre_commit_hook_exists">
      TEST: test -f .husky/pre-commit
      REQUIRED: true
      BLOCKING: true
      ERROR: "Pre-commit hook file missing. Create .husky/pre-commit with quality checks."
      FIX_COMMAND: "Create .husky/pre-commit file from local-quality.md template"
      DESCRIPTION: "Ensures the pre-commit hook exists to run local quality checks."
    </test>
    <test name="pre_commit_executable">
      TEST: test -x .husky/pre-commit
      REQUIRED: true
      BLOCKING: true
      ERROR: "Pre-commit hook not executable. Run 'chmod +x .husky/pre-commit'."
      FIX_COMMAND: "chmod +x .husky/pre-commit"
      DEPENDS_ON: ["pre_commit_hook_exists"]
      DESCRIPTION: "Confirms the pre-commit hook has execute permissions so checks actually run."
    </test>
    <test name="husky_prepare_script_present">
      TEST: grep -q '"prepare"\s*:\s*"husky install"' package.json
      REQUIRED: true
      BLOCKING: true
      ERROR: "Husky prepare script missing from package.json. Add 'prepare: \"husky install\"' to scripts."
      FIX_COMMAND: "Add '"prepare": "husky install"' under scripts in package.json"
      DESCRIPTION: "Ensures Husky is (re)installed on install so hooks function consistently"
      DEPENDS_ON: ["coverage_check_script"]
    </test>
    <test name="pre_commit_invokes_coverage_check">
      TEST: test "${PROJECT_TYPE}" != "greenfield" || grep -q 'coverage:check' .husky/pre-commit
      REQUIRED: true
      BLOCKING: true
      VARIABLES: ["PROJECT_TYPE"]
      ERROR: "Pre-commit hook does not invoke coverage:check. Enforce coverage in greenfield projects."
      FIX_COMMAND: "Add 'pnpm coverage:check' to .husky/pre-commit"
      DESCRIPTION: "Requires coverage enforcement as part of pre-commit for greenfield projects"
      DEPENDS_ON: ["pre_commit_hook_exists"]
    </test>
    <test name="coverage_check_script">
      TEST: grep -q '"coverage:check"' package.json
      REQUIRED: true
      BLOCKING: true
      ERROR: "Coverage check script missing from package.json. Add coverage:check script."
      FIX_COMMAND: "Add '\"coverage:check\": \"vitest run --coverage --reporter=summary\"' to package.json scripts"
      DESCRIPTION: "Requires a coverage script to enforce minimum coverage in local workflows."
    </test>
    <test name="coverage_threshold_configured">
      TEST: grep -q 'coverage.*threshold.*${PROJECT_COVERAGE}' package.json || grep -q 'coverage:check.*--threshold=${PROJECT_COVERAGE}' package.json
      REQUIRED: true
      BLOCKING: true
      VARIABLES: ["PROJECT_COVERAGE"]
      ERROR: "Coverage threshold not set to ${PROJECT_COVERAGE}%. Update package.json coverage:check script."
      FIX_COMMAND: "Update coverage:check script to include --coverage.thresholds.lines=${PROJECT_COVERAGE}"
      DEPENDS_ON: ["coverage_check_script"]
      DESCRIPTION: "Ensures coverage thresholds are enforced at the desired percentage."
    </test>
  </verification_definitions>
</verification-block>

## Lint-Staged Configuration

<conditional-block task-condition="lint-staged|incremental-check" context-check="lint-staged-config">
IF task involves lint-staged or incremental checks:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get lint-staged configuration from development/local-quality.md#lint-staged-configuration"
  </context_fetcher_strategy>
</conditional-block>

### Configuration File

```json
// .lintstagedrc.json
{
  "*.{ts,tsx,js,jsx}": [
    "biome check --apply",
    "vitest related --run --passWithNoTests"
  ],
  "*.{json,md,yml,yaml}": [
    "biome format --write"
  ],
  "*.{css,scss}": [
    "biome format --write"
  ],
  "package.json": [
    "sort-package-json"
  ]
}
```

<!-- Verification block for lint-staged configuration -->
<verification-block context-check="verification-lint-staged-setup">
  <verification_definitions>
    <test name="lint_staged_config_exists">
      TEST: test -f .lintstagedrc.json || grep -q '"lint-staged"' package.json
      REQUIRED: true
      BLOCKING: true
      ERROR: "Lint-staged not configured. Create .lintstagedrc.json or add lint-staged section to package.json."
      FIX_COMMAND: "Create .lintstagedrc.json file from local-quality.md template"
      DESCRIPTION: "Requires lint-staged setup to limit checks to changed files for speed."
    </test>
    <test name="lint_staged_includes_biome">
      TEST: (test -f .lintstagedrc.json && grep -q 'biome check' .lintstagedrc.json) || grep -q '"biome check"' package.json
      REQUIRED: true
      BLOCKING: true
      ERROR: "Lint-staged missing BiomeJS integration. Add 'biome check --apply' to lint-staged configuration."
      FIX_COMMAND: "Add '\"biome check --apply\"' to lint-staged configuration for TypeScript files"
      DEPENDS_ON: ["lint_staged_config_exists"]
      DESCRIPTION: "Ensures formatting/linting runs on staged files using BiomeJS."
    </test>
    <test name="lint_staged_includes_tests">
      TEST: (test -f .lintstagedrc.json && grep -q 'vitest.*related' .lintstagedrc.json) || grep -q '"vitest.*related"' package.json
      REQUIRED: true
      BLOCKING: true
      ERROR: "Lint-staged missing test execution. Add 'vitest related --run' to lint-staged configuration."
      FIX_COMMAND: "Add '\"vitest related --run --passWithNoTests\"' to lint-staged configuration"
      DESCRIPTION: "Runs quick tests for changed files pre-commit to catch regressions early."
      DEPENDS_ON: ["lint_staged_config_exists"]
    </test>
  </verification_definitions>
</verification-block>

### Alternative Inline Configuration

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "biome check --apply",
      "vitest related --run --passWithNoTests"
    ],
    "*.{json,md,yml}": [
      "biome format --write"
    ]
  }
}
```

## Local Quality Requirements

<conditional-block task-condition="quality-gate|local-validation" context-check="quality-gates-requirements">
IF task involves quality gates or local validation:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get quality gate requirements from development/local-quality.md#local-quality-requirements"
  </context_fetcher_strategy>
</conditional-block>

### Pre-Commit Requirements

**All of these must pass before commit:**
- ✅ BiomeJS checks pass (0 errors, 0 warnings)
- ✅ TypeScript compilation successful
- ✅ Tests for modified files pass
- ✅ Coverage thresholds maintained
- ✅ No console.log statements in production code
- ✅ No TODO/FIXME comments without issue references

### Pre-Push Requirements

**All of these must pass before push:**
- ✅ All tests pass: `pnpm test`
- ✅ Build successful: `pnpm build`
- ✅ No security vulnerabilities: `pnpm audit --audit-level moderate`
- ✅ Coverage report meets project threshold
- ✅ No type errors in strict mode

### Commit Quality Standards

**Conventional commit format enforced:**
- ✅ Proper commit type (feat, fix, docs, etc.)
- ✅ Scope alignment when applicable
- ✅ Maximum 100 character header
- ✅ No merge commits on feature branches
- ✅ Descriptive commit messages

## Pre-Push Hook Configuration

```bash
#!/usr/bin/env sh
# .husky/pre-push
. "$(dirname -- "$0")/_/husky.sh"

echo "🚀 Running pre-push quality checks..."

# Run all tests
echo "🧪 Running full test suite..."
pnpm test || {
  echo "❌ Test suite failed"
  exit 1
}

# Verify build works
echo "🏗️  Verifying build..."
pnpm build || {
  echo "❌ Build failed"
  exit 1
}

# Security audit
echo "🔒 Running security audit..."
pnpm audit --audit-level moderate || {
  echo "❌ Security vulnerabilities found"
  exit 1
}

echo "✅ All pre-push checks passed!"
```

<!-- Verification block for pre-push hook (greenfield = required) -->
<verification-block context-check="verification-pre-push-hook">
  <verification_definitions>
    <test name="pre_push_hook_exists">
      TEST: test "${PROJECT_TYPE}" != "greenfield" || test -f .husky/pre-push
      REQUIRED: true
      BLOCKING: true
      VARIABLES: ["PROJECT_TYPE"]
      ERROR: "Pre-push hook not found. Greenfield projects must include .husky/pre-push to enforce full checks before pushing."
      FIX_COMMAND: "Create .husky/pre-push from the template in local-quality.md and make it executable"
      DESCRIPTION: "Requires a pre-push quality gate for greenfield projects; advisory otherwise"
    </test>
    <test name="pre_push_hook_executable">
      TEST: test "${PROJECT_TYPE}" != "greenfield" || test -x .husky/pre-push
      REQUIRED: true
      BLOCKING: true
      VARIABLES: ["PROJECT_TYPE"]
      ERROR: "Pre-push hook exists but is not executable. Run 'chmod +x .husky/pre-push'."
      FIX_COMMAND: "chmod +x .husky/pre-push"
      DESCRIPTION: "Ensures pre-push hook can run (required for greenfield)"
      DEPENDS_ON: ["pre_push_hook_exists"]
    </test>
  </verification_definitions>
</verification-block>

## Commit Message Hook

```bash
#!/usr/bin/env sh
# .husky/commit-msg
. "$(dirname -- "$0")/_/husky.sh"

# Validate commit message format
npx --no-install commitlint --edit "$1" || {
  echo "❌ Commit message format is invalid"
  echo "Format: <type>(<scope>): <subject>"
  echo "Example: feat(auth): add OAuth2 integration"
  exit 1
}
```

<!-- Verification block for commit message hook -->
<verification-block context-check="verification-commit-msg-hook">
  <verification_definitions>
    <test name="commit_msg_hook_exists">
      TEST: test -f .husky/commit-msg
      REQUIRED: true
      BLOCKING: true
      ERROR: "Commit-msg hook missing. Create .husky/commit-msg with commitlint validation."
      FIX_COMMAND: "Create .husky/commit-msg file from local-quality.md template"
      DESCRIPTION: "Requires the commit-msg hook to enforce commit message format."
    </test>
    <test name="commit_msg_hook_executable">
      TEST: test -x .husky/commit-msg
      REQUIRED: true
      BLOCKING: true
      ERROR: "Commit-msg hook not executable. Run 'chmod +x .husky/commit-msg'."
      FIX_COMMAND: "chmod +x .husky/commit-msg"
      DEPENDS_ON: ["commit_msg_hook_exists"]
      DESCRIPTION: "Ensures the commit-msg hook is executable so commitlint runs."
    </test>
    <test name="commitlint_in_commit_msg">
      TEST: grep -q 'commitlint.*--edit.*\$1' .husky/commit-msg
      REQUIRED: true
      BLOCKING: true
      ERROR: "Commit-msg hook missing commitlint execution. Add 'npx --no -- commitlint --edit \$1' to hook."
      FIX_COMMAND: "Add 'npx --no-install commitlint --edit \"$1\"' to .husky/commit-msg hook"
      DEPENDS_ON: ["commit_msg_hook_exists"]
      DESCRIPTION: "Verifies commitlint runs during commit to enforce Conventional Commits."
    </test>
  </verification_definitions>
</verification-block>

## CommitLint Configuration

```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat', 'fix', 'docs', 'style', 
      'refactor', 'perf', 'test', 'chore', 'revert'
    ]],
    'header-max-length': [2, 'always', 100],
    'subject-case': [2, 'never', ['sentence-case', 'start-case', 'pascal-case']],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'body-leading-blank': [1, 'always'],
    'footer-leading-blank': [1, 'always']
  }
};
```

<!-- Verification block for commitlint configuration -->
<verification-block context-check="verification-commitlint-config">
  <verification_definitions>
    <test name="commitlint_config_exists">
      TEST: test -f commitlint.config.js || test -f commitlint.config.ts
      REQUIRED: true
      BLOCKING: true
      ERROR: "Commitlint configuration missing. Create commitlint.config.js with conventional commit rules."
      FIX_COMMAND: "Create commitlint.config.js file from local-quality.md template"
      DESCRIPTION: "Requires presence of commitlint configuration to enforce commit rules."
    </test>
    <test name="commitlint_config_valid">
      TEST: (test -f commitlint.config.js && node -e "require('./commitlint.config.js')" 2>/dev/null) || (test -f commitlint.config.mjs && node -e "import('./commitlint.config.mjs')" 2>/dev/null) || (test -f commitlint.config.ts && npx tsx -e "import('./commitlint.config.ts')" 2>/dev/null)
      REQUIRED: true
      BLOCKING: true
      ERROR: "Commitlint configuration invalid. Check syntax in commitlint.config.js/mjs/ts."
      FIX_COMMAND: "Fix syntax errors in commitlint configuration file"
      DEPENDS_ON: ["commitlint_config_exists"]
      DESCRIPTION: "Validates the commitlint config loads without syntax errors."
    </test>
    <test name="conventional_extends">
      TEST: grep -q "@commitlint/config-conventional" commitlint.config.js || grep -q "@commitlint/config-conventional" commitlint.config.ts
      REQUIRED: true
      BLOCKING: true
      ERROR: "Commitlint missing conventional config. Add extends: ['@commitlint/config-conventional']."
      FIX_COMMAND: "Add 'extends: [\"@commitlint/config-conventional\"]' to commitlint configuration"
      DEPENDS_ON: ["commitlint_config_exists"]
      DESCRIPTION: "Ensures commitlint extends the conventional config to enforce standard rules."
    </test>
    <test name="phase_scopes_configured">
      TEST: grep -q "scope-enum" commitlint.config.js || test "${PROJECT_PHASES}" = "false"
      REQUIRED: false
      BLOCKING: false
      VARIABLES: ["PROJECT_PHASES"]
      ERROR: "Phase scopes not configured for phased project. Add scope-enum rule with phase scopes."
      FIX_COMMAND: "Add scope-enum rule with project phase scopes to commitlint configuration"
      DEPENDS_ON: ["commitlint_config_exists"]
      DESCRIPTION: "If phases are used, suggests configuring scope-enum to encode phase scopes."
    </test>
  </verification_definitions>
</verification-block>

## Quality Metrics Integration

<conditional-block task-condition="metrics|quality-metrics" context-check="local-quality-metrics">
IF task involves quality metrics:
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get quality metrics integration from development/metrics.md"
  </context_fetcher_strategy>
</conditional-block>

### Quality Commands

```json
// package.json scripts
{
  "scripts": {
    "quality:check": "pnpm lint && pnpm type-check && pnpm test && pnpm build",
    "quality:fix": "biome check --apply . && pnpm test:fix",
    "quality:report": "pnpm test:coverage && pnpm build:analyze",
    "pre-commit": "lint-staged",
    "pre-push": "pnpm quality:check"
  }
}
```

### IDE Integration

**VS Code Settings (.vscode/settings.json):**
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.biome": true,
    "source.organizeImports.biome": true
  },
  "typescript.preferences.includePackageJsonAutoImports": "auto",
  "editor.rulers": [80, 100],
  "files.trimTrailingWhitespace": true,
  "files.insertFinalNewline": true
}
```

## Troubleshooting

### Common Issues

**Husky hooks not running:**
```bash
# Reinstall husky hooks
pnpm husky install
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
chmod +x .husky/pre-push
```

**BiomeJS conflicts with existing config:**
```bash
# Check biome configuration
cat biome.json
# Ensure it matches Engineering OS standards
```

**Test failures in pre-commit:**
```bash
# Run tests individually to identify issues
pnpm vitest related --run --reporter=verbose
```

**Coverage threshold failures:**
```bash
# Check coverage report
pnpm test:coverage
# Adjust threshold in package.json if needed
```

### Performance Optimization

**Speed up pre-commit hooks:**
- Use `vitest related` instead of full test suite
- Enable BiomeJS cache: `biome check --apply . --cache`
- Use parallel execution where possible
- Skip hooks for WIP commits: `git commit --no-verify`

### Bypass Options (Use Sparingly)

```bash
# Skip pre-commit hooks (emergency only)
git commit --no-verify -m "emergency fix"

# Skip pre-push hooks (emergency only)  
git push --no-verify

# Skip specific lint-staged files
git commit -m "fix" --no-verify
```

**⚠️ Warning**: Bypassing quality gates should only be done in emergencies and issues should be fixed immediately afterward.

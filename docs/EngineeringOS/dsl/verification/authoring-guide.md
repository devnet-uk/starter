# Writing Verification Patterns - Engineering OS Standards
<!-- Relocated from docs/standards/verification to docs/EngineeringOS/dsl/verification (authoring guidance) -->

## Overview

This guide explains how to write verification blocks in Engineering OS standards files. Verification blocks ensure that AI-driven implementations consistently apply standards through automated, deterministic validation.

## Verification Block Anatomy

### Basic Structure

```xml
<verification-block context-check="example-verification-unique-id">
  <verification_definitions>
    <test name="test_name">
      TEST: shell command to execute
      REQUIRED: true
      ERROR: "Descriptive error message with fix suggestion"
    </test>
  </verification_definitions>
</verification-block>
```

### Complete Structure with All Options

```xml
<verification-block context-check="verification-comprehensive-example">
  <verification_definitions>
    <test name="comprehensive_test_example">
      TEST: complex shell command with ${VARIABLE} substitution
      REQUIRED: true
      VARIABLES: ["PROJECT_COVERAGE", "PROJECT_TYPE"]
      ERROR: "Detailed error message mentioning ${PROJECT_COVERAGE}% requirement for ${PROJECT_TYPE} projects"
      DEPENDS_ON: ["prerequisite_test", "another_dependency"]
      DESCRIPTION: "What this test verifies and why it matters"
      BLOCKING: true
      FIX_COMMAND: "Concrete, safe, idempotent fix command"
    </test>
  </verification_definitions>
</verification-block>
```

## Writing Effective Test Commands

### File Existence Tests

```xml
<test name="config_file_exists">
  TEST: test -f package.json
  REQUIRED: true
  ERROR: "package.json not found. Initialize project with 'npm init' or 'pnpm init'."
</test>

<test name="directory_exists">
  TEST: test -d .husky
  REQUIRED: true  
  ERROR: "Husky directory missing. Run 'npx husky init' to set up git hooks."
</test>

<test name="executable_check">
  TEST: test -x .husky/pre-commit
  REQUIRED: true
  ERROR: "Pre-commit hook not executable. Run 'chmod +x .husky/pre-commit'."
  DEPENDS_ON: ["husky_directory_exists"]
</test>
```

### Content Validation Tests

```xml
<test name="json_content_check">
  TEST: grep -q '"coverage"' package.json
  REQUIRED: true
  ERROR: "No coverage configuration in package.json. Add coverage scripts."
</test>

<test name="pattern_matching">
  TEST: grep -E '^(feat|fix|docs|style|refactor|perf|test|chore)(\(.+\))?: .+' <<< "$(git log -1 --pretty=format:'%s')"
  REQUIRED: false
  ERROR: "Latest commit doesn't follow conventional format: type(scope): description"
</test>

<test name="version_check">
  TEST: node -e "const pkg = require('./package.json'); const version = pkg.devDependencies?.husky || pkg.dependencies?.husky; console.log(version); process.exit(version && version.match(/\^?([89]|[1-9][0-9])/) ? 0 : 1);"
  REQUIRED: true
  ERROR: "Husky version should be v8+ for modern hook support. Update with 'pnpm add -D husky@latest'."
</test>
```

### Complex Conditional Tests

```xml
<test name="coverage_threshold_comprehensive">
  TEST: (test -f package.json && grep -q 'threshold.*${PROJECT_COVERAGE}' package.json) || (test -f vitest.config.ts && grep -q 'threshold.*${PROJECT_COVERAGE}' vitest.config.ts) || (test -f jest.config.js && grep -q 'threshold.*${PROJECT_COVERAGE}' jest.config.js)
  REQUIRED: true
  VARIABLES: ["PROJECT_COVERAGE"]
  ERROR: "Coverage threshold not configured for ${PROJECT_COVERAGE}% requirement. Add threshold to package.json, vitest.config.ts, or jest.config.js."
</test>
```

## Timeouts & Safety Guidance

- Keep test commands fast and deterministic; prefer local filesystem checks (e.g., `test`, `grep`).
- Avoid network and destructive operations in TEST. Never use `curl`, `wget`, `npm install`, `pnpm add`, `git clone`, `rm -rf`, or `sudo`.
- Enforce timeouts in the runner (default 30s). If a test is potentially long-running, add a brief note in DESCRIPTION and ensure a clear fail condition.

## Required Fields & FIX Commands

- Every test must include: `TEST`, `ERROR`, and `DESCRIPTION` (what/why). `FIX_COMMAND` is strongly recommended for `BLOCKING: true` tests.
- Variables: any placeholder like `${PROJECT_COVERAGE}` must appear in the `VARIABLES` list.

## Variable Usage Patterns

### Available Variables

| Variable | Type | Description | Example Values |
|----------|------|-------------|----------------|
| `PROJECT_COVERAGE` | Integer | Coverage percentage requirement | 98, 85, 70 |
| `PROJECT_TYPE` | String | Project maturity/type | greenfield, standard, legacy |
| `PROJECT_NAME` | String | Project name from package.json | my-app, dashboard |
| `PROJECT_PHASES` | Boolean | Whether using phased development | true, false |
| `GIT_HOOKS` | String | Space-separated list of required hooks | pre-commit commit-msg |

### Variable Substitution in Tests

```xml
<test name="coverage_for_project_type">
  TEST: grep -q 'threshold.*${PROJECT_COVERAGE}' package.json
  REQUIRED: true
  VARIABLES: ["PROJECT_COVERAGE"]
  ERROR: "Coverage threshold should be ${PROJECT_COVERAGE}% for this project type."
</test>

<test name="project_name_validation">
  TEST: grep -q '"name": "${PROJECT_NAME}"' package.json
  REQUIRED: true
  VARIABLES: ["PROJECT_NAME"]
  ERROR: "Package name should match project directory name: ${PROJECT_NAME}"
</test>

<test name="phase_aware_commits">
  TEST: test "${PROJECT_PHASES}" != "true" || git log --oneline -5 | grep -E '\(phase-[0-7]\):'
  REQUIRED: false
  VARIABLES: ["PROJECT_PHASES"]
  ERROR: "Phased project commits should include phase scopes like (phase-0), (phase-1), etc."
</test>
```

### Multi-Variable Tests

```xml
<test name="environment_specific_config">
  TEST: test "${PROJECT_TYPE}" = "greenfield" && grep -q 'threshold.*${PROJECT_COVERAGE}' vitest.config.ts || test "${PROJECT_TYPE}" != "greenfield"
  REQUIRED: true
  VARIABLES: ["PROJECT_TYPE", "PROJECT_COVERAGE"]
  ERROR: "Greenfield projects should use Vitest with ${PROJECT_COVERAGE}% coverage threshold, not Jest."
</test>
```

## Dependency Management

### Simple Dependencies

```xml
<test name="prerequisite">
  TEST: test -f package.json
  REQUIRED: true
  ERROR: "package.json required for dependency checks."
</test>

<test name="dependent_test">
  TEST: grep -q '"husky"' package.json
  REQUIRED: true
  ERROR: "Husky not found in dependencies."
  DEPENDS_ON: ["prerequisite"]
</test>
```

### Complex Dependency Chains

```xml
<test name="git_initialized">
  TEST: test -d .git
  REQUIRED: true
  ERROR: "Git repository not initialized. Run 'git init'."
</test>

<test name="husky_installed">
  TEST: test -d .husky
  REQUIRED: true
  ERROR: "Husky not installed. Run 'npx husky init'."
  DEPENDS_ON: ["git_initialized"]
</test>

<test name="pre_commit_exists">
  TEST: test -f .husky/pre-commit
  REQUIRED: true
  ERROR: "Pre-commit hook missing. Create .husky/pre-commit file."
  DEPENDS_ON: ["husky_installed"]
</test>

<test name="pre_commit_executable">
  TEST: test -x .husky/pre-commit
  REQUIRED: true
  ERROR: "Pre-commit hook not executable. Run 'chmod +x .husky/pre-commit'."
  DEPENDS_ON: ["pre_commit_exists"]
</test>
```

### Parallel vs Sequential Execution

Dependencies create sequential execution requirements:
- Tests with no dependencies run in parallel
- Tests with dependencies wait for prerequisites
- Failed dependencies cause dependent tests to be skipped

## Error Message Best Practices

### Good Error Messages

```xml
<!-- ✅ GOOD: Specific, actionable, includes fix command -->
<test name="good_error_example">
  TEST: test -f commitlint.config.js
  REQUIRED: true
  ERROR: "Commitlint configuration missing. Create commitlint.config.js with conventional commit rules. Run: echo \"module.exports = {extends: ['@commitlint/config-conventional']}\" > commitlint.config.js"
</test>

<!-- ✅ GOOD: Context-aware with variable substitution -->
<test name="good_context_example">
  TEST: grep -q 'threshold.*${PROJECT_COVERAGE}' vitest.config.ts
  REQUIRED: true
  VARIABLES: ["PROJECT_COVERAGE"]
  ERROR: "Coverage threshold not set to ${PROJECT_COVERAGE}% in vitest.config.ts. Add threshold configuration to test.coverage.thresholds.global."
</test>

<!-- ✅ GOOD: Clear expectation vs reality -->
<test name="good_expectation_example">
  TEST: test -x .husky/pre-commit
  REQUIRED: true
  ERROR: "Pre-commit hook not executable. Expected: executable file at .husky/pre-commit. Actual: file exists but not executable. Fix: chmod +x .husky/pre-commit"
</test>
```

### Poor Error Messages to Avoid

```xml
<!-- ❌ BAD: Vague, no context -->
<test name="bad_error_example">
  TEST: test -f some-file
  REQUIRED: true
  ERROR: "File missing."
</test>

<!-- ❌ BAD: No fix suggestion -->
<test name="bad_no_fix_example">
  TEST: grep -q 'pattern' file.txt
  REQUIRED: true
  ERROR: "Pattern not found in file."
</test>

<!-- ❌ BAD: Technical jargon without explanation -->
<test name="bad_technical_example">
  TEST: command -v foo
  REQUIRED: true
  ERROR: "Foo binary not in PATH."
</test>
```

## Profiles and Conditional Blocking

Use project profiles (e.g., greenfield vs standard vs legacy) to tune strictness without duplicating tests. Gate a single test with variables rather than authoring multiple variants.

### PROJECT_TYPE Gating Pattern

```xml
<test name="devcontainer_required">
  TEST: test "${PROJECT_TYPE}" != "greenfield" || test -d .devcontainer
  REQUIRED: true
  BLOCKING: true
  VARIABLES: ["PROJECT_TYPE"]
  ERROR: "Devcontainer missing. Required for greenfield projects."
  FIX_COMMAND: "Create .devcontainer/devcontainer.json and docker-compose.yml from standards"
  DESCRIPTION: "Requires devcontainer for greenfield; advisory for other profiles when BLOCKING=false"
</test>
```

Guidelines:
- Prefer a single test with a `PROJECT_TYPE` guard over test duplication.
- List all variables used in `VARIABLES`.
- Keep commands safe and non-networked.

### Layer-Based Severity

- Domain/use-cases (stricter):
  - TypeScript strict flags + `tsc --noEmit` → REQUIRED=true, BLOCKING=true
  - Biome rules (e.g., `noExplicitAny`, `noNonNullAssertion` as error) → REQUIRED=true, BLOCKING=true
  - Coverage threshold (uses `${PROJECT_COVERAGE}`) → REQUIRED=true, BLOCKING=true

- Infrastructure/UI (lighter):
  - Scripts authenticity (no `echo`/`true`) → REQUIRED=true, BLOCKING=true
  - Extras (pre-push, coverage reporters, devcontainer) → start as REQUIRED=true, BLOCKING=false or gate by `PROJECT_TYPE`

### Common Variables for Profiles

- `PROJECT_TYPE` (greenfield | standard | legacy)
- `PROJECT_COVERAGE` (e.g., 98 for greenfield, 80 for standard, 70 for legacy)
- `NODE_VERSION` (e.g., 22)
- `PORT_WEB`, `PORT_API` (e.g., 4000, 4001)

See also: profiles.md for defaults by profile and suggested blocking levels per layer.

## Context Check Guidelines

### Unique Naming

Context checks must be globally unique across all standards:

```xml
<!-- ✅ GOOD: Descriptive and specific -->
<verification-block context-check="verification-husky-pre-commit-setup">

<!-- ✅ GOOD: Includes standard area -->
<verification-block context-check="verification-testing-vitest-coverage">

<!-- ✅ GOOD: Specific to feature -->
<verification-block context-check="verification-security-api-rate-limiting">

<!-- ❌ BAD: Too generic -->
<verification-block context-check="verification-setup">

<!-- ❌ BAD: Could conflict -->
<verification-block context-check="verification-hooks">
```

### Logical Grouping

Group related tests in the same verification block:

```xml
<!-- ✅ GOOD: All husky-related tests together -->
<verification-block context-check="verification-husky-complete-setup">
  <verification_definitions>
    <test name="husky_installed">...</test>
    <test name="pre_commit_hook_exists">...</test>
    <test name="commit_msg_hook_exists">...</test>
    <test name="hooks_executable">...</test>
  </verification_definitions>
</verification-block>

<!-- ❌ BAD: Mixing unrelated concerns -->
<verification-block context-check="verification-mixed-concerns">
  <verification_definitions>
    <test name="husky_installed">...</test>
    <test name="typescript_configured">...</test>
    <test name="api_security_headers">...</test>
  </verification_definitions>
</verification-block>
```

## Integration with Standards DSL

### Conditional Loading

Verification blocks work with conditional blocks for targeted loading:

```xml
<conditional-block task-condition="pre-commit|husky|quality-gate" context-check="local-quality-hooks">
IF task involves pre-commit hooks or quality gates:
  <!-- Standards content here -->
  
  <verification-block context-check="verification-pre-commit-hooks">
    <verification_definitions>
      <test name="husky_configured">
        TEST: test -d .husky && test -f .husky/pre-commit
        REQUIRED: true
        ERROR: "Pre-commit hooks not configured. Run 'npx husky init' and create pre-commit hook."
      </test>
    </verification_definitions>
  </verification-block>
</conditional-block>
```

### Multiple Verification Blocks per Standard

Standards can contain multiple verification blocks for different aspects:

```xml
<!-- In development/local-quality.md -->

<!-- Git hooks verification -->
<verification-block context-check="verification-git-hooks-setup">
  <verification_definitions>
    <test name="husky_installed">...</test>
    <test name="pre_commit_exists">...</test>
  </verification_definitions>
</verification-block>

<!-- Later in the same file... -->

<!-- Linting configuration verification -->
<verification-block context-check="verification-linting-setup">
  <verification_definitions>
    <test name="biome_configured">...</test>
    <test name="lint_staged_configured">...</test>
  </verification_definitions>
</verification-block>
```

## Testing Your Verifications

### Manual Testing

```bash
# Test individual commands
TEST_COMMAND="test -f package.json"
if eval "$TEST_COMMAND"; then
  echo "✅ Test passed"
else
  echo "❌ Test failed"
fi

# Test with variable substitution
PROJECT_COVERAGE=85
TEST_COMMAND="grep -q 'threshold.*${PROJECT_COVERAGE}' package.json"
eval "$TEST_COMMAND"
```

### Validation Checklist

Before adding verification blocks to standards:

- [ ] **Test commands work**: Run each TEST command manually
- [ ] **Variables substitute correctly**: Test with different PROJECT_* values
- [ ] **Error messages are helpful**: Clear description + fix suggestion
- [ ] **Dependencies are correct**: Tests run in proper order
- [ ] **Context check is unique**: No conflicts with other standards
- [ ] **Required flags appropriate**: Critical vs optional validations
- [ ] **Performance acceptable**: Commands complete within 30 seconds

## Common Patterns Library

### Package.json Validations

```xml
<test name="script_exists">
  TEST: grep -q '"test".*:' package.json
  REQUIRED: true
  ERROR: "Test script missing from package.json. Add: \"test\": \"vitest\" or similar."
</test>

<test name="dependency_version">
  TEST: node -e "const pkg=require('./package.json'); const ver=pkg.devDependencies?.typescript||'0.0.0'; process.exit(ver.match(/\^?([5-9])/) ? 0 : 1);"
  REQUIRED: true
  ERROR: "TypeScript version should be 5.x or higher. Update with 'pnpm add -D typescript@latest'."
</test>
```

### File Content Patterns

```xml
<test name="config_property">
  TEST: node -e "const config=require('./tsconfig.json'); process.exit(config.compilerOptions?.strict ? 0 : 1);"
  REQUIRED: true
  ERROR: "TypeScript strict mode not enabled. Set \"strict\": true in tsconfig.json."
</test>

<test name="yaml_validation">
  TEST: python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))"
  REQUIRED: true
  ERROR: "GitHub Actions workflow YAML is invalid. Check syntax in .github/workflows/ci.yml."
</test>
```

### Command Availability

```xml
<test name="command_available">
  TEST: command -v pnpm >/dev/null 2>&1
  REQUIRED: false
  ERROR: "pnpm not installed. Install with 'npm install -g pnpm' for better performance."
</test>

<test name="version_requirement">
  TEST: node --version | grep -q '^v1[89]\|^v[2-9][0-9]'
  REQUIRED: true
  ERROR: "Node.js version should be 18+ for modern features. Update Node.js."
</test>
```

This guide provides comprehensive patterns for writing effective verification blocks that ensure Engineering OS standards are consistently applied across AI-driven implementations.

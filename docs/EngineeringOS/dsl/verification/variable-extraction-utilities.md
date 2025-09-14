# Variable Extraction Utilities
<!-- Relocated from docs/standards/verification to docs/EngineeringOS/dsl/verification (authoring guidance) -->

## Overview

This document provides standardized utilities for extracting project-specific variables used in verification blocks. These utilities are used by the verification-runner subagent to substitute template variables with actual project values.

## Common Variables

### PROJECT_COVERAGE

**Description**: Test coverage percentage requirement for the project  
**Type**: Integer (0-100)  
**Usage**: `${PROJECT_COVERAGE}`

#### Extraction Methods

```bash
# Method 1: Extract from package.json coverage scripts
extract_coverage_from_package_json() {
  local coverage=$(grep -o 'threshold[^0-9]*\([0-9]\+\)' package.json 2>/dev/null | grep -o '[0-9]\+' | head -1)
  if [[ -n "$coverage" ]]; then
    echo "$coverage"
    return 0
  fi
  
  # Alternative pattern for coverage:check scripts
  coverage=$(grep -o 'coverage.*--threshold[^0-9]*\([0-9]\+\)' package.json 2>/dev/null | grep -o '[0-9]\+' | head -1)
  if [[ -n "$coverage" ]]; then
    echo "$coverage"
    return 0
  fi
  
  return 1
}

# Method 2: Extract from vitest.config.ts/js
extract_coverage_from_vitest_config() {
  for config in vitest.config.ts vitest.config.js vitest.config.mts vitest.config.mjs; do
    if [[ -f "$config" ]]; then
      local coverage=$(grep -o 'threshold[^0-9]*\([0-9]\+\)' "$config" 2>/dev/null | grep -o '[0-9]\+' | head -1)
      if [[ -n "$coverage" ]]; then
        echo "$coverage"
        return 0
      fi
    fi
  done
  return 1
}

# Method 3: Extract from jest.config files
extract_coverage_from_jest_config() {
  for config in jest.config.js jest.config.ts jest.config.json; do
    if [[ -f "$config" ]]; then
      local coverage=$(grep -o 'threshold[^0-9]*\([0-9]\+\)' "$config" 2>/dev/null | grep -o '[0-9]\+' | head -1)
      if [[ -n "$coverage" ]]; then
        echo "$coverage"
        return 0
      fi
    fi
  done
  return 1
}

# Combined extraction with fallback to defaults
detect_project_coverage() {
  local coverage
  
  # Try extraction methods in order
  coverage=$(extract_coverage_from_package_json) && echo "$coverage" && return
  coverage=$(extract_coverage_from_vitest_config) && echo "$coverage" && return  
  coverage=$(extract_coverage_from_jest_config) && echo "$coverage" && return
  
  # Fallback based on project type
  local project_type=$(detect_project_type)
  case "$project_type" in
    "greenfield") echo "98" ;;
    "legacy") echo "70" ;;
    *) echo "80" ;;
  esac
}
```

### PROJECT_TYPE

**Description**: Project type affecting verification requirements  
**Type**: String (greenfield|standard|legacy|migration)  
**Usage**: `${PROJECT_TYPE}`

#### Detection Logic

```bash
detect_project_type() {
  # Greenfield indicators
  if [[ -f "package.json" && ! -d "node_modules" ]]; then
    # New project without dependencies installed
    if grep -q '"version": "0\.' package.json 2>/dev/null; then
      echo "greenfield"
      return
    fi
  fi
  
  # Check for modern tooling patterns (greenfield indicators)
  if [[ -f "biome.json" && -f "vitest.config.ts" && ! -f ".eslintrc" ]]; then
    echo "greenfield"
    return
  fi
  
  # Legacy indicators
  local js_file_count=$(find . -name "*.js" -o -name "*.jsx" 2>/dev/null | wc -l)
  if [[ $js_file_count -gt 50 ]]; then
    # Many JavaScript files might indicate legacy
    if grep -r 'var ' src/ 2>/dev/null | head -1 | grep -q 'var '; then
      echo "legacy"
      return
    fi
  fi
  
  # Check for legacy tooling
  if [[ -f ".eslintrc" || -f ".eslintrc.js" || -f ".eslintrc.json" ]]; then
    if [[ ! -f "biome.json" ]]; then
      echo "legacy" 
      return
    fi
  fi
  
  # Migration indicators
  if [[ -f "TODO.md" || -f "MIGRATION.md" ]]; then
    if grep -qi "migrat" TODO.md MIGRATION.md 2>/dev/null; then
      echo "migration"
      return
    fi
  fi
  
  # Default to standard
  echo "standard"
}
```

### PROJECT_NAME

**Description**: Project name from package.json or directory  
**Type**: String  
**Usage**: `${PROJECT_NAME}`

#### Extraction Methods

```bash
detect_project_name() {
  # Method 1: Extract from package.json
  if [[ -f "package.json" ]]; then
    local name=$(grep -o '"name"[^"]*"[^"]*"' package.json 2>/dev/null | sed 's/.*"name"[^"]*"\([^"]*\)".*/\1/')
    if [[ -n "$name" && "$name" != "null" ]]; then
      echo "$name"
      return
    fi
  fi
  
  # Method 2: Use directory name
  basename "$(pwd)"
}
```

### PROJECT_PHASES

**Description**: Whether project uses phased development  
**Type**: Boolean (true|false)  
**Usage**: `${PROJECT_PHASES}`

#### Detection Logic

```bash
detect_project_phases() {
  # Check git commit messages for phase indicators
  if git log --oneline -20 2>/dev/null | grep -q 'phase-[0-7]'; then
    echo "true"
    return
  fi
  
  # Check for phase documentation
  if [[ -f "docs/product/roadmap.md" ]]; then
    if grep -qi "phase" docs/product/roadmap.md; then
      echo "true"
      return
    fi
  fi
  
  # Check for phase-specific branches
  if git branch -r 2>/dev/null | grep -q 'phase-'; then
    echo "true"
    return
  fi
  
  # Check for Engineering OS phase patterns
  if [[ -d "docs/product/specs" ]]; then
    if find docs/product/specs -name "*.md" -exec grep -l "phase-[0-9]" {} \; 2>/dev/null | head -1 | grep -q .; then
      echo "true"
      return
    fi
  fi
  
  echo "false"
}
```

### GIT_HOOKS

**Description**: Required git hooks for the project  
**Type**: Array of strings  
**Usage**: `${GIT_HOOKS}` (expands to space-separated list)

#### Detection Logic

```bash
detect_required_git_hooks() {
  local hooks=()
  
  # Always require basic hooks
  hooks+=("pre-commit")
  
  # Check if commitlint is configured
  if [[ -f "commitlint.config.js" || -f "commitlint.config.ts" || -f ".commitlintrc.json" ]]; then
    hooks+=("commit-msg")
  fi
  
  # Check for pre-push requirements in package.json
  if grep -q 'pre-push\|prepush' package.json 2>/dev/null; then
    hooks+=("pre-push")
  fi
  
  # Check for existing .husky hooks
  if [[ -d ".husky" ]]; then
    for hook in pre-commit commit-msg pre-push post-commit; do
      if [[ -f ".husky/$hook" ]]; then
        if ! printf '%s\n' "${hooks[@]}" | grep -q "^$hook$"; then
          hooks+=("$hook")
        fi
      fi
    done
  fi
  
  # Return space-separated list
  printf '%s\n' "${hooks[@]}" | tr '\n' ' ' | sed 's/ $//'
}
```

## Variable Substitution Function

The main function that performs variable substitution in test commands and error messages:

```bash
substitute_variables() {
  local input="$1"
  local result="$input"
  
  # Extract all variables from the input
  local variables=($(echo "$input" | grep -o '\${[^}]*}' | sort -u))
  
  for var in "${variables[@]}"; do
    local var_name=$(echo "$var" | sed 's/\${//;s/}//')
    local var_value=""
    
    case "$var_name" in
      "PROJECT_COVERAGE")
        var_value=$(detect_project_coverage)
        ;;
      "PROJECT_TYPE")
        var_value=$(detect_project_type)
        ;;
      "PROJECT_NAME") 
        var_value=$(detect_project_name)
        ;;
      "PROJECT_PHASES")
        var_value=$(detect_project_phases)
        ;;
      "GIT_HOOKS")
        var_value=$(detect_required_git_hooks)
        ;;
      *)
        echo "WARNING: Unknown variable $var_name" >&2
        continue
        ;;
    esac
    
    # Perform substitution
    result=$(echo "$result" | sed "s|\${$var_name}|$var_value|g")
  done
  
  echo "$result"
}
```

## Validation Functions

Functions to validate that all variables have been properly substituted:

```bash
validate_substitution() {
  local text="$1"
  
  # Check for remaining unsubstituted variables
  local remaining=$(echo "$text" | grep -o '\${[^}]*}')
  
  if [[ -n "$remaining" ]]; then
    echo "ERROR: Unsubstituted variables found: $remaining" >&2
    return 1
  fi
  
  return 0
}

test_variable_extraction() {
  echo "Testing variable extraction utilities..."
  
  echo "PROJECT_COVERAGE: $(detect_project_coverage)"
  echo "PROJECT_TYPE: $(detect_project_type)"  
  echo "PROJECT_NAME: $(detect_project_name)"
  echo "PROJECT_PHASES: $(detect_project_phases)"
  echo "GIT_HOOKS: $(detect_required_git_hooks)"
  
  # Test substitution
  local test_string="Coverage should be ${PROJECT_COVERAGE}% for ${PROJECT_TYPE} projects"
  echo "Before: $test_string"
  echo "After: $(substitute_variables "$test_string")"
}
```

## Integration with verification-runner

The verification-runner subagent uses these utilities in its variable substitution phase:

```bash
# Source the utilities
source /path/to/variable-extraction-utilities.md

# In the verification runner workflow:
perform_variable_substitution() {
  local test_command="$1"
  local error_message="$2"
  
  # Substitute variables in both test command and error message
  local substituted_command=$(substitute_variables "$test_command")
  local substituted_error=$(substitute_variables "$error_message")
  
  # Validate substitution was successful
  if ! validate_substitution "$substituted_command"; then
    echo "Failed to substitute variables in test command: $test_command" >&2
    return 1
  fi
  
  if ! validate_substitution "$substituted_error"; then
    echo "Failed to substitute variables in error message: $error_message" >&2
    return 1
  fi
  
  # Return substituted values
  echo "$substituted_command"
  echo "$substituted_error"
}
```

## Example Usage

### Testing Coverage Extraction

```bash
# Example 1: package.json with coverage script
echo '{"scripts": {"coverage:check": "vitest run --coverage --threshold=85"}}' > package.json
echo "Detected coverage: $(detect_project_coverage)"  # Output: 85

# Example 2: vitest.config.ts with threshold
echo 'export default { test: { coverage: { threshold: { global: 95 } } } }' > vitest.config.ts  
echo "Detected coverage: $(detect_project_coverage)"  # Output: 95

# Example 3: No configuration (fallback to project type)
rm -f package.json vitest.config.ts
echo "Detected coverage: $(detect_project_coverage)"  # Output: 80 (standard default)
```

### Testing Variable Substitution

```bash
# Example test command with variables
test_cmd="grep -q 'coverage.*\${PROJECT_COVERAGE}' package.json"
error_msg="Coverage threshold not set to \${PROJECT_COVERAGE}% for \${PROJECT_TYPE} projects"

# Perform substitution
substituted_cmd=$(substitute_variables "$test_cmd")
substituted_err=$(substitute_variables "$error_msg")

echo "Original command: $test_cmd"
echo "Substituted command: $substituted_cmd"
echo "Original error: $error_msg" 
echo "Substituted error: $substituted_err"
```

## Error Handling

The utilities include comprehensive error handling:

- **Missing files**: Graceful fallback to defaults
- **Invalid JSON**: Skip and try next extraction method
- **Unknown variables**: Warning message but continue processing
- **Permission errors**: Skip file-based detection
- **Git not available**: Skip git-based detection methods

## Performance Considerations

- **Caching**: Variable values are computed once per verification run
- **File I/O**: Minimized by checking file existence before reading
- **Regex optimization**: Use efficient patterns for extraction
- **Fallback speed**: Quick defaults when detection fails

These utilities ensure that verification blocks can be written with template variables that are automatically substituted with appropriate project-specific values during verification execution.

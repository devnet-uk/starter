# devnet Embedded Verification Framework

## Overview

devnet leverages the Engineering OS embedded verification framework to ensure quality gates are correctly applied throughout development. This system provides deterministic quality assurance without rigid file copying.

## Verification-Driven Implementation Process

### Enhanced Engineering OS Integration

```bash
# When Engineering OS detects keywords like:
# - "Enhanced Quality Gates"  
# - "devnet 98% coverage"
# - "greenfield" + "Development Environment Configuration"

# Enhanced Process:
# 1. Consults: local-quality.md, testing-strategy.md, git-workflow.md
# 2. Extracts verification templates from standards
# 3. Generates project-specific verification tests (98% for devnet)
# 4. Implements configuration to pass verification tests
# 5. Executes verification before task completion
# 6. Reports: ✅ All verifications passed OR ❌ Failures with details
```

## Enhanced Command Workflow with Verification

```bash
1. /create-spec "Feature with Enhanced Quality Gates..."
   # → Parses requirements: coverage %, commit scopes, etc.
   # → Generates verification test suite from standards
   
2. /create-tasks
   # → Generates TDD tasks + implementation + verification tasks
   
3. /execute-tasks 
   # → Implements configuration
   # → Runs verification tests (must pass)
   # → Reports verification results
```

## Variable Substitution Patterns for devnet

### Project Configuration Variables
```bash
${PROJECT_COVERAGE} → 98 (devnet greenfield standard)
${PROJECT_TYPE} → greenfield (clean slate rebuild)
${PROJECT_NAME} → devnet (project identifier)
${PROJECT_PHASES} → phase-0:phase-7 (structured development)
```

### Domain Layer Variables (100% coverage requirement)
```bash
${DOMAIN_COVERAGE_THRESHOLD} → 100 (domain purity requirement)
```

### Infrastructure Variables
```bash
${NODE_VERSION} → 22 (LTS version requirement)
${PORT_WEB} → 4000 (devnet web application)
${PORT_API} → 4001 (devnet API server)
```

### Testing Variables
```bash
${PACKAGE_MANAGER} → pnpm (workspace management)
${TESTING_FRAMEWORK} → vitest (devnet choice)
```

## Verification System Architecture

1. **Embedding Phase**: Verification blocks are authored within standards files
2. **Loading Phase**: Standards are loaded through normal DSL conditional routing
3. **Extraction Phase**: verification-runner subagent scans loaded standards for verification blocks
4. **Execution Phase**: Extracted tests execute with variable substitution applied
5. **Reporting Phase**: Results aggregated with compliance status and actionable feedback

## Domain Layer Verification Example

### Expected Domain Verification Results (28 tests total)
```bash
# Execute domain layer verification
npm run test:domain -- --coverage

# verification-runner extracts and executes embedded verification blocks
# Variables automatically substituted: PROJECT_COVERAGE=100, PROJECT_TYPE=greenfield

# Expected embedded verification results:
# ✅ no_framework_imports_in_domain - Domain code free of framework dependencies
# ✅ no_database_methods_in_domain - No toDatabaseFormat/fromDatabase methods
# ✅ result_pattern_used_consistently - All operations return Result<T>
# ✅ domain_entities_extend_base_classes - Entity, ValueObject, DomainEvent inheritance
# ✅ guard_clauses_implemented - Defensive programming patterns verified
# ✅ test_coverage_100_percent - Domain layer coverage at 100%
# ✅ inmemory_repository_testing - Pure unit tests without mocks
# ✅ services_depend_on_interfaces - Domain services use interface dependencies only
# ✅ interfaces_in_domain_layer - Repository interfaces properly located in domain
# ✅ value_objects_immutable - Proper immutability and equality semantics
# ✅ domain_events_extend_base_class - All events extend DomainEvent
# ✅ mappers_only_in_infrastructure - Database mapping confined to infrastructure layer
# ✅ no_orm_query_methods_in_domain - No ORM-specific code in domain
# ✅ aggregate_root_event_handling - Proper aggregate boundaries and event handling
```

## Development Environment Verification Example

### Expected Enhanced Verification Output
```
╔══════════════════════════════════════════════════════════╗
║  Engineering OS Embedded Verification - devnet          ║
╚══════════════════════════════════════════════════════════╝

Loading standards via hierarchical dispatcher...
✅ Root dispatcher (@docs/standards/standards.md) → development category
✅ Loaded: development/local-quality.md with embedded verification blocks
✅ Loaded: development/testing-strategy.md with embedded verification blocks
✅ Loaded: development/git-workflow.md with embedded verification blocks
✅ Loaded: development/monorepo-setup.md with embedded verification blocks

Extracting embedded verification blocks from loaded standards...
Applying devnet-specific variable substitutions...

┌─ local-quality.md embedded verifications ────────────────┐
│ ✅ Husky installed: command -v husky                     │
│ ✅ Pre-commit hook: test -x .husky/pre-commit           │
│ ✅ Commit-msg hook: test -x .husky/commit-msg           │
│ ✅ Pre-push hook: test -x .husky/pre-push               │
│ ✅ Lint-staged config: test -f .lintstagedrc.json       │
│ ✅ BiomeJS config: biome check --apply-unsafe src/      │
└───────────────────────────────────────────────────────────┘

┌─ testing-strategy.md embedded verifications ─────────────┐
│ ✅ Vitest installed: test -f vitest.config.ts           │
│ ✅ Coverage at 98%: grep -q "threshold.*98"             │
│ ✅ Coverage reporters: grep -q "html.*json.*lcov"       │
│ ✅ Test scripts: npm run test --silent                  │
│ ✅ Coverage check: coverage threshold met (98%)         │
└───────────────────────────────────────────────────────────┘

╔══════════════════════════════════════════════════════════╗
║  🎯 ALL EMBEDDED VERIFICATIONS PASSED                    ║
║  devnet development environment configured (greenfield)  ║
║  Coverage enforcement: 98% (embedded verification)       ║
║  Commit validation: phase-0 through phase-7              ║
║  Context efficiency: <10% usage via hierarchical loading ║
╚══════════════════════════════════════════════════════════╝
```

## Key Design Principles

- **No Separate Files**: Verifications exist within standards, not as standalone files
- **Context Coupling**: Verifications are automatically available when their parent standard loads
- **Runtime Extraction**: verification-runner dynamically discovers verification blocks
- **Variable Substitution**: Tests adapt to specific project configurations
- **Graceful Degradation**: Optional tests don't block workflow on failure

## Benefits

- **Deterministic quality assurance** without rigid file copying
- **Context-aware verification** with project-specific requirements
- **Scalable pattern** for different project types and coverage thresholds
- **Token efficiency** through hierarchical DSL routing (<10% context usage)
- **Automatic compliance** with embedded verification execution

## Phase-Specific Verification Requirements

### Phase 0 - Infrastructure
- Git hooks functional and executable
- Development environment reproducible
- Coverage thresholds enforced (98%)
- Quality tools properly configured

### Phase 1 - Domain Layer  
- 100% test coverage achieved
- Zero framework dependencies
- No database methods in domain objects
- Repository interfaces in domain layer
- Value objects immutable and pure

### Phase 2 - Use Cases Layer
- 100% test coverage for business logic
- Proper orchestration patterns
- Interface segregation compliance
- Event sourcing implementation verified

### Phase 3 - Infrastructure Layer
- 95% test coverage minimum
- Repository implementations correct
- External service abstractions proper
- Database migrations working

### Phase 4 - Interface Adapters
- 100% API contract coverage
- Request/response validation working
- Security middleware functional
- Performance targets achieved

### Phase 5 - Presentation Layer
- 95% UI component coverage
- Accessibility compliance verified
- Performance metrics met
- Feature-Sliced Design compliance

### Phases 6-7 - Deployment & Documentation
- Production environment validated
- Performance targets achieved in production
- Documentation complete and accurate
- Monitoring and alerting operational

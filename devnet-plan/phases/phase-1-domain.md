# Phase 1: Core Domain Layer Implementation

## Prerequisites & Working Directory

⚠️ **Critical: This phase MUST be executed in the devnet repository**

```bash
# Switch to devnet repository
cd ~/Projects/devnet

# Verify correct workspace
pwd  # Should show: ~/Projects/devnet
ls packages/  # Should list: core, infrastructure, contracts, etc.
```

**Required Workspaces**:
<!-- @include-from: docs/EngineeringOS/dsl/includes/common-snippets.md#required-workspaces, hash: 4a5914590c5e5cc7097eeddfa7da51d7d275f34f0d38e78be17a0d77e9f94b00 -->
These repositories should be open in your editor workspace:

- Primary: `~/Projects/devnet/` (implementation & execution)
- Secondary: `~/Projects/devnet.clean_architecture/` (standards reference)
<!-- @end-include -->

**Workspace Verification**:
```bash
# Quick verification you're in the right place
[[ $(basename $(pwd)) == "devnet" ]] && echo "✅ Correct workspace" || echo "❌ Wrong directory - run: cd ~/Projects/devnet"
```

**If devnet repository doesn't exist**: Complete [Phase 0 - Infrastructure Setup](phase-0-infrastructure.md) first.

**Note**: Commands starting with "/" are Claude AI workflows, not shell scripts.

<!-- @include-from: docs/EngineeringOS/dsl/includes/common-snippets.md#workspace-checks, hash: 8cd810c9f2cfa00bdaa2c1eefd57680455604a990bf8eca80aaba27204124793 -->
Confirm you are in the correct repository and workspace.

```
pwd  # should end with your product repository name (for example, devnet)
ls packages/  # should list expected workspace packages (for example, core, infrastructure)
```

If the directory does not match, switch to the product repository before continuing.
<!-- @end-include -->

## Overview

<!-- phase-summary: anchor=overview; keep concise and current -->

**Phase**: Domain Layer (Clean Architecture Core)  
**Coverage Requirement**: 100% (devnet greenfield standard)  
**Verification Tests**: 28 embedded tests  
**Next Phase**: Use Cases & Business Logic  

## Command Notation

Commands in this document use the following notation:
- `claude` code blocks = Commands for Claude Code to execute
- `bash` code blocks = Shell commands to run in terminal  
- "Claude:" prefix = Direct instruction for Claude to execute the following command

## Implementation Steps

### Phase 1 Green (Acceptance)

<!-- @include-from: docs/EngineeringOS/dsl/includes/common-snippets.md#verification-note, hash: 06a507e35e5f387b62627da1e7ca81c98750250cc34d9b736e56238630d35fc0 -->
Verification runs via `/execute-tasks` Step 6 using the verification runner in blocking mode by default.
- All tests marked as blocking must pass before completion.
- Do not run command-line samples for verification; they are illustrative only.
- Review Fix Commands from the report, apply changes, then re-run `/execute-tasks`.
<!-- @end-include -->

- All BLOCKING domain purity tests pass in one session (e.g., no framework imports, no DB methods in domain, Result<T> patterns, 100% coverage).
- See this file’s verification gates and the Clean Architecture standard for specifics.

### Step 1: Domain Entities Implementation (Enhanced with Embedded Verification)

#### Pre-Implementation Verification
```bash
# Verify clean starting state using embedded verification blocks from standards
# verification-runner will extract embedded blocks from loaded clean-architecture.md
# No external YAML files - all verification embedded in standards
```

#### Implementation Commands
```claude
# Create specification with embedded verification compliance requirements
Claude: /create-spec "Domain Entities with verified Clean Architecture compliance using embedded verification framework:

TASK ANALYSIS:
- Keywords: domain-entities, clean-architecture, devnet, greenfield, coverage-100
- DSL Navigation: Root → architecture → clean-architecture.md (embedded verification blocks)
- Variables: PROJECT_COVERAGE=100, DOMAIN_COVERAGE_THRESHOLD=100, PROJECT_TYPE=greenfield, PROJECT_NAME=devnet

STANDARDS CONSULTATION (Enhanced Hierarchical Approach):
1. context-fetcher loads @docs/standards/standards.md (root dispatcher)
2. Follows hierarchical routing to architecture category
3. Loads architecture/clean-architecture.md with embedded domain verification blocks
4. Loads development/testing-strategy.md with embedded testing verification blocks
5. Cache standards with embedded verification blocks for domain purity validation

ARCHITECTURE REQUIREMENTS:
- Extend Entity base class from '@/core/domain/shared/Entity'
- Use Result<T> pattern from '@/core/domain/shared/Result'
- Import patterns: NO framework dependencies (Drizzle/Hono/Express forbidden)
- Value objects extend '@/core/domain/shared/ValueObject' 
- Domain events extend '@/core/domain/shared/DomainEvent'

ENTITIES TO IMPLEMENT:
- User entity: authentication, profile management, subscription tracking
- Organization entity: membership logic, billing context, team management  
- AI Chat entity: conversation state, message validation, context limits
- Rich domain models with behavioral patterns (NOT anemic data structures)

TESTING REQUIREMENTS:
- Use InMemoryRepository pattern from embedded testing verification blocks
- 100% test coverage for all domain entities (devnet greenfield requirement)
- NO mocks needed - pure unit tests with in-memory implementations
- Test all business rules and state transitions

EMBEDDED VERIFICATION COMPLIANCE:
- verification-runner extracts embedded verification blocks from clean-architecture.md
- All operations return Result<T> for error handling (verified via embedded tests)
- Guard clauses for defensive programming (verified via embedded tests)
- NO console.log statements in domain code (verified via embedded tests)
- NO database mapping methods (verified via embedded tests: no_database_methods_in_domain)
- NO framework imports (verified via embedded tests: no_framework_imports_in_domain)

VARIABLE SUBSTITUTION:
- \${PROJECT_COVERAGE} → 100 (domain layer requires 100%)
- \${PROJECT_TYPE} → greenfield
- \${PROJECT_NAME} → devnet
- \${DOMAIN_COVERAGE_THRESHOLD} → 100"

# After spec review and approval
Claude: /create-tasks

# Execute implementation with embedded verification monitoring  
Claude: /execute-tasks
```

#### Post-Implementation Verification
```bash
# Verify domain layer purity using embedded verification blocks
npm run test:domain -- --coverage

# verification-runner extracts and executes embedded verification blocks
# from loaded clean-architecture.md and testing-strategy.md standards
# Variables automatically substituted: PROJECT_COVERAGE=100, PROJECT_TYPE=greenfield

# Expected embedded verification results:
# ✅ no_framework_imports_in_domain - Domain code free of framework dependencies
# ✅ no_database_methods_in_domain - No toDatabaseFormat/fromDatabase methods
# ✅ result_pattern_used_consistently - All operations return Result<T>
# ✅ domain_entities_extend_base_classes - Entity, ValueObject, DomainEvent inheritance
# ✅ guard_clauses_implemented - Defensive programming patterns verified
# ✅ test_coverage_100_percent - Domain layer coverage at 100%
# ✅ inmemory_repository_testing - Pure unit tests without mocks
```

#### Expected Deliverables
- User entity with business rules extending Entity base class
- Organization entity with membership logic using Result<T> pattern
- AI Chat entity with conversation management and domain events
- Rich domain models with behavior (not anemic data structures)
- **100% test coverage verified by embedded verification blocks from clean-architecture.md**
- **Zero framework dependencies confirmed by embedded verification tests**
- **Result pattern usage validated via embedded verification: result_pattern_used_consistently**
- **Domain purity enforced by embedded verification: no_database_methods_in_domain**
- **Base class compliance verified: domain_entities_extend_base_classes**

<!-- @include-from: docs/EngineeringOS/dsl/includes/common-snippets.md#commit-rules, hash: c04caa4894227bee0454c55860bc68bd15be12d504f0a978a58b37d49dbfbe30 -->
Use clear, conventional messages and push only when verification is green.

Guidelines
- Write a single, focused commit per logical unit of work.
- Use conventional commit prefixes where appropriate (for example, `feat:`, `fix:`, `docs:`).
- Include a short bullet list of notable changes in the body if needed.
<!-- @end-include -->

#### 🔄 Commit Point 2: Domain Entities Complete
```bash
git add .
git commit -m "feat(phase-1): implement domain entities with embedded verification compliance (step 1)

- User entity extending Entity base class with business rules  
- Organization entity with membership logic using Result<T> pattern
- AI Chat entity with conversation management and domain events
- Rich domain models with behavioral patterns (NOT anemic)
- 100% test coverage verified by embedded verification blocks from clean-architecture.md
- Zero framework dependencies confirmed by embedded verification tests
- Clean Architecture compliance: Entity, ValueObject, DomainEvent base classes verified
- InMemoryRepository testing pattern implemented via embedded testing verification
- Embedded verification framework: no_database_methods_in_domain PASSED
- Domain purity enforced: no_framework_imports_in_domain PASSED"

git push
```

### Step 2: Domain Services Implementation (Enhanced with Embedded Verification)

#### Implementation Commands
```claude
# Create specification with embedded verification for repository interface separation
Claude: /create-spec "Domain Services with Clean Architecture interface patterns using embedded verification:

TASK ANALYSIS:
- Keywords: domain-services, clean-architecture, repository-interfaces, devnet, greenfield, coverage-100
- DSL Navigation: Root → architecture → clean-architecture.md (embedded service verification blocks)
- Variables: PROJECT_COVERAGE=100, DOMAIN_COVERAGE_THRESHOLD=100, PROJECT_TYPE=greenfield, PROJECT_NAME=devnet

STANDARDS CONSULTATION (Enhanced Hierarchical Approach):
1. context-fetcher loads @docs/standards/standards.md (root dispatcher)
2. Follows hierarchical routing to architecture category
3. Loads architecture/clean-architecture.md with embedded domain service verification blocks
4. Loads development/testing-strategy.md with embedded interface testing verification blocks
5. Cache standards with embedded verification blocks for service interface compliance

ARCHITECTURE REQUIREMENTS:
- Domain services in packages/core/src/domain/services/
- Repository interfaces in packages/core/src/domain/interfaces/
- Use Result<T> pattern from '@/core/domain/shared/Result'
- NO direct database access (use interfaces only)
- Dependency injection of repository interfaces

SERVICES TO IMPLEMENT:
- PricingService: depends on IDiscountRepository, ITaxCalculator interfaces
- AuthorizationService: pure business rules, context-aware permissions
- SubscriptionService: business calculations, billing logic with Result<T>
- AI ConversationService: orchestrates conversation flow, usage tracking

REPOSITORY INTERFACES (Domain Layer):
- IUserRepository: save, findById, findByEmail methods
- IOrganizationRepository: save, findById, findByUser methods  
- IChatRepository: save, findByUser, findByOrganization methods
- IDiscountRepository: findActiveDiscountsForCustomer method
- ITaxCalculator: calculateTax method with location context

TESTING REQUIREMENTS:
- Use InMemoryRepository implementations from embedded testing verification blocks
- 100% test coverage for all domain services (devnet greenfield requirement)
- NO database mocks needed - use in-memory implementations
- Test business rule enforcement and cross-entity operations

EMBEDDED VERIFICATION COMPLIANCE:
- verification-runner extracts embedded verification blocks from clean-architecture.md
- All operations return Result<T> for error handling (verified via embedded tests)
- Services depend on interfaces, NOT implementations (verified: services_depend_on_interfaces)
- NO framework imports (verified: no_framework_imports_in_domain_services)
- NO console.log statements (verified: no_console_logs_in_domain)
- Repository interfaces in domain layer only (verified: interfaces_in_domain_layer)

VARIABLE SUBSTITUTION:
- \${PROJECT_COVERAGE} → 100 (domain services require 100%)
- \${PROJECT_TYPE} → greenfield
- \${PROJECT_NAME} → devnet
- \${DOMAIN_COVERAGE_THRESHOLD} → 100"

Claude: /create-tasks
Claude: /execute-tasks
```

#### Post-Implementation Verification
```bash
# Verify repository interface compliance using embedded verification blocks
npm run test:domain -- --coverage

# verification-runner extracts and executes embedded verification blocks
# from loaded clean-architecture.md and testing-strategy.md standards
# Variables automatically substituted: PROJECT_COVERAGE=100, PROJECT_TYPE=greenfield

# Expected embedded verification results:
# ✅ services_depend_on_interfaces - Domain services use interface dependencies only
# ✅ no_framework_imports_in_domain_services - Services free of framework dependencies
# ✅ interfaces_in_domain_layer - Repository interfaces properly located in domain
# ✅ result_pattern_in_services - All service operations return Result<T>
# ✅ inmemory_repository_testing - Pure unit tests with in-memory implementations
# ✅ test_coverage_100_percent - Domain services coverage at 100%
```

#### Expected Deliverables
- Authorization service with dual-context logic using repository interfaces
- Subscription management service with business rules and Result<T> pattern
- AI conversation orchestration service with usage tracking
- Cross-entity business rule enforcement through domain services
- **Repository interfaces defined in domain layer verified by embedded tests**
- **100% test coverage using InMemoryRepository pattern from embedded verification**
- **Zero direct database access confirmed by embedded verification: services_depend_on_interfaces**
- **Interface-only dependencies verified: interfaces_in_domain_layer**
- **Result pattern compliance verified: result_pattern_in_services**

#### 🔄 Commit Point 3: Domain Services Complete
```bash
git add .
git commit -m "feat(phase-1): implement domain services with embedded verification patterns (step 2)

- Authorization service with dual-context logic using repository interfaces
- Subscription management service with business rules and Result<T>
- AI conversation orchestration service with usage tracking
- Cross-entity business rule enforcement through domain services
- Repository interfaces defined in domain layer verified by embedded tests
- InMemoryRepository implementations via embedded testing verification (zero mocks)
- 100% test coverage verified by embedded verification blocks
- Embedded verification: services_depend_on_interfaces PASSED
- Embedded verification: interfaces_in_domain_layer PASSED
- Embedded verification: no_framework_imports_in_domain_services PASSED"

git push
```

### Step 3: Domain Events & Value Objects Implementation (Enhanced with Embedded Verification)

#### Implementation Commands
```claude
# Create specification with embedded verification for value object purity enforcement
Claude: /create-spec "Domain Events and Value Objects with embedded verification compliance:

TASK ANALYSIS:
- Keywords: domain-events, value-objects, aggregate-root, devnet, greenfield, coverage-100, no-database-methods
- DSL Navigation: Root → architecture → clean-architecture.md (embedded value object verification blocks)
- Variables: PROJECT_COVERAGE=100, DOMAIN_COVERAGE_THRESHOLD=100, PROJECT_TYPE=greenfield, PROJECT_NAME=devnet

STANDARDS CONSULTATION (Enhanced Hierarchical Approach):
1. context-fetcher loads @docs/standards/standards.md (root dispatcher)
2. Follows hierarchical routing to architecture category
3. Loads architecture/clean-architecture.md with embedded value object and event verification blocks
4. Loads development/testing-strategy.md with embedded aggregate testing verification blocks
5. Cache standards with embedded verification blocks for value object purity validation

ARCHITECTURE REQUIREMENTS:
- Value objects extend '@/core/domain/shared/ValueObject' base class
- Domain events extend '@/core/domain/shared/DomainEvent' base class
- AggregateRoot from '@/core/domain/shared/AggregateRoot' for event handling
- Use Result<T> pattern for value object creation and validation
- Guard clauses from '@/core/domain/shared/Guard' for defensive programming

VALUE OBJECTS TO IMPLEMENT:
- Email: business validation, NO database methods (verified by embedded tests)
- Money: currency handling, arithmetic operations, immutable design
- UserId, OrganizationId, ChatId: strongly-typed identifiers
- SubscriptionPeriod: billing period logic with business rules
- Credits, Usage: resource tracking with validation rules
- Address: contact information with geographic validation

DOMAIN EVENTS TO IMPLEMENT:
- UserRegisteredEvent: user signup with email confirmation
- OrganizationCreatedEvent: team formation with initial setup
- ChatStartedEvent: conversation initialization
- SubscriptionChangedEvent: billing tier modifications
- CreditsConsumedEvent: usage tracking for AI services

AGGREGATE ROOT PATTERNS:
- User aggregate: manages authentication, profile, subscriptions
- Organization aggregate: handles membership, billing, team management
- Chat aggregate: conversation lifecycle, message validation

EMBEDDED VERIFICATION COMPLIANCE:
- verification-runner extracts embedded verification blocks from clean-architecture.md
- NO database mapping methods in value objects (verified: no_value_object_database_methods)
- NO console.log statements in domain events (verified: no_console_logs_in_domain_events)
- Value objects immutable with proper equality (verified: value_objects_immutable)
- Events extend DomainEvent base class (verified: domain_events_extend_base_class)
- Guard clauses for validation (verified: guard_clauses_implemented)
- Mappers only in infrastructure layer (verified: mappers_only_in_infrastructure)

VARIABLE SUBSTITUTION:
- \${PROJECT_COVERAGE} → 100 (domain layer requires 100%)
- \${PROJECT_TYPE} → greenfield
- \${PROJECT_NAME} → devnet
- \${DOMAIN_COVERAGE_THRESHOLD} → 100"

Claude: /create-tasks
Claude: /execute-tasks
```

#### Post-Implementation Verification
```bash
# Run comprehensive embedded verification for domain layer (25+ embedded tests)
npm run test:domain -- --coverage

# verification-runner extracts and executes embedded verification blocks
# from loaded clean-architecture.md and testing-strategy.md standards
# Variables automatically substituted: PROJECT_COVERAGE=100, PROJECT_TYPE=greenfield

# Expected embedded verification results:
# ✅ no_value_object_database_methods - No dbType/dbSchema methods in value objects
# ✅ no_entity_database_methods - No toDatabaseFormat methods in entities
# ✅ mappers_only_in_infrastructure - Database mapping confined to infrastructure layer
# ✅ value_objects_immutable - Proper immutability and equality semantics
# ✅ domain_events_extend_base_class - All events extend DomainEvent
# ✅ no_console_logs_in_domain_events - No side effects in events
# ✅ guard_clauses_implemented - Defensive programming patterns verified
# ✅ aggregate_root_event_handling - Proper aggregate boundaries and event handling
```

#### Expected Deliverables
- Domain event system extending DomainEvent base class
- Value objects for type safety (Email, Money, UserId) with NO database methods
- Aggregate root patterns with proper event handling boundaries
- Domain validation rules using Guard clauses and Result<T>
- Event sourcing foundations with AggregateRoot base class
- **Zero database mapping methods verified by embedded verification: no_value_object_database_methods**
- **Value object purity enforced by embedded verification: value_objects_immutable**
- **Event handling verified via embedded tests: no_console_logs_in_domain_events**
- **Aggregate boundaries verified: aggregate_root_event_handling**
- **Infrastructure mapping separation verified: mappers_only_in_infrastructure**

#### 🔄 Commit Point 4: Domain Layer Complete
```bash
git add .
git commit -m "feat(phase-1): complete domain layer with embedded verification compliance (step 3)

- Domain event system extending DomainEvent base class (NO side effects)
- Value objects for type safety with NO database methods (Email, Money, UserId)
- Aggregate root patterns with proper event handling boundaries  
- Domain validation rules using Guard clauses and Result<T> pattern
- Event sourcing foundations with AggregateRoot base class
- EMBEDDED VERIFICATION: no_value_object_database_methods PASSED
- EMBEDDED VERIFICATION: value_objects_immutable PASSED
- EMBEDDED VERIFICATION: no_console_logs_in_domain_events PASSED
- EMBEDDED VERIFICATION: aggregate_root_event_handling PASSED
- EMBEDDED VERIFICATION: mappers_only_in_infrastructure PASSED
- EMBEDDED VERIFICATION: 25+ embedded verification tests PASSED (100% compliance)
- EMBEDDED VERIFICATION: 100% test coverage via embedded verification blocks"

git push
git tag -a "v0.1.0-domain-verified" -m "Domain layer complete - 100% Clean Architecture compliance via embedded verification"
git push --tags
```

## Phase Completion & Transition

### 🔄 Context Clear Point: Domain Layer Complete
**Rationale**: Domain patterns complete, moving to business orchestration

#### Checkpoint Update Template
```bash
# Workspace verification before Phase 1 → Phase 2 transition
echo "=== Phase 1 → Phase 2 Transition: Workspace Verification ==="

# Critical: Verify we're in devnet repository
[[ $(basename $(pwd)) == "devnet" ]] && echo "✅ Correct workspace" || (echo "❌ Wrong directory - must be in ~/Projects/devnet" && exit 1)

# Verify devnet repository structure exists
[[ -d "packages/core" ]] && echo "✅ devnet structure verified" || (echo "❌ devnet packages not found" && exit 1)

# Verify domain implementation exists (example check)
[[ -d "packages/core/src/domain" ]] && echo "✅ Domain implementation verified" || echo "⚠️ Domain files may be incomplete"

# Update checkpoint files before Phase 1 → Phase 2 transition
echo "Updating checkpoint files before Phase 1 → Phase 2 transition..."

# Update DEVNET-CHECKPOINT.txt
cat > DEVNET-CHECKPOINT.txt << EOF
LAST_COMPLETED: Phase 1, Step 3 - Domain Events & Value Objects Implementation
NEXT_ACTION: Start Phase 2, Step 1 - Authentication & Core Use Cases Implementation
CURRENT_FILE: devnet-plan/phases/phase-2-use-cases.md
WORKING_DIRECTORY: ~/Projects/devnet/ (devnet implementation repo)
STANDARDS_DIRECTORY: ~/Projects/devnet.clean_architecture/ (Engineering OS standards)
GIT_TAG: v0.1.0-domain-verified
COVERAGE: Domain 100%, Overall 25% (domain complete, 28 verification tests passed)
NOTE: Domain layer complete with 100% Clean Architecture compliance. Next: Use cases layer. MUST remain in devnet repository.
EOF

# Update DEVNET-PROGRESS.md - mark Phase 1 steps 1-3 as [x] completed
# (Manual update of checkboxes in visual tracker)

# Commit checkpoint updates
git add DEVNET-PROGRESS.md DEVNET-CHECKPOINT.txt
git commit -m "chore: update checkpoint files - Phase 1 complete"
```

```claude
# Reminder: clear context (do not execute)
Claude: Reminder — please clear your context by typing `/clear` when ready. Do not execute automatically.
```

## Next Phase

**Phase 2**: Use Cases & Business Logic  
**Location**: `devnet-plan/phases/phase-2-use-cases.md`  
**Focus**: Authentication, Organization Management, AI Chat Use Cases  
**Coverage Target**: 100% (use cases layer)  

## Key Success Metrics

- ✅ **Domain Purity Score**: 100% (28+ embedded verification tests passed)
- ✅ **Test Coverage**: 100% domain layer coverage achieved
- ✅ **Architecture Compliance**: Zero framework dependencies in domain
- ✅ **Clean Architecture**: All entities/value objects/events follow proper patterns
- ✅ **Repository Interfaces**: All defined in domain layer, implementations in infrastructure

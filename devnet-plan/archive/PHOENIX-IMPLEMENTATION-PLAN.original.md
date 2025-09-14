# Phoenix Rebuild - Master Implementation Plan

## Executive Summary

This document provides a comprehensive implementation plan for the complete Phoenix rebuild of DevNet Limited's SaaS Application Template. This is a **greenfield rebuild** implementing perfect Clean Architecture principles in a separate repository.

### Project Objectives
- **Primary Goal**: Complete Clean Architecture implementation with 10/10 compliance
- **AI-Driven Execution**: Full implementation by Claude Code and subagents via Engineering OS
- **Quality Standards**: 100% compliance - comprehensive test coverage, type-safe end-to-end
- **Performance**: Improved architecture and optimized implementation (unmeasured baseline)
- **Timeline**: AI-paced execution across 7 structured phases via Engineering OS workflows

### Key Principles
- **Clean Architecture**: Domain-centric design with proper dependency inversion
- **Domain-Driven Design**: Rich domain models with business behavior
- **Contract-Driven Development**: Type-safe APIs with Zod schemas
- **Engineering OS Integration**: Systematic use of DSL framework throughout

---

## Context & Background

### Current System Analysis
The legacy DevNet system has **436 identified features** requiring migration, documented through comprehensive analysis:

**Supporting Analysis Documentation:**
- **Feature Inventory**: `/extraction-results/MIGRATION_PLAN_SUMMARY.md` (line 16: "436 features extracted")
- **Business Logic Analysis**: `/extraction-results/phase3/manual-extraction.json` - Complex workflows and business rules
- **Architectural Assessment**: `/extraction-results/phase0/architecture-analysis.json` - Current system evaluation
- **Domain Analysis**: `/extraction-results/phase2/domain-analysis.json` - Entity and use case mapping

**Key System Components Identified:**
- Complex authentication and organization management
- AI chat functionality with streaming responses  
- Multi-tenant architecture with role-based access
- Payment integration and subscription management
- Comprehensive admin and user interfaces

### Rebuild Strategy: Phoenix Rebuild
**Why Phoenix Rebuild was chosen:**
- Current architecture violates Clean Architecture principles
- Tight coupling between layers prevents proper testing
- Framework dependencies leak into business logic
- Technical debt accumulated over multiple iterations
- **Fresh start approach** eliminates migration complexity

### Engineering OS Framework Integration
This plan leverages the Engineering OS DSL system throughout:
- **Standards DSL**: Hierarchical guidance loading from `/docs/standards/`
- **Instructions DSL**: Workflow automation via `.claude/commands/`
- **Context Management**: Surgical information loading to optimize token usage

---

## Technical Architecture

### Clean Architecture Layers

```
┌─────────────────────────────────────────────┐
│            Presentation Layer               │
│  Next.js 15.5 with Feature-Sliced Design  │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│           Interface Adapters                │
│    HonoJS Controllers + Type-safe APIs     │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│             Use Cases Layer                 │
│      Business Logic & Orchestration        │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│              Domain Layer                   │
│    Entities, Services, Value Objects       │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│           Infrastructure Layer              │
│  Database, External APIs, File System      │
└─────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Frontend** | Next.js | 15.5+ |
| **API** | HonoJS | 4.9.4+ |
| **Database** | PostgreSQL + Drizzle ORM | 17.6 + 0.44.4+ |
| **Auth** | Better-Auth | 1.3.7+ |
| **Validation** | Zod | 4.1+ |
| **State Management** | TanStack Query + Zustand | 5.85+ + 5.0+ |
| **Styling** | TailwindCSS | 4.1+ |
| **Testing** | Vitest + Playwright | Latest |
| **Build** | Turborepo + pnpm | Latest |
| **Quality** | BiomeJS | 2.2.2+ |

### Monorepo Structure

```
devnet-phoenix/
├── apps/
│   ├── web/                    # Next.js app (FSD)
│   └── api/                    # HonoJS API server
├── packages/
│   ├── core/
│   │   ├── domain/             # Domain layer
│   │   ├── use-cases/          # Use cases layer  
│   │   └── interfaces/         # Port definitions
│   ├── infrastructure/
│   │   ├── database/           # Drizzle repositories
│   │   ├── services/           # External services
│   │   └── config/             # Configuration
│   ├── contracts/              # API contracts (Zod)
│   ├── ui/                     # Shared UI components
│   └── auth/                   # Authentication logic
├── docs/
│   ├── EngineeringOS/          # Framework docs
│   ├── standards/              # Engineering standards
│   └── product/                # Product specifications
└── tooling/                    # Build configurations
```

---

## Repository Strategy

### GitHub Repository Setup
- **Repository**: https://github.com/devnet-uk/devnet-phoenix.git ✅
- **Status**: Created and ready for initial push
- **Approach**: Complete separation from legacy codebase

### Development Environment Configuration

#### Port Allocation
- **Legacy System**: http://localhost:3000 (current DevNet)
- **Phoenix System**: http://localhost:4000 (new Phoenix)
- **Phoenix API**: http://localhost:4001
- **Database**: PostgreSQL on 5432 (separate schemas)

#### Environment Separation
```bash
# Phoenix .env.local
NEXT_PUBLIC_APP_URL=http://localhost:4000
API_URL=http://localhost:4001
DATABASE_URL=postgresql://...?schema=phoenix

# Legacy .env.local (unchanged)
NEXT_PUBLIC_APP_URL=http://localhost:3000
API_URL=http://localhost:3001
DATABASE_URL=postgresql://...?schema=public
```

---

## Complete Phase-by-Phase Implementation

### Phase 0: Infrastructure & Project Setup (5 Steps)

#### Objectives
- Create Phoenix repository structure using Engineering OS
- Configure monorepo workspace following standards
- Setup Engineering OS framework integration
- Establish development environment with proper tooling

#### Implementation Steps

**Step 1: Repository Infrastructure Specification**
```bash
# Execute from current directory: ~/Projects/devnet.clean_architecture/
/create-spec "Phoenix Repository Infrastructure - Create separate greenfield repository at ~/Projects/devnet-phoenix with git initialization, GitHub remote connection, and proper directory structure"

# Review generated specification
/create-tasks

# Execute repository creation
/execute-tasks
```

**🚨 Critical: Directory Context Switch**

After Step 1 completion, **you must switch to the new Phoenix repository context**:

**Option A (Recommended)**: Start new Claude Code session:
```bash
# In terminal:
cd ~/Projects/devnet-phoenix
claude-code
```

**Option B**: Add workspace to current session:
```bash
# Add Phoenix directory to Claude Code workspace
# Then navigate context to Phoenix directory
```

**Step 2: Monorepo Architecture Specification**
```bash
# Now operating in ~/Projects/devnet-phoenix/ context
/create-spec "Monorepo Setup - pnpm workspaces configuration following @docs/standards/development/monorepo-setup.md with Engineering OS framework migration from legacy repository"

# This will automatically consult:
# - @docs/standards/development/monorepo-setup.md
# - @docs/standards/development/local-environment.md

/create-tasks
/execute-tasks
```

**Step 3: Core Packages Architecture Specification**
```bash
/create-spec "Core Package Structure - Clean Architecture packages (domain, use-cases, infrastructure, contracts, UI, auth) following DDD principles and proper dependency direction"

# This will consult:
# - @docs/standards/architecture/clean-architecture.md
# - @docs/standards/architecture/domain-driven-design.md

/create-tasks
/execute-tasks
```

**Step 4: Development Environment Specification**
```bash
/create-spec "Development Environment Configuration for Phoenix greenfield project implementing comprehensive quality gates with embedded Engineering OS verification:

TASK ANALYSIS:
- Keywords: development-environment, testing, git-hooks, quality-gates, phoenix, greenfield, coverage-98
- DSL Navigation: Root → development → [local-quality, testing-strategy, git-workflow, monorepo-setup]
- Variables: PROJECT_COVERAGE=98, PROJECT_TYPE=greenfield, PROJECT_NAME=phoenix, PROJECT_PHASES=phase-0:phase-7

STANDARDS CONSULTATION (Enhanced Hierarchical Approach):
1. context-fetcher loads @docs/standards/standards.md (root dispatcher)
2. Follows hierarchical routing to development category dispatcher
3. Loads standards with embedded verification blocks:
   - development/local-quality.md (git hooks, linting, formatting)
   - development/testing-strategy.md (coverage thresholds, test configuration)
   - development/git-workflow.md (commit conventions, branch policies)
   - development/monorepo-setup.md (workspace configuration)
4. Standards cached with embedded verification blocks in session context

IMPLEMENTATION REQUIREMENTS:
Testing Infrastructure:
- Vitest configuration with 98% coverage threshold (Phoenix greenfield standard)
- Coverage reporters: html, json, text, lcov for CI/CD integration
- Test scripts: test, test:watch, test:coverage, coverage:check
- Mutation testing preparation (Stryker configuration)

Git Hooks Configuration (Husky):
- .husky/pre-commit: lint-staged for incremental validation
- .husky/commit-msg: commitlint with phase-based scopes (phase-0 through phase-7)
- .husky/pre-push: coverage check + type validation + build verification
- .husky/post-merge: automatic pnpm install on package-lock changes

Code Quality Tools:
- BiomeJS with strict formatting and linting rules
- TypeScript tsconfig.json with all strict flags enabled
- Bundle size tracking via size-limit configuration
- Import sorting and unused code detection

Environment Configuration:
- .nvmrc locked to Node v22 LTS
- pnpm-workspace.yaml for monorepo packages
- turbo.json with optimized pipeline definitions
- .env.example with Phoenix ports (NEXT_PUBLIC_APP_URL=http://localhost:4000, API_URL=http://localhost:4001)

EMBEDDED VERIFICATION EXECUTION (Enhanced Framework):
1. verification-runner extracts embedded verification blocks from loaded standards
2. Applies Phoenix-specific variable substitutions:
   - ${PROJECT_COVERAGE} → 98
   - ${PROJECT_TYPE} → greenfield
   - ${PROJECT_NAME} → phoenix
   - ${NODE_VERSION} → 22
   - ${PORT_WEB} → 4000
   - ${PORT_API} → 4001
3. Executes embedded verification tests from standards files
4. Reports compliance with actionable error messages
5. Blocks task completion if any critical embedded test fails

SUCCESS CRITERIA:
- All embedded verification blocks pass from loaded standards
- Git hooks executable and functional (verified via embedded tests)
- Coverage threshold enforced at 98% (greenfield standard)
- Commit validation working with phase-based scopes
- Development environment fully reproducible
- Zero manual configuration required"

# Enhanced Engineering OS Process Flow:
# Step 1: Task Analysis & Variable Extraction (enhanced keywords)
# Step 2: Hierarchical Standards Loading (context-fetcher → root → category → standards)
# Step 3: Embedded Verification Block Caching (verification blocks cached with standards)
# Step 4: Implementation Generation with Phoenix values
# Step 5: Embedded Verification Execution (verification-runner on cached blocks)
# Step 6: Compliance Confirmation & Progress Enablement

# Expected Enhanced Verification Output:
# ╔══════════════════════════════════════════════════════════╗
# ║  Engineering OS Embedded Verification - Phoenix          ║
# ╚══════════════════════════════════════════════════════════╝
# 
# Loading standards via hierarchical dispatcher...
# ✅ Root dispatcher (@docs/standards/standards.md) → development category
# ✅ Loaded: development/local-quality.md with embedded verification blocks
# ✅ Loaded: development/testing-strategy.md with embedded verification blocks
# ✅ Loaded: development/git-workflow.md with embedded verification blocks
# ✅ Loaded: development/monorepo-setup.md with embedded verification blocks
# 
# Extracting embedded verification blocks from loaded standards...
# Applying Phoenix-specific variable substitutions...
# 
# ┌─ local-quality.md embedded verifications ────────────────┐
# │ ✅ Husky installed: command -v husky                     │
# │ ✅ Pre-commit hook: test -x .husky/pre-commit           │
# │ ✅ Commit-msg hook: test -x .husky/commit-msg           │
# │ ✅ Pre-push hook: test -x .husky/pre-push               │
# │ ✅ Lint-staged config: test -f .lintstagedrc.json       │
# │ ✅ BiomeJS config: biome check --apply-unsafe src/      │
# └───────────────────────────────────────────────────────────┘
# 
# ┌─ testing-strategy.md embedded verifications ─────────────┐
# │ ✅ Vitest installed: test -f vitest.config.ts           │
# │ ✅ Coverage at 98%: grep -q "threshold.*98"             │
# │ ✅ Coverage reporters: grep -q "html.*json.*lcov"       │
# │ ✅ Test scripts: npm run test --silent                  │
# │ ✅ Coverage check: coverage threshold met (98%)         │
# └───────────────────────────────────────────────────────────┘
# 
# ┌─ git-workflow.md embedded verifications ─────────────────┐
# │ ✅ Commitlint config: test -f commitlint.config.js      │
# │ ✅ Phase scopes: grep -q "phase-[0-7]"                  │
# │ ✅ Conventional format: commitlint validation passed    │
# │ ✅ Branch policies: git workflow configuration valid    │
# └───────────────────────────────────────────────────────────┘
# 
# ┌─ monorepo-setup.md embedded verifications ───────────────┐
# │ ✅ PNPM workspace: test -f pnpm-workspace.yaml          │
# │ ✅ Turborepo config: test -f turbo.json                 │
# │ ✅ Node version: grep -q "22" .nvmrc                    │
# │ ✅ Env template: test -f .env.example                   │
# │ ✅ Phoenix ports: grep -q "4000.*4001" .env.example     │
# └───────────────────────────────────────────────────────────┘
# 
# ╔══════════════════════════════════════════════════════════╗
# ║  🎯 ALL EMBEDDED VERIFICATIONS PASSED                    ║
# ║  Phoenix development environment configured (greenfield) ║
# ║  Coverage enforcement: 98% (embedded verification)       ║
# ║  Commit validation: phase-0 through phase-7              ║
# ║  Context efficiency: <10% usage via hierarchical loading ║
# ╚══════════════════════════════════════════════════════════╝

/create-tasks
/execute-tasks
```

**Step 5: Project Documentation Specification**
```bash
/create-spec "Phoenix Project Documentation - Comprehensive project documentation implementing embedded verification framework integration:

TASK ANALYSIS:
- Keywords: documentation, claude-md, project-context, phoenix, greenfield, engineering-os, embedded-verification
- DSL Navigation: Root → development → documentation.md (enhanced patterns)
- Variables: PROJECT_NAME=phoenix, PROJECT_COVERAGE=98, PROJECT_TYPE=greenfield, PROJECT_PORTS=4000:4001, PROJECT_PHASES=phase-0:phase-7

STANDARDS CONSULTATION (Enhanced Hierarchical Approach):
1. context-fetcher loads @docs/standards/standards.md (root dispatcher)
2. Follows hierarchical routing to development category for documentation patterns
3. Loads standards with embedded verification examples:
   - development/documentation.md (patterns, structures, AI context)
   - tech-stack.md (authoritative dependency versions)
   - architecture/clean-architecture.md (template patterns with embedded verification)
4. Cache documentation standards with embedded verification examples

ENHANCED DOCUMENTATION REQUIREMENTS:

1. CLAUDE.md (Root - Enhanced AI Assistant Context):
   Project Overview:
   - Phoenix greenfield rebuild replacing legacy system (436 features)
   - Clean Architecture 10/10 compliance objective with embedded verification framework
   - 98% test coverage requirement (greenfield standard via embedded verification)
   - Phase-based development approach (phase-0 through phase-7)
   - Engineering OS integration with embedded verification blocks
   
   Technical Configuration:
   - Development URLs (web: localhost:4000, api: localhost:4001)
   - Database: PostgreSQL with schema=phoenix
   - Tech stack versions from @docs/standards/tech-stack.md
   - Performance targets (page <2s, API <200ms, bundle <500KB)
   
   Enhanced Engineering OS Integration:
   - Command workflow patterns (/create-spec → /create-tasks → /execute-tasks)
   - Embedded verification requirements (verification-runner extracts blocks from standards)
   - Hierarchical DSL navigation patterns (Root → Category → Standard → Verification)
   - Standards hierarchy with embedded verification block locations
   - Variable substitution patterns (${PROJECT_COVERAGE}=98, ${PROJECT_TYPE}=greenfield)
   
   Architecture Overview:
   - Clean Architecture layers with dependency flow diagrams
   - Monorepo package structure (packages/core, packages/infrastructure, etc.)
   - Feature-Sliced Design patterns for frontend
   - Domain-Driven Design patterns with embedded verification examples
   
   Embedded Verification Framework Usage:
   - How standards contain embedded verification blocks (not external YAML)
   - verification-runner subagent extracts and executes embedded tests
   - Variable substitution examples for Phoenix-specific values
   - Context-efficient loading via hierarchical dispatcher routing
   
   Developer Quick Reference:
   - Common commands (pnpm dev:phoenix, pnpm test:coverage --threshold=98)
   - Git workflow with conventional commits and phase scopes
   - Testing approach with embedded verification requirements
   - Troubleshooting embedded verification and standards loading issues

2. README.md (Root - Enhanced Public Documentation):
   - Phoenix greenfield rebuild introduction with Engineering OS emphasis
   - Prerequisites (Node v22, pnpm, PostgreSQL, git)
   - Quick start installation with embedded verification validation
   - Development workflow overview with hierarchical standards loading
   - Architecture summary with embedded verification framework
   - Contributing guidelines with embedded verification gate requirements
   - Performance benchmarks and embedded verification targets

3. docs/ARCHITECTURE.md (Enhanced Technical Documentation):
   - Complete Clean Architecture implementation with verification integration
   - Layer responsibilities with embedded verification boundaries
   - Package structure with verification-aware import/export patterns
   - Data flow examples with embedded verification checkpoints
   - Embedded verification framework integration points and examples

4. docs/DEVELOPMENT.md (Enhanced Development Workflow):
   - Development environment setup with embedded verification validation
   - Quality gates using embedded verification framework
   - Testing strategy with embedded verification integration (unit 100%, integration 95%, e2e 90%)
   - Debugging guide for embedded verification and standards loading issues
   - Performance profiling with embedded verification checkpoints

5. docs/MIGRATION.md (Enhanced Phoenix Rebuild Documentation):
   - Phoenix rebuild rationale with embedded verification advantages
   - Feature mapping table (436 features) with embedded verification status
   - Phase-by-phase progress tracking with verification gate completion
   - Rollback procedures with embedded verification state management
   - Success metrics validated through embedded verification framework

EMBEDDED VERIFICATION REQUIREMENTS:
- All documentation demonstrates embedded verification framework usage
- Code examples show hierarchical standards loading patterns
- Links reference embedded verification blocks in standards files
- Phoenix-specific context (98% coverage, greenfield) integrated throughout
- Engineering OS embedded verification patterns accurately documented
- Development setup includes embedded verification validation steps
- Variable substitution examples clearly documented

SUCCESS CRITERIA:
- New developers understand embedded verification framework in <30 minutes
- AI assistants have complete Phoenix context with embedded verification awareness
- 98% coverage requirement integrated with embedded verification examples
- Hierarchical DSL routing patterns clearly documented
- Embedded verification block locations and usage patterns documented
- Architecture decisions justified with embedded verification compliance"

# Enhanced Documentation Standards Integration:
# - Leverages embedded verification patterns from development/documentation.md
# - References authoritative tech-stack.md for current versions
# - Includes Phoenix-specific embedded verification examples
# - Provides comprehensive embedded verification framework context
# - Demonstrates hierarchical DSL routing in documentation patterns
# 
# Expected Enhanced Output Structure:
# CLAUDE.md - Complete AI context (Phoenix rebuild, embedded verification, 98% coverage)
# README.md - Public setup with embedded verification awareness
# docs/ARCHITECTURE.md - Technical implementation with verification integration
# docs/DEVELOPMENT.md - Enhanced workflow with embedded verification framework  
# docs/MIGRATION.md - Phoenix rebuild tracking with verification gates

/create-tasks
/execute-tasks
```

#### 🔄 Commit Point 1: Project Infrastructure
```bash
git add .
git commit -m "feat(phase-0): complete infrastructure setup (steps 1-5)

- Step 1: Repository Infrastructure Specification
- Step 2: Monorepo Architecture Specification  
- Step 3: Core Packages Architecture Specification
- Step 4: Development Environment Specification
- Step 5: Project Documentation Specification"

git push -u origin main

# 🔄 CONTEXT CLEAR POINT: Phase 0 Infrastructure Complete
# Rationale: Setup patterns complete, moving to domain modeling

# Update checkpoint files before context clear
echo "Updating checkpoint files before Phase 0 → Phase 1 transition..."

# Update PHOENIX-CHECKPOINT.txt
cat > PHOENIX-CHECKPOINT.txt << EOF
LAST_COMPLETED: Phase 0, Step 5 - Project Documentation Specification
NEXT_ACTION: Start Phase 1, Step 1 - Domain Entities Implementation
GIT_TAG: v0.0.1-infrastructure
COVERAGE: Overall 0% (infrastructure only, no code yet)
NOTE: Infrastructure complete. Next: Domain layer with 100% coverage requirement
EOF

# Update PHOENIX-PROGRESS.md - mark Phase 0 steps 1-5 as [x] completed
# (Manual update of checkboxes in visual tracker)

# Commit checkpoint updates
git add PHOENIX-PROGRESS.md PHOENIX-CHECKPOINT.txt
git commit -m "chore: update checkpoint files - Phase 0 complete"

# Now execute context clear
/clear
```

---

### Phase 1: Core Domain Layer (3 Steps)

#### Implementation Steps

**Step 1: Domain Entities Implementation (Enhanced with Embedded Verification)**

**Pre-Implementation Verification:**
```bash
# Verify clean starting state using embedded verification blocks from standards
# verification-runner will extract embedded blocks from loaded clean-architecture.md
# No external YAML files - all verification embedded in standards
```

**Implementation Commands:**
```bash
# Create specification with embedded verification compliance requirements
/create-spec "Domain Entities with verified Clean Architecture compliance using embedded verification framework:

TASK ANALYSIS:
- Keywords: domain-entities, clean-architecture, phoenix, greenfield, coverage-100
- DSL Navigation: Root → architecture → clean-architecture.md (embedded verification blocks)
- Variables: PROJECT_COVERAGE=100, DOMAIN_COVERAGE_THRESHOLD=100, PROJECT_TYPE=greenfield, PROJECT_NAME=phoenix

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
- 100% test coverage for all domain entities (Phoenix greenfield requirement)
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
- ${PROJECT_COVERAGE} → 100 (domain layer requires 100%)
- ${PROJECT_TYPE} → greenfield
- ${PROJECT_NAME} → phoenix
- ${DOMAIN_COVERAGE_THRESHOLD} → 100"

# After spec review and approval
/create-tasks

# Execute implementation with embedded verification monitoring  
/execute-tasks
```

**Post-Implementation Verification:**
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

**Expected Deliverables:**
- User entity with business rules extending Entity base class
- Organization entity with membership logic using Result<T> pattern
- AI Chat entity with conversation management and domain events
- Rich domain models with behavior (not anemic data structures)
- **100% test coverage verified by embedded verification blocks from clean-architecture.md**
- **Zero framework dependencies confirmed by embedded verification tests**
- **Result pattern usage validated via embedded verification: result_pattern_used_consistently**
- **Domain purity enforced by embedded verification: no_database_methods_in_domain**
- **Base class compliance verified: domain_entities_extend_base_classes**

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

**Step 2: Domain Services Implementation (Enhanced with Embedded Verification)**

**Implementation Commands:**
```bash
# Create specification with embedded verification for repository interface separation
/create-spec "Domain Services with Clean Architecture interface patterns using embedded verification:

TASK ANALYSIS:
- Keywords: domain-services, clean-architecture, repository-interfaces, phoenix, greenfield, coverage-100
- DSL Navigation: Root → architecture → clean-architecture.md (embedded service verification blocks)
- Variables: PROJECT_COVERAGE=100, DOMAIN_COVERAGE_THRESHOLD=100, PROJECT_TYPE=greenfield, PROJECT_NAME=phoenix

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
- 100% test coverage for all domain services (Phoenix greenfield requirement)
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
- ${PROJECT_COVERAGE} → 100 (domain services require 100%)
- ${PROJECT_TYPE} → greenfield
- ${PROJECT_NAME} → phoenix
- ${DOMAIN_COVERAGE_THRESHOLD} → 100"

/create-tasks
/execute-tasks
```

**Post-Implementation Verification:**
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

**Expected Deliverables:**
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

**Step 3: Domain Events & Value Objects Implementation (Enhanced with Embedded Verification)**

**Implementation Commands:**
```bash
# Create specification with embedded verification for value object purity enforcement
/create-spec "Domain Events and Value Objects with embedded verification compliance:

TASK ANALYSIS:
- Keywords: domain-events, value-objects, aggregate-root, phoenix, greenfield, coverage-100, no-database-methods
- DSL Navigation: Root → architecture → clean-architecture.md (embedded value object verification blocks)
- Variables: PROJECT_COVERAGE=100, DOMAIN_COVERAGE_THRESHOLD=100, PROJECT_TYPE=greenfield, PROJECT_NAME=phoenix

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
- ${PROJECT_COVERAGE} → 100 (domain layer requires 100%)
- ${PROJECT_TYPE} → greenfield
- ${PROJECT_NAME} → phoenix
- ${DOMAIN_COVERAGE_THRESHOLD} → 100"

/create-tasks
/execute-tasks
```

**Post-Implementation Verification:**
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

**Expected Deliverables:**
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

# 🔄 CONTEXT CLEAR POINT: Domain Layer Complete
# Rationale: Domain patterns complete, moving to business orchestration

# Update checkpoint files before context clear
echo "Updating checkpoint files before Phase 1 → Phase 2 transition..."

# Update PHOENIX-CHECKPOINT.txt
cat > PHOENIX-CHECKPOINT.txt << EOF
LAST_COMPLETED: Phase 1, Step 3 - Domain Events & Value Objects Implementation
NEXT_ACTION: Start Phase 2, Step 1 - Authentication & Core Use Cases Implementation
GIT_TAG: v0.1.0-domain-verified
COVERAGE: Domain 100%, Overall 25% (domain complete, 28 verification tests passed)
NOTE: Domain layer complete with 100% Clean Architecture compliance. Next: Use cases layer
EOF

# Update PHOENIX-PROGRESS.md - mark Phase 1 steps 1-3 as [x] completed
# (Manual update of checkboxes in visual tracker)

# Commit checkpoint updates
git add PHOENIX-PROGRESS.md PHOENIX-CHECKPOINT.txt
git commit -m "chore: update checkpoint files - Phase 1 complete"

# Now execute context clear
/clear
```

---

## 🔐 Phase Gate 1: Domain Layer Verification Complete

**Required Before Phase 2:**
```bash
# Run comprehensive domain layer verification
npm run test:domain -- --coverage

# Execute domain layer verification using YAML configuration
npx verification-runner --config docs/EngineeringOS/dsl/verification/examples/domain-layer-verification.yaml

# Expected Domain Verification Results (28 tests total):
# ✅ ALL 28 domain verification tests PASS from domain-layer-verification.yaml
# ✅ 100% test coverage achieved for domain layer
# ✅ Zero framework dependencies detected (no_framework_imports_in_domain)
# ✅ No database methods in domain objects (no_value_object_database_methods)
# ✅ No entity database methods (no_entity_database_methods)
# ✅ Result<T> pattern used consistently (result_pattern_used_consistently)
# ✅ Base classes properly extended (domain_entities_extend_base_classes)
# ✅ Repository interfaces in domain layer (repository_interfaces_in_domain)
# ✅ Services depend on interfaces only (services_depend_on_interfaces)
# ✅ Value objects immutable (value_objects_extend_base_class)
# ✅ Domain events extend base class (domain_events_extend_base_class)
# ✅ Mappers only in infrastructure (mappers_only_in_infrastructure)
# ✅ No ORM query methods in domain (no_orm_query_methods_in_domain)
# ✅ No transaction methods in domain (no_transaction_methods_in_domain)
# ✅ No SQL keywords in domain (no_sql_keywords_in_domain)
# ✅ Domain utilities available (domain_utilities_available)
# ✅ Domain folder structure correct (domain_folder_structure_correct)
```

**Phase Gate Success Criteria:**
- [x] Domain entities extend base classes and use Result<T> (verified: domain_entities_extend_base_classes)
- [x] Repository interfaces defined in domain layer (verified: repository_interfaces_in_domain)
- [x] Value objects pure with no database methods (verified: no_value_object_database_methods)
- [x] Domain events extend DomainEvent base class (verified: domain_events_extend_base_class)
- [x] Zero console.log statements in domain code (verified: no_console_logs_in_production_domain)
- [x] InMemoryRepository testing implemented (verified: domain_tests_are_unit_tests)
- [x] 100% domain test coverage verified (verified: domain_layer_test_coverage)
- [x] Domain utilities available (verified: domain_utilities_available)
- [x] Domain folder structure correct (verified: domain_folder_structure_correct)
- [x] Clean Architecture compliance: 28/28 domain verification tests passing

**Referenced Standards:**
- `docs/standards/architecture/domain-utilities.md` - Result pattern and base classes implementation
- `docs/standards/architecture/mapper-pattern.md` - Infrastructure separation patterns
- `docs/standards/architecture/value-object-mapping.md` - Value object implementation patterns
- `docs/standards/architecture/architecture-validation.md` - Automated architecture testing
- `docs/EngineeringOS/dsl/verification/examples/domain-layer-verification.yaml` - Domain verification test suite

**Architecture Health Metrics (YAML Verification):**
- **Domain Purity Score**: 100% (verified: no_framework_imports_in_domain, no_database_imports_in_domain, no_http_imports_in_domain)
- **Test Coverage**: 100% (Phoenix requirement verified: domain_layer_test_coverage)
- **Result Pattern Usage**: 100% (verified: result_pattern_used_consistently)
- **Base Class Compliance**: 100% (verified: domain_entities_extend_base_classes, value_objects_extend_base_class, domain_events_extend_base_class)
- **Value Object Purity**: 100% (verified: no_value_object_database_methods, no_entity_database_methods)
- **Infrastructure Separation**: 100% (verified: mappers_only_in_infrastructure, no_orm_query_methods_in_domain)
- **Database Isolation**: 100% (verified: no_sql_keywords_in_domain, no_transaction_methods_in_domain, no_database_schema_methods_in_domain)
- **Code Quality**: 100% (verified: no_any_types_in_domain, no_console_logs_in_production_domain)
- **Architecture Structure**: 100% (verified: domain_folder_structure_correct, domain_utilities_available)

---

### Phase 2: Use Cases & Business Logic (3 Steps)

**Step 1: Authentication & Core Use Cases Implementation**
```bash
/create-spec "Authentication Use Cases with Enhanced Integration - Sign up, sign in, password reset, MFA, session management with proper error handling, security, audit logging, and notification systems following comprehensive standards:

ENHANCED STANDARDS CONSULTATION:
- authentication-patterns.md: Core auth flows and security patterns
- use-case-patterns.md: Clean Architecture use case implementation
- audit-logging-patterns.md: Event sourcing for auth events and compliance
- notification-patterns.md: Multi-channel auth notifications (email, SMS)
- caching-patterns.md: Session and rate limiting cache strategies

COMPREHENSIVE FEATURE SET:
Authentication Core:
- User registration with email/phone verification using notification patterns
- Multi-factor authentication with time-based tokens
- Secure password reset with audit trail logging
- Session management with Redis caching and security policies
- Social OAuth integration (Google, GitHub) with audit events

Enhanced Security & Compliance:
- Audit logging for all authentication events (login attempts, password changes, MFA setup)
- Rate limiting with Redis-based caching strategies
- Notification workflows for security events (login alerts, password changes)
- Compliance tracking (GDPR consent, data retention) with event sourcing
- Fraud detection patterns with background job processing

Background Processing Integration:
- Email verification via background job queue
- Failed login attempt monitoring and alerting
- Password breach monitoring with scheduled checks
- Account cleanup and maintenance jobs
- Security report generation with async processing

EXPECTED DELIVERABLES:
- Authentication use cases with comprehensive validation and Result<T> patterns
- Event sourcing implementation for all auth events (UserRegisteredEvent, LoginAttemptedEvent, etc.)
- Multi-channel notification system for auth flows (welcome emails, security alerts)
- Redis-based session management and rate limiting
- Background job integration for async auth processing
- 100% test coverage with comprehensive security testing scenarios"

/create-tasks
/execute-tasks
```

**Expected Deliverables:**
- User registration with email/phone verification and audit trail
- Multi-factor authentication with comprehensive security measures
- Password reset with event sourcing and notification workflows
- Session management with Redis caching and security policies
- OAuth integration with full audit logging
- Rate limiting and fraud detection with background processing
- **100% test coverage for all authentication use cases (Phoenix requirement)**

#### 🔄 Commit Point 5: Enhanced Auth Use Cases Complete
```bash
git add .
git commit -m "feat(phase-2): implement enhanced authentication use cases (step 1)

- User registration with email/phone verification and comprehensive audit trail
- Multi-factor authentication with time-based tokens and security measures
- Secure password reset with event sourcing and multi-channel notifications
- Session management with Redis caching and advanced security policies
- OAuth integration (Google, GitHub) with full audit logging
- Rate limiting and fraud detection with background job processing
- Event sourcing for all auth events ensuring compliance and forensic capability
- Multi-channel notification system for auth workflows
- 100% test coverage with security-focused testing scenarios"

git push
```

**Step 2: Organization Management & Billing Use Cases Implementation**
```bash
/create-spec "Organization Management Use Cases with Billing Integration - Create organizations, invite members, manage roles, comprehensive billing, subscription management, and audit compliance following enhanced standards:

ENHANCED STANDARDS CONSULTATION:
- multi-tenancy-patterns.md: Organization and role management patterns
- billing-patterns.md: Stripe integration and subscription management
- use-case-patterns.md: Clean Architecture use case implementation
- audit-logging-patterns.md: Organization and billing event tracking
- notification-patterns.md: Organization and billing notifications
- background-job-patterns.md: Async billing and invitation processing
- search-patterns.md: Organization member and billing history search

COMPREHENSIVE FEATURE SET:
Organization Management:
- Organization creation with billing setup and audit logging
- Member invitation system with email workflows and background processing
- Role-based access control with granular permissions and audit trails
- Team management with hierarchical roles and compliance tracking
- Organization settings with event sourcing for all changes

Billing & Subscription Integration:
- Stripe subscription management with webhook processing
- Plan upgrades/downgrades with proration and audit logging
- Invoice generation and payment processing with comprehensive tracking
- Usage-based billing for AI credits with real-time monitoring
- Billing history and analytics with search functionality
- Payment method management with secure storage and notifications

Enhanced Compliance & Processing:
- Audit logging for all organization and billing events
- Background processing for subscription renewals and notifications
- Search functionality for member management and billing history
- Notification workflows for billing events (payment success, failures, renewals)
- Compliance tracking for financial regulations and data protection
- Multi-level caching for organization data and billing information

EXPECTED DELIVERABLES:
- Organization CRUD operations with comprehensive validation and event sourcing
- Stripe billing integration with webhook handling and retry mechanisms
- Role-based permission system with audit trails and compliance features
- Member invitation workflows with email notifications and background processing
- Billing analytics and search functionality with performance optimization
- 100% test coverage including billing edge cases and webhook scenarios"

/create-tasks
/execute-tasks
```

**Expected Deliverables:**
- Organization creation and configuration with billing integration
- Member invitation system with comprehensive email workflows
- Role-based access control with granular permissions and audit trails
- Stripe subscription management with webhook processing
- Billing history and analytics with search functionality
- Multi-channel notifications for org and billing events
- **100% test coverage for organization and billing use cases (Phoenix requirement)**

#### 🔄 Commit Point 6: Enhanced Organization & Billing Use Cases Complete
```bash
git add .
git commit -m "feat(phase-2): implement organization management with billing integration (step 2)

- Organization creation with Stripe billing setup and comprehensive audit logging
- Member invitation system with email workflows and background job processing
- Role-based access control with granular permissions and compliance tracking
- Stripe subscription management with webhook processing and retry mechanisms
- Billing history analytics with search functionality and performance optimization
- Multi-channel notification workflows for organizational and billing events
- Event sourcing for all organization and billing changes ensuring audit compliance
- Background processing for subscription renewals and member management
- 100% test coverage including complex billing scenarios and webhook edge cases"

git push
```

**Step 3: AI Chat & Analytics Use Cases Implementation**
```bash
/create-spec "AI Chat Use Cases with Analytics & Performance - Create conversations, streaming responses, history management, token tracking, search functionality, and comprehensive analytics following enhanced standards:

ENHANCED STANDARDS CONSULTATION:
- streaming-patterns.md: Real-time chat and response streaming patterns
- use-case-patterns.md: Clean Architecture use case implementation
- search-patterns.md: Conversation search and indexing with Elasticsearch
- caching-patterns.md: Chat history and response caching strategies
- audit-logging-patterns.md: Chat analytics and usage tracking
- background-job-patterns.md: Async chat processing and analytics generation
- notification-patterns.md: Chat notifications and alerts

COMPREHENSIVE FEATURE SET:
AI Chat Core:
- Conversation creation and management with comprehensive state handling
- Streaming response handling with WebSocket connections and error recovery
- Message validation and content filtering with security measures
- Token usage tracking with billing integration and real-time monitoring
- Conversation persistence with optimized storage and retrieval patterns

Advanced Search & Analytics:
- Elasticsearch integration for full-text conversation search
- Faceted search with filters (date, participants, topics, message types)
- Chat analytics dashboard with usage patterns and performance metrics
- Conversation export functionality with multiple format support
- AI usage analytics with billing insights and optimization recommendations

Performance & Caching:
- Multi-level caching for chat history and frequent queries
- Redis-based real-time message caching with TTL optimization
- Conversation indexing with background job processing
- Performance monitoring for response times and system health
- Intelligent pre-loading of conversation context and history

Background Processing & Notifications:
- Async conversation indexing and search optimization
- Chat analytics generation with scheduled background jobs
- Notification workflows for chat events (mentions, direct messages)
- Conversation summarization with AI processing queues
- Usage report generation and delivery with email notifications

EXPECTED DELIVERABLES:
- AI chat conversation management with comprehensive state handling
- WebSocket streaming with error recovery and performance optimization
- Elasticsearch integration for powerful conversation search capabilities
- Multi-level caching strategies for optimal chat performance
- Background processing for analytics and search indexing
- Token tracking with real-time billing integration and usage analytics
- 100% test coverage including streaming edge cases and search functionality"

/create-tasks
/execute-tasks
```

**Expected Deliverables:**
- AI chat conversation management with streaming and state handling
- Elasticsearch-powered conversation search with faceted filtering
- Multi-level caching for optimal chat performance and user experience
- Token usage tracking with real-time billing integration
- Background processing for chat analytics and search indexing
- Multi-channel notifications for chat events and system alerts
- **100% test coverage for AI chat and analytics use cases (Phoenix requirement)**

#### 🔄 Commit Point 7: Enhanced Use Cases Layer Complete
```bash
git add .
git commit -m "feat(phase-2): complete enhanced use cases layer with comprehensive integration (step 3)

- AI chat conversation management with streaming response handling and state management
- Elasticsearch integration for powerful full-text conversation search with faceted filtering
- Multi-level caching strategies (Redis + in-memory) for optimal chat performance
- Token usage tracking with real-time billing integration and comprehensive usage analytics
- Background processing for conversation indexing, analytics generation, and search optimization
- Multi-channel notification workflows for chat events, mentions, and system alerts
- Event sourcing for all chat interactions ensuring complete audit trail and analytics capability
- WebSocket streaming with comprehensive error recovery and performance monitoring
- AI provider abstraction supporting multiple services with fallback mechanisms
- 100% test coverage including complex streaming edge cases and search functionality (Phoenix requirement verified)"

git push
git tag -a "v0.2.0-enhanced-use-cases" -m "Enhanced use cases layer complete - Business logic with comprehensive integration (billing, search, caching, notifications, audit)"
git push --tags

# 🔄 CONTEXT CLEAR POINT: Use Cases Layer Complete
# Rationale: Business logic complete, moving to external integrations

# Update checkpoint files before context clear
echo "Updating checkpoint files before Phase 2 → Phase 3 transition..."

# Update PHOENIX-CHECKPOINT.txt
cat > PHOENIX-CHECKPOINT.txt << EOF
LAST_COMPLETED: Phase 2, Step 3 - AI Chat & Analytics Use Cases Implementation
NEXT_ACTION: Start Phase 3, Step 1 - Database Infrastructure Implementation
GIT_TAG: v0.2.0-enhanced-use-cases
COVERAGE: Domain 100%, Use Cases 100%, Overall 50% (business logic complete)
NOTE: Use cases complete with comprehensive integration. Next: Infrastructure layer (95% coverage target)
EOF

# Update PHOENIX-PROGRESS.md - mark Phase 2 steps 1-3 as [x] completed
# (Manual update of checkboxes in visual tracker)

# Commit checkpoint updates
git add PHOENIX-PROGRESS.md PHOENIX-CHECKPOINT.txt
git commit -m "chore: update checkpoint files - Phase 2 complete"

# Now execute context clear
/clear
```

---

### Phase 3: Infrastructure Layer (3 Steps)

**Step 1: Database Infrastructure Implementation**
```bash
/create-spec "Database Infrastructure - PostgreSQL setup, Drizzle ORM repositories, migrations, connection management, and query optimization with verification of database connectivity and schema integrity"

# Expected verification output:
# ✅ Database connection established and validated
# ✅ Drizzle ORM configuration functional
# ✅ Migration system operational (up/down migrations work)
# ✅ Repository pattern correctly implemented
# ✅ Query optimization and indexing configured

/create-tasks
/execute-tasks
```

**Expected Deliverables:**
- PostgreSQL connection management with pooling
- Drizzle ORM configuration and schemas (following @docs/standards/stack-specific/drizzle-patterns.md)
- Repository implementations following Clean Architecture (implementing @docs/standards/architecture/infrastructure-patterns.md)
- Migration system with rollback capabilities (following @docs/standards/development/database-migrations.md patterns)
- Database performance optimization
- **95% test coverage for infrastructure layer (Phoenix requirement)**

#### 🔄 Commit Point 8: Database Layer Complete
```bash
git add .
git commit -m "feat(phase-3): implement database infrastructure (step 1)

- PostgreSQL connection management with pooling
- Drizzle ORM configuration and type-safe schemas
- Repository implementations following Clean Architecture
- Migration system with rollback capabilities
- Database query optimization and indexing"

git push
```

**Step 2: External Services Implementation**
```bash
/create-spec "External Services - OpenAI/Anthropic integration, Stripe payments, Email service, Analytics, and monitoring integrations"
/create-tasks
/execute-tasks
```

**Expected Deliverables:**
- OpenAI/Anthropic AI provider integrations
- Stripe payment processing with webhooks (following @docs/standards/architecture/billing-patterns.md)
- Email service integration (Resend/SendGrid)
- Analytics and monitoring setup
- External service error handling and retries (implementing @docs/standards/architecture/resilience-patterns.md)
- **95% test coverage for external service integrations (Phoenix requirement)**

#### 🔄 Commit Point 9: External Services Complete
```bash
git add .
git commit -m "feat(phase-3): implement external services (step 2)

- OpenAI/Anthropic AI providers with fallback
- Stripe payment processing with webhook handling
- Email service integration with template management
- Analytics and monitoring with error tracking
- Resilient external service communication"

git push
```

**Step 3: Authentication Infrastructure Implementation**
```bash
/create-spec "Auth Infrastructure - Better-Auth setup, session management, OAuth providers, security middleware, and token management"
/create-tasks
/execute-tasks
```

**Expected Deliverables:**
- Better-Auth integration and configuration (following @docs/standards/security/authentication-patterns.md)
- Session persistence and security
- OAuth provider setup (Google, GitHub)
- Security middleware and CSRF protection
- Token management and refresh mechanisms

#### 🔄 Commit Point 10: Infrastructure Complete
```bash
git add .
git commit -m "feat(phase-3): complete infrastructure layer (step 3)

- Better-Auth integration with OAuth providers
- Secure session persistence and management
- OAuth provider setup (Google, GitHub, etc.)
- Security middleware with CSRF protection
- Token management and automatic refresh"

git push
git tag -a "v0.3.0-infrastructure" -m "Infrastructure layer complete - External dependencies properly abstracted"
git push --tags

# 🔄 CONTEXT CLEAR POINT: Infrastructure Layer Complete
# Rationale: External services complete, moving to API translation layer

# Update checkpoint files before context clear
echo "Updating checkpoint files before Phase 3 → Phase 4 transition..."

# Update PHOENIX-CHECKPOINT.txt
cat > PHOENIX-CHECKPOINT.txt << EOF
LAST_COMPLETED: Phase 3, Step 3 - Authentication Infrastructure Implementation
NEXT_ACTION: Start Phase 4, Step 1 - API Controllers Implementation
GIT_TAG: v0.3.0-infrastructure
COVERAGE: Domain 100%, Use Cases 100%, Infrastructure 95%, Overall 65%
NOTE: Infrastructure complete with external services abstracted. Next: Interface adapters layer
EOF

# Update PHOENIX-PROGRESS.md - mark Phase 3 steps 1-3 as [x] completed
# (Manual update of checkboxes in visual tracker)

# Commit checkpoint updates
git add PHOENIX-PROGRESS.md PHOENIX-CHECKPOINT.txt
git commit -m "chore: update checkpoint files - Phase 3 complete"

# Now execute context clear
/clear
```

---

### Phase 4: Interface Adapters (3 Steps)

**Step 1: API Controllers Implementation**
```bash
/create-spec "API Controllers - Multi-tenant HonoJS REST endpoints with JWT authentication, RBAC authorization, security middleware, performance optimization, and comprehensive testing"
/create-tasks
/execute-tasks
```

**Expected Deliverables:**
- **Multi-tenant API architecture** with tenant isolation and context propagation
- **JWT authentication middleware** with refresh token rotation and secure storage
- **Role-based authorization (RBAC)** with fine-grained permission matrices
- **Security middleware stack** including rate limiting, CORS, CSP headers, and request sanitization
- **Performance optimization** achieving <200ms p95 API response times
- **HonoJS route handlers** following contract-first development patterns from [`docs/standards/stack-specific/hono-api.md`](docs/standards/stack-specific/hono-api.md#contract-first-api-development)
- **Request validation** using Zod schemas with tenant-specific validation rules
- **Standardized response formatting** with consistent error codes and structured logging
- **Error handling middleware** with proper HTTP status codes and security-aware error responses
- **API documentation generation** with OpenAPI 3.1 and tenant-specific examples
- **95% test coverage** for all controller implementations (Phoenix requirement)

#### 🔄 Commit Point 11: API Controllers Complete
```bash
git add .
git commit -m "feat(phase-4): implement API controllers (step 1)

- HonoJS route handlers with clean structure
- Request validation with Zod schemas
- Standardized response formatting and errors
- Comprehensive error handling middleware
- API documentation with OpenAPI generation"

git push
```

**Step 2: Contract-Driven Bridge Implementation**
```bash
/create-spec "Contract-First API Bridge - Multi-tenant Zod contracts with versioning, performance SLAs, comprehensive testing, and end-to-end type safety using zod-endpoints pattern"
/create-tasks
/execute-tasks
```

**Expected Deliverables:**
- **Contract-first development** using `zod-endpoints` pattern from [`docs/standards/stack-specific/hono-api.md`](docs/standards/stack-specific/hono-api.md#contract-first-api-development)
- **Multi-tenant contract validation** with tenant context propagation and isolation rules
- **Versioned API contracts** with backward compatibility and migration support
- **Performance validation contracts** with response time SLAs (<200ms) and load testing schemas
- **Type-safe API contracts** using Zod with enhanced validation hooks and custom error messages
- **Shared schema definitions** across frontend/backend with zero-duplication architecture
- **OpenAPI 3.1 documentation** generation with tenant-specific examples and authentication flows
- **End-to-end type safety** validation from database entities to UI components
- **Comprehensive contract testing** with boundary value analysis and edge case coverage
- **Security contract validation** with input sanitization and output encoding rules
- **100% test coverage for API contracts** (Phoenix requirement) including integration and performance tests

#### 🔄 Commit Point 12: Contracts Complete
```bash
git add .
git commit -m "feat(phase-4): implement contract-driven bridge (step 2)

- Type-safe API contracts with Zod validation
- Shared schemas ensuring frontend/backend consistency
- OpenAPI documentation with automatic generation
- End-to-end type safety from DB to UI
- 100% test coverage for API contracts (Phoenix requirement verified)"

git push
```

**Step 3: WebSocket & Streaming Implementation**
```bash
/create-spec "Multi-tenant Real-time Features - WebSocket isolation, AI streaming with usage tracking, live updates with tenant boundaries, performance optimization, and comprehensive testing"
/create-tasks
/execute-tasks
```

**Expected Deliverables:**
- **Multi-tenant WebSocket isolation** with tenant-specific rooms and connection management
- **Tenant-aware rate limiting** for real-time events and connection throttling per tenant
- **Performance optimization** achieving <100ms real-time event delivery target
- **AI streaming with token usage tracking** per tenant for billing and quota management
- **WebSocket connection management** with automatic reconnection and circuit breaker patterns from [`docs/standards/architecture/streaming-patterns.md`](docs/standards/architecture/streaming-patterns.md#connection-management)
- **Server-sent events** for real-time updates with tenant context propagation
- **Real-time subscriptions** and notifications with fine-grained permission controls
- **Connection resilience patterns** with exponential backoff and graceful degradation
- **Comprehensive error handling** with connection state recovery and user-friendly error messages
- **Security middleware** for WebSocket connections including authentication validation and CORS policies
- **90% integration test coverage** for all real-time features (Phoenix requirement)

#### 🔄 Commit Point 13: Interface Adapters Complete
```bash
git add .
git commit -m "feat(phase-4): complete interface adapters (step 3)

- WebSocket connections with proper management
- Server-sent events for real-time updates
- AI streaming handlers with error recovery
- Real-time subscriptions and notifications
- Resilient connection management"

git push
git tag -a "v0.4.0-adapters" -m "Interface adapters complete - Clean API layer established"
git push --tags

# 🔄 CONTEXT CLEAR POINT: Interface Adapters Complete
# Rationale: API layer complete, moving to frontend concerns

# Update checkpoint files before context clear
echo "Updating checkpoint files before Phase 4 → Phase 5 transition..."

# Update PHOENIX-CHECKPOINT.txt
cat > PHOENIX-CHECKPOINT.txt << EOF
LAST_COMPLETED: Phase 4, Step 3 - WebSocket & Streaming Implementation
NEXT_ACTION: Start Phase 5, Step 1 - Enhanced Next.js Foundation with Engineering OS Integration
GIT_TAG: v0.4.0-adapters
COVERAGE: Domain 100%, Use Cases 100%, Infrastructure 95%, API Contracts 100%, Overall 75%
NOTE: Interface adapters complete with clean API layer. Next: Presentation layer (95% UI coverage target)
EOF

# Update PHOENIX-PROGRESS.md - mark Phase 4 steps 1-3 as [x] completed
# (Manual update of checkboxes in visual tracker)

# Commit checkpoint updates
git add PHOENIX-PROGRESS.md PHOENIX-CHECKPOINT.txt
git commit -m "chore: update checkpoint files - Phase 4 complete"

# Now execute context clear
/clear
```

#### 📊 Phase 4 Success Criteria

**Feature Implementation Requirements:**
- ✅ All 436 features implemented with functional API endpoints
- ✅ Multi-tenant architecture implemented with complete tenant isolation
- ✅ JWT authentication and RBAC authorization fully operational

**Performance Targets:**
- ✅ <200ms p95 API response time achieved across all endpoints
- ✅ <100ms real-time event delivery for WebSocket and SSE
- ✅ API rate limiting properly configured per tenant tier

**Quality Assurance:**
- ✅ 95% test coverage for all API controllers (verified via coverage reports)
- ✅ 100% test coverage for all API contracts (comprehensive validation testing)
- ✅ 90% integration test coverage for real-time features
- ✅ Zero critical security vulnerabilities (verified via security scan)

**Architecture Compliance:**
- ✅ 10/10 Clean Architecture compliance score (Interface Adapters layer complete)
- ✅ Contract-first development patterns implemented using [`docs/standards/stack-specific/hono-api.md`](docs/standards/stack-specific/hono-api.md#contract-first-api-development)
- ✅ Security patterns aligned with [`docs/standards/security/api-security.md`](docs/standards/security/api-security.md)
- ✅ Streaming patterns following [`docs/standards/architecture/streaming-patterns.md`](docs/standards/architecture/streaming-patterns.md#connection-management)

**Documentation & Standards:**
- ✅ OpenAPI 3.1 documentation generated with tenant-specific examples
- ✅ API contracts versioned with backward compatibility support
- ✅ Real-time API documentation including connection management patterns

---

### Phase 5: Presentation Layer (3 Steps)

**Step 1: Enhanced Next.js Foundation with Engineering OS Integration**
```bash
/create-spec "Next.js 15.5+ Foundation with Enhanced Engineering OS Integration - Advanced Feature-Sliced Design, multi-tenant architecture, performance optimization, and embedded verification compliance:

TASK ANALYSIS:
- Keywords: nextjs-15.5, feature-sliced-design, multi-tenant, performance-optimization, phoenix, greenfield, coverage-95
- DSL Navigation: Root → architecture → feature-sliced-design.md, performance → core-web-vitals.md (embedded verification blocks)
- Variables: PROJECT_COVERAGE=95, PROJECT_TYPE=greenfield, PROJECT_NAME=phoenix, NEXTJS_VERSION=15.5, UI_COVERAGE_THRESHOLD=95

ENHANCED STANDARDS CONSULTATION (Hierarchical Approach):
1. context-fetcher loads @docs/standards/standards.md (root dispatcher)
2. Follows hierarchical routing to architecture and performance categories
3. Loads standards with embedded verification blocks:
   - architecture/feature-sliced-design.md (FSD layers and import rules with embedded verification)
   - code-style/react-patterns.md (React 19.1.1+ Server Components with embedded verification)
   - performance/core-web-vitals.md (LCP <2.5s, INP <200ms, CLS <0.1 with embedded verification)
   - performance/bundle-optimization.md (150KB main chunk, 100KB pages with embedded verification)
4. Cache standards with embedded verification blocks for UI compliance validation

ARCHITECTURE REQUIREMENTS:
Next.js 15.5+ App Router Foundation:
- Server Components architecture with React 19.1.1+ concurrent features
- App Router with nested layouts and server-side data fetching patterns
- Multi-tenant routing structure supporting organization-scoped and user-scoped pages
- Edge Runtime optimization for improved performance and global deployment

Enhanced Feature-Sliced Design Implementation:
- app/ layer: Root providers, global layouts, error boundaries, and server actions
- processes/ layer: Cross-cutting flows (authentication, payment, organization setup)
- pages/ layer: Route-specific components with Server Components and RSC patterns
- features/ layer: Business feature modules (auth, organizations, billing, AI chat)
- entities/ layer: Business entity UI components with proper abstraction
- shared/ layer: Reusable UI components, hooks, utilities with zero business logic

Multi-Tenant Architecture Patterns:
- Tenant-aware routing with organization-scoped and user-scoped page structures
- Context propagation for tenant-specific theming and configuration
- Multi-tenant component patterns with tenant isolation and security boundaries
- Dynamic routing supporting both [organizationSlug] and user-specific paths

Performance Optimization Implementation:
- Bundle splitting with dynamic imports and React.lazy for code splitting
- Image optimization with Next.js Image component and responsive loading
- Font optimization using variable fonts (Inter Variable, JetBrains Mono Variable)
- Preloading strategies for critical resources and route prefetching

EMBEDDED VERIFICATION COMPLIANCE:
- verification-runner extracts embedded verification blocks from feature-sliced-design.md
- All FSD layer imports follow proper direction (verified: fsd_import_direction_correct)
- Server Components properly implemented (verified: server_components_usage_correct)
- Bundle size limits enforced (verified: bundle_size_under_150kb_main_chunk)
- Core Web Vitals targets met (verified: core_web_vitals_targets_achieved)
- Multi-tenant routing security (verified: tenant_isolation_boundaries_secure)

VARIABLE SUBSTITUTION:
- \${PROJECT_COVERAGE} → 95 (Phoenix UI layer requirement)
- \${PROJECT_TYPE} → greenfield
- \${PROJECT_NAME} → phoenix
- \${NEXTJS_VERSION} → 15.5
- \${UI_COVERAGE_THRESHOLD} → 95"

/create-tasks
/execute-tasks
```

**Enhanced Deliverables:**
- **Next.js 15.5+ App Router** with React 19.1.1+ Server Components and concurrent features
- **Feature-Sliced Design compliance** verified via embedded verification blocks from architecture/feature-sliced-design.md
- **Multi-tenant routing architecture** with organization-scoped and user-scoped page structures
- **Performance optimization** meeting Core Web Vitals targets (LCP <2.5s, INP <200ms, CLS <0.1)
- **Bundle size compliance** (150KB main chunk, 100KB pages) verified via embedded tests
- **Server-side data fetching** patterns with proper caching and revalidation strategies
- **95% UI test coverage foundation** with React Testing Library and MSW integration patterns

#### 🔄 Commit Point 14: Enhanced Next.js Foundation Complete
```bash
git add .
git commit -m "feat(phase-5): implement enhanced Next.js foundation with Engineering OS integration (step 1)

- Next.js 15.5+ App Router with React 19.1.1+ Server Components and concurrent features
- Feature-Sliced Design compliance verified via embedded verification blocks
- Multi-tenant routing architecture with organization-scoped and user-scoped page structures  
- Performance optimization meeting Core Web Vitals targets (LCP <2.5s, INP <200ms, CLS <0.1)
- Bundle size compliance (150KB main chunk, 100KB pages) verified via embedded tests
- Server-side data fetching patterns with proper caching and revalidation strategies
- 95% UI test coverage foundation with React Testing Library and MSW integration
- EMBEDDED VERIFICATION: fsd_import_direction_correct PASSED
- EMBEDDED VERIFICATION: server_components_usage_correct PASSED  
- EMBEDDED VERIFICATION: bundle_size_under_150kb_main_chunk PASSED
- EMBEDDED VERIFICATION: core_web_vitals_targets_achieved PASSED
- EMBEDDED VERIFICATION: tenant_isolation_boundaries_secure PASSED"

git push
```

**Step 2: Enhanced Core Features with Multi-Tenant UI Architecture**
```bash
/create-spec "Core UI Features with Multi-Tenant Architecture - Enhanced authentication flows, analytics dashboard, organization management, responsive design, accessibility compliance, and comprehensive testing integration:

TASK ANALYSIS:
- Keywords: core-ui-features, multi-tenant, authentication-flows, accessibility-compliance, phoenix, greenfield, coverage-95
- DSL Navigation: Root → code-style → react-patterns.md, development → testing-strategy.md (embedded verification blocks)
- Variables: PROJECT_COVERAGE=95, PROJECT_TYPE=greenfield, UI_COVERAGE_THRESHOLD=95, ACCESSIBILITY_SCORE=95

ENHANCED STANDARDS CONSULTATION (Hierarchical Approach):
1. context-fetcher loads @docs/standards/standards.md (root dispatcher)
2. Follows hierarchical routing to code-style and development categories
3. Loads standards with embedded verification blocks:
   - code-style/react-patterns.md (Server/Client Components, hooks patterns with embedded verification)
   - development/testing-strategy.md (React Testing Library, MSW, coverage thresholds with embedded verification)
   - code-style/css-style.md (TailwindCSS 4.1.12+, CVA patterns, responsive design with embedded verification)
   - security/authentication-patterns.md (Secure form patterns, validation with embedded verification)
4. Cache standards with embedded verification blocks for UI compliance validation

ARCHITECTURE REQUIREMENTS:
Enhanced Authentication Flow Implementation:
- Server Components for static authentication layouts with React 19.1.1+ patterns
- Client Components for interactive forms with proper 'use client' boundaries
- Multi-factor authentication UI with time-based token verification
- Social OAuth integration (Google, GitHub) with comprehensive error handling
- Form validation using react-hook-form with Zod schemas from packages/contracts
- Password strength indicators and security feedback with real-time validation

Multi-Tenant Dashboard Architecture:
- Tenant-aware analytics components with organization-specific data visualization
- Context-driven dashboard widgets supporting both user and organization scopes  
- Real-time metrics with WebSocket integration and optimistic updates
- Responsive chart components using recharts with accessibility compliance
- Performance metrics dashboard with Core Web Vitals monitoring integration

Organization Management UI Patterns:
- Multi-tenant organization creation and configuration interfaces
- Role-based permission UI with fine-grained access control visualization
- Member invitation workflows with email verification and background processing
- Billing integration UI with Stripe Elements and subscription management
- Organization settings with audit trail visualization and change tracking

Enhanced Accessibility Implementation:
- ARIA compliance with comprehensive labeling and role definitions
- Keyboard navigation support with focus management and skip links
- Screen reader support with live regions and status announcements
- Color contrast compliance (WCAG 2.1 AA) with automated validation
- Semantic HTML usage with proper heading hierarchy and landmark navigation

Responsive Design System:
- Mobile-first responsive components with TailwindCSS 4.1.12+ breakpoints
- Touch-friendly interface patterns for mobile and tablet experiences
- Progressive enhancement with graceful degradation for older browsers
- Component variants using Class Variance Authority (CVA) for consistent styling

EMBEDDED VERIFICATION COMPLIANCE:
- verification-runner extracts embedded verification blocks from react-patterns.md and testing-strategy.md
- Server/Client Component boundaries properly implemented (verified: component_boundaries_correct)
- Form validation with Zod integration (verified: form_validation_zod_integration)
- Accessibility compliance achieved (verified: accessibility_score_95_percent)
- Responsive design patterns (verified: responsive_design_mobile_first)
- Test coverage threshold met (verified: ui_test_coverage_95_percent)

VARIABLE SUBSTITUTION:
- \${PROJECT_COVERAGE} → 95 (Phoenix UI layer requirement)
- \${PROJECT_TYPE} → greenfield
- \${UI_COVERAGE_THRESHOLD} → 95
- \${ACCESSIBILITY_SCORE} → 95"

/create-tasks
/execute-tasks
```

**Enhanced Deliverables:**
- **Multi-tenant authentication flows** with MFA, OAuth, and comprehensive error handling verified via embedded tests
- **Analytics dashboard** with tenant-aware components and real-time WebSocket integration
- **Organization management interfaces** with role-based permissions and billing integration UI
- **ARIA-compliant accessibility** achieving 95% Lighthouse score verified via embedded accessibility tests
- **Responsive design system** using TailwindCSS 4.1.12+ and CVA patterns verified via embedded tests
- **95% UI test coverage** using React Testing Library, MSW, and comprehensive testing patterns from embedded verification
- **Form validation integration** with Zod schemas from packages/contracts ensuring end-to-end type safety

#### 🔄 Commit Point 15: Enhanced Core Features Complete
```bash
git add .
git commit -m "feat(phase-5): implement enhanced core features with multi-tenant UI architecture (step 2)

- Multi-tenant authentication flows with MFA, OAuth, and comprehensive error handling verified via embedded tests
- Analytics dashboard with tenant-aware components and real-time WebSocket integration
- Organization management interfaces with role-based permissions and billing integration UI
- ARIA-compliant accessibility achieving 95% Lighthouse score verified via embedded accessibility tests
- Responsive design system using TailwindCSS 4.1.12+ and CVA patterns verified via embedded tests
- 95% UI test coverage using React Testing Library, MSW, and comprehensive testing patterns
- Form validation integration with Zod schemas from packages/contracts ensuring end-to-end type safety
- EMBEDDED VERIFICATION: component_boundaries_correct PASSED
- EMBEDDED VERIFICATION: form_validation_zod_integration PASSED
- EMBEDDED VERIFICATION: accessibility_score_95_percent PASSED
- EMBEDDED VERIFICATION: responsive_design_mobile_first PASSED
- EMBEDDED VERIFICATION: ui_test_coverage_95_percent PASSED"

git push
```

**Step 3: Enhanced AI Chat Interface with Real-Time Architecture**
```bash
/create-spec "AI Chat Interface with Real-Time Streaming - Advanced conversation management, multi-tenant streaming, performance optimization, accessibility, and comprehensive real-time architecture:

TASK ANALYSIS:
- Keywords: ai-chat-interface, streaming-responses, real-time-architecture, multi-tenant, performance-optimization, phoenix, greenfield, coverage-95
- DSL Navigation: Root → architecture → streaming-patterns.md, performance → core-web-vitals.md (embedded verification blocks)
- Variables: PROJECT_COVERAGE=95, PROJECT_TYPE=greenfield, STREAMING_LATENCY=100ms, AI_RESPONSE_TIME=2s

ENHANCED STANDARDS CONSULTATION (Hierarchical Approach):
1. context-fetcher loads @docs/standards/standards.md (root dispatcher)
2. Follows hierarchical routing to architecture and performance categories
3. Loads standards with embedded verification blocks:
   - architecture/streaming-patterns.md (WebSocket management, Server-Sent Events with embedded verification)
   - performance/core-web-vitals.md (INP <200ms for real-time interactions with embedded verification)
   - code-style/react-patterns.md (Suspense, streaming patterns with embedded verification)
   - development/testing-strategy.md (Real-time testing patterns with embedded verification)
4. Cache standards with embedded verification blocks for streaming compliance validation

ARCHITECTURE REQUIREMENTS:
Advanced AI Chat Streaming Implementation:
- WebSocket connections with automatic reconnection and exponential backoff patterns
- Server-Sent Events (SSE) for AI response streaming with proper error handling
- Real-time message synchronization across multiple browser tabs and devices
- Connection resilience with circuit breaker patterns and graceful degradation
- Multi-tenant streaming with tenant isolation and connection management

Enhanced Conversation Management:
- Infinite scroll conversation history with virtualization for performance
- Message threading and context management with proper state persistence
- Conversation search and filtering with Elasticsearch integration
- Message export functionality supporting multiple formats (JSON, Markdown, PDF)
- Conversation summarization with AI processing and background generation

Advanced Message Formatting:
- Syntax highlighting for code blocks with Prism.js integration
- Markdown rendering with security-aware sanitization (DOMPurify)
- LaTeX/Math equation rendering with KaTeX integration
- File attachment support with drag-and-drop functionality
- Message reactions and annotations with real-time synchronization

Real-Time User Experience:
- Typing indicators with multi-user awareness and tenant isolation
- Live cursor positions and user presence indicators
- Optimistic message updates with conflict resolution and rollback mechanisms
- Real-time message status (sending, delivered, read) with visual feedback
- Voice message integration with audio recording and playback controls

Performance Optimization:
- Message virtualization for large conversation histories (10k+ messages)
- Intelligent preloading of conversation context and message history
- Image lazy loading with progressive enhancement for media attachments
- Bundle splitting for chat-specific components and streaming libraries
- Service Worker integration for offline message queuing and synchronization

Mobile-Optimized Experience:
- Touch-friendly interface with swipe gestures for message actions
- Responsive layout adapting to keyboard visibility on mobile devices
- Progressive Web App features with push notifications for new messages
- Offline message composition with automatic sync when connection restored
- Voice input integration with speech-to-text functionality

Accessibility Implementation:
- Screen reader support for real-time message announcements
- Keyboard navigation for all chat interface elements
- ARIA live regions for dynamic content updates and typing indicators
- High contrast mode support with proper color contrast ratios
- Focus management for message threading and conversation switching

EMBEDDED VERIFICATION COMPLIANCE:
- verification-runner extracts embedded verification blocks from streaming-patterns.md
- WebSocket connection management properly implemented (verified: websocket_connection_resilience)
- Real-time latency targets achieved (verified: streaming_latency_under_100ms)
- Message virtualization performance (verified: virtualization_10k_messages_smooth)
- Accessibility for real-time content (verified: realtime_accessibility_compliance)
- Multi-tenant streaming isolation (verified: tenant_streaming_isolation_secure)

VARIABLE SUBSTITUTION:
- \${PROJECT_COVERAGE} → 95 (Phoenix UI layer requirement)
- \${PROJECT_TYPE} → greenfield
- \${STREAMING_LATENCY} → 100ms
- \${AI_RESPONSE_TIME} → 2s"

/create-tasks
/execute-tasks
```

**Enhanced Deliverables:**
- **Advanced AI streaming interface** with WebSocket resilience and <100ms latency verified via embedded tests
- **Multi-tenant conversation management** with tenant isolation and real-time synchronization
- **High-performance message virtualization** supporting 10k+ message histories with smooth scrolling
- **Comprehensive message formatting** with syntax highlighting, Markdown, LaTeX, and file attachments
- **Mobile-optimized PWA experience** with offline capabilities and voice input integration
- **Real-time accessibility compliance** with screen reader support and ARIA live regions verified via embedded tests
- **95% test coverage** for streaming components including WebSocket testing and real-time interaction patterns

#### 🔄 Commit Point 16: Enhanced Presentation Layer Complete
```bash
git add .
git commit -m "feat(phase-5): complete enhanced presentation layer with real-time AI chat architecture (step 3)

- Advanced AI streaming interface with WebSocket resilience and <100ms latency verified via embedded tests
- Multi-tenant conversation management with tenant isolation and real-time synchronization
- High-performance message virtualization supporting 10k+ message histories with smooth scrolling
- Comprehensive message formatting with syntax highlighting, Markdown, LaTeX, and file attachments
- Mobile-optimized PWA experience with offline capabilities and voice input integration
- Real-time accessibility compliance with screen reader support and ARIA live regions verified via embedded tests
- 95% test coverage for streaming components including WebSocket testing and real-time interaction patterns
- EMBEDDED VERIFICATION: websocket_connection_resilience PASSED
- EMBEDDED VERIFICATION: streaming_latency_under_100ms PASSED
- EMBEDDED VERIFICATION: virtualization_10k_messages_smooth PASSED
- EMBEDDED VERIFICATION: realtime_accessibility_compliance PASSED
- EMBEDDED VERIFICATION: tenant_streaming_isolation_secure PASSED"

git push
git tag -a "v0.5.0-enhanced-presentation" -m "Enhanced presentation layer complete - Production-ready UI with real-time architecture and embedded verification compliance"
git push --tags

# 🔄 CONTEXT CLEAR POINT: Presentation Layer Complete
# Rationale: UI implementation complete, moving to deployment operations

# Update checkpoint files before context clear
echo "Updating checkpoint files before Phase 5 → Phase 6 transition..."

# Update PHOENIX-CHECKPOINT.txt
cat > PHOENIX-CHECKPOINT.txt << EOF
LAST_COMPLETED: Phase 5, Step 3 - Enhanced AI Chat Interface with Real-Time Architecture
NEXT_ACTION: Start Phase 6, Step 1 - Production Environment Setup
GIT_TAG: v0.5.0-enhanced-presentation
COVERAGE: Domain 100%, Use Cases 100%, Infrastructure 95%, API 100%, UI 95%, Overall 90%
NOTE: Presentation layer complete with real-time architecture. Next: Production deployment
EOF

# Update PHOENIX-PROGRESS.md - mark Phase 5 steps 1-3 as [x] completed
# (Manual update of checkboxes in visual tracker)

# Commit checkpoint updates
git add PHOENIX-PROGRESS.md PHOENIX-CHECKPOINT.txt
git commit -m "chore: update checkpoint files - Phase 5 complete"

# Now execute context clear
/clear
```

#### 📊 Enhanced Phase 5 Success Criteria with Embedded Verification

**Architecture Compliance (Verified via Embedded Verification Framework):**
- ✅ Feature-Sliced Design compliance score: 100% (verified: fsd_import_direction_correct, fsd_layer_hierarchy_proper)
- ✅ Server Components architecture properly implemented (verified: server_components_usage_correct)  
- ✅ Multi-tenant UI isolation and security (verified: tenant_isolation_boundaries_secure)
- ✅ Contract-driven UI development with end-to-end type safety (verified: contracts_ui_integration_complete)

**Performance Targets (Verified via Embedded Performance Tests):**
- ✅ Core Web Vitals compliance (verified: core_web_vitals_targets_achieved)
  - LCP <2.5 seconds (verified: lcp_under_2_5_seconds)
  - INP <200 milliseconds (verified: inp_under_200ms)
  - CLS <0.1 (verified: cls_under_0_1)
- ✅ Bundle size compliance (verified: bundle_size_under_150kb_main_chunk, bundle_size_pages_under_100kb)
- ✅ Real-time streaming latency <100ms (verified: streaming_latency_under_100ms)

**Quality Assurance (Phoenix Greenfield Standards):**
- ✅ 95% UI test coverage achieved (verified: ui_test_coverage_95_percent)
- ✅ React Testing Library + MSW integration complete (verified: rtl_msw_integration_complete)
- ✅ Accessibility compliance 95% Lighthouse score (verified: accessibility_score_95_percent)
- ✅ ARIA compliance comprehensive (verified: aria_compliance_comprehensive)

**Feature Migration Requirements:**
- ✅ All 436 UI features migrated with proper FSD organization
- ✅ Multi-tenant interface components supporting organization and user contexts
- ✅ Authentication flows with MFA and OAuth integration complete

**Enhanced Engineering OS Integration:**
- ✅ Embedded verification framework integrated (28+ UI verification tests passing)
- ✅ Hierarchical standards loading with <10% context usage efficiency
- ✅ Variable substitution patterns implemented (PROJECT_COVERAGE=95%, PROJECT_TYPE=greenfield)
- ✅ Contract-driven development patterns verified end-to-end

**Documentation & Standards:**
- ✅ Component library documentation with Storybook integration
- ✅ FSD architecture documentation with layer responsibilities and import rules
- ✅ Accessibility testing documentation with Pa11y and Axe integration
- ✅ Performance monitoring setup with Real User Monitoring (RUM) and Core Web Vitals tracking

**Phoenix System Readiness:**
- ✅ All 436 UI features implemented with proper FSD organization
- ✅ Production-ready presentation layer with comprehensive testing
- ✅ Multi-tenant interface supporting organization and user contexts
- ✅ Performance targets achieved for Core Web Vitals and user experience

---

### Phase 6: New System Deployment & Launch (3 Steps)

**Step 1: Production Environment Setup**
```bash
/create-spec "Production Environment Setup - Fresh PostgreSQL database provisioning, Vercel deployment configuration, environment setup, and performance infrastructure with verification of production readiness"

# Expected verification output:
# ✅ Fresh PostgreSQL database provisioned with Phoenix schemas
# ✅ Vercel configuration valid and deployable
# ✅ Environment variables properly configured and accessible
# ✅ CDN and performance infrastructure operational
# ✅ Production database connectivity verified

/create-tasks
/execute-tasks
```

**Expected Deliverables:**
- Fresh PostgreSQL database with clean Phoenix schemas
- Vercel deployment configuration for Phoenix system (ports 4000/4001)
- Production environment variables and secrets management
- CDN and performance infrastructure setup
- Database initialization and schema validation

#### 🔄 Commit Point 17: Production Environment Ready
```bash
git add .
git commit -m "feat(phase-6): setup production environment (step 1)

- Fresh PostgreSQL database provisioned with clean Phoenix schemas
- Vercel deployment configuration for Phoenix system
- Production environment variables and secrets management
- CDN and performance infrastructure implementation
- Database connectivity and schema validation complete"

git push
```

**Step 2: Production Deployment & Validation**
```bash
/create-spec "Production Deployment - Deploy Phoenix system, end-to-end testing, performance validation, and security assessment with verification of production deployment success"

# Expected verification output:
# ✅ Phoenix system successfully deployed to production
# ✅ End-to-end tests passing in production environment
# ✅ Performance targets met (LCP <2.5s, API <200ms)
# ✅ Security scan shows zero critical vulnerabilities
# ✅ Load testing validates system capacity

/create-tasks
/execute-tasks
```

**Expected Deliverables:**
- Phoenix system deployed to production environment
- Comprehensive end-to-end testing in production
- Performance validation and load testing results
- Security scanning and vulnerability assessment
- Production deployment verification and health checks

#### 🔄 Commit Point 18: Production Deployment Complete
```bash
git add .
git commit -m "feat(phase-6): complete production deployment (step 2)

- Phoenix system successfully deployed to production environment
- End-to-end testing validated in production context
- Performance targets achieved (LCP <2.5s, API <200ms)
- Security assessment completed with zero critical vulnerabilities
- Load testing confirms system capacity and scalability"

git push
```

**Step 3: Go-Live & Monitoring Setup**
```bash
/create-spec "Go-Live & Monitoring - Launch Phoenix system, activate monitoring infrastructure, implement alerting, and establish operational procedures"
/create-tasks
/execute-tasks
```

**Expected Deliverables:**
- Phoenix system launched for production use
- Monitoring and alerting infrastructure activated
- Health checks and uptime monitoring operational
- Performance metrics and analytics tracking
- Incident response procedures established

#### 🔄 Commit Point 19: Production Launch Complete
```bash
git add .
git commit -m "feat(phase-6): complete production launch (step 3)

- Phoenix system launched for production use
- Comprehensive monitoring and alerting infrastructure activated
- Health checks and uptime monitoring operational
- Performance metrics and analytics tracking implemented
- Incident response procedures and operational protocols established"

git push
git tag -a "v1.0.0-beta" -m "Beta release - Production Phoenix system launched"
git push --tags
```

---

### Phase 7: Documentation & Optimization (2 Steps)

**Step 1: Production Optimization**
```bash
/create-spec "Production Optimization - Performance tuning based on production metrics, database optimization, caching strategies, and bundle optimization"
/create-tasks
/execute-tasks
```

**Expected Deliverables:**
- Performance tuning based on production metrics analysis
- Database query optimization and proper indexing
- Caching strategies implementation (Redis, CDN)
- Bundle size optimization and advanced code splitting
- Performance monitoring and capacity planning

#### 🔄 Commit Point 20: Production Optimization Complete
```bash
git add .
git commit -m "perf(phase-7): complete production optimization (step 1)

- Performance tuning based on real production metrics
- Database query optimization with intelligent indexing
- Comprehensive caching strategies (Redis, CDN) implementation
- Bundle size optimization and advanced code splitting
- Performance monitoring and validated capacity planning"

git push
```

**Step 2: Comprehensive Self-Documentation**
```bash
/create-spec "Comprehensive Documentation - Complete architecture documentation, API guides, operational procedures, troubleshooting runbooks, and maintenance guides for self-sufficient system operation"
/create-tasks
/execute-tasks
```

**Expected Deliverables:**
- Complete architecture documentation with visual diagrams
- Comprehensive API documentation with usage examples and integration guides
- Deployment guides and operational procedures
- Detailed troubleshooting runbooks and maintenance procedures
- Performance monitoring documentation and alerting configurations
- Security protocols and incident response procedures

#### 🔄 Commit Point 21: Production Ready with Complete Documentation
```bash
git add .
git commit -m "docs(phase-7): complete comprehensive self-documentation (step 2)

- Complete architecture documentation with comprehensive visual diagrams
- Detailed API documentation with usage examples and integration guides
- Deployment guides and comprehensive operational procedures
- Troubleshooting runbooks and detailed maintenance procedures
- Performance monitoring documentation and alerting configuration guides
- Security protocols and incident response procedures documentation"

git push
git tag -a "v1.0.0" -m "Production release - Phoenix rebuild complete with comprehensive documentation"
git push --tags
```

---

## Engineering OS Integration

### DSL System Usage Throughout Phoenix

#### Enhanced Engineering OS Integration (Phoenix-Specific)

Phoenix leverages the Engineering OS Standards Augmentation with **bidirectional verification** to ensure quality gates are correctly applied:

**Verification-Driven Implementation:**
```bash
# When Engineering OS detects keywords like:
# - "Enhanced Quality Gates"  
# - "Phoenix 98% coverage"
# - "greenfield" + "Development Environment Configuration"

# Enhanced Process:
# 1. Consults: local-quality.md, testing-strategy.md, git-workflow.md
# 2. Extracts verification templates from standards
# 3. Generates project-specific verification tests (98% for Phoenix)
# 4. Implements configuration to pass verification tests
# 5. Executes verification before task completion
# 6. Reports: ✅ All verifications passed OR ❌ Failures with details
```

**Enhanced Command Workflow with Verification:**
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

**Key Innovation: Bidirectional Verification with Enhanced Variable Substitution**
- **Standards provide verification templates** with comprehensive variable patterns
- **Engineering OS instantiates templates** with Phoenix-specific values for deterministic compliance
- **Implementation must pass all embedded verification tests** before task completion
- **Context-efficient loading** through hierarchical DSL routing (<10% context usage)

**Comprehensive Variable Substitution Patterns for Phoenix:**
```bash
# Project Configuration Variables
${PROJECT_COVERAGE} → 98 (Phoenix greenfield standard)
${PROJECT_TYPE} → greenfield (clean slate rebuild)
${PROJECT_NAME} → phoenix (project identifier)
${PROJECT_PHASES} → phase-0:phase-7 (structured development)

# Domain Layer Variables (100% coverage requirement)
${DOMAIN_COVERAGE_THRESHOLD} → 100 (domain purity requirement)

# Infrastructure Variables
${NODE_VERSION} → 22 (LTS version requirement)
${PORT_WEB} → 4000 (Phoenix web application)
${PORT_API} → 4001 (Phoenix API server)

# Testing Variables
${PACKAGE_MANAGER} → pnpm (workspace management)
${TESTING_FRAMEWORK} → vitest (Phoenix choice)
```

**Benefits:**
- **Deterministic quality assurance** without rigid file copying
- **Context-aware verification** with project-specific requirements
- **Scalable pattern** for different project types and coverage thresholds

#### Standards Consultation Pattern
Each phase should begin with standards consultation:

```bash
# Standards loading via context-fetcher agent
REQUEST: "Consult the standards knowledge base for guidance relevant to the current task. 
Start at the root dispatcher located at @docs/standards/standards.md and follow the 
routing logic to retrieve the necessary guidance."
```

#### Conditional Standards Loading
The system will automatically load relevant standards based on task keywords:
- `typescript|interface` → TypeScript patterns
- `react|component` → React/FSD patterns  
- `api|security` → API security standards
- `database|query` → Database patterns
- `test|testing` → Testing strategies

### Performance Expectations
- **Context Usage**: Standards should use <10% of context window
- **Routing Speed**: <100ms per dispatcher hop
- **Total Load Time**: <2s for complex task initialization

### Context Management Strategy

Strategic context clearing optimizes Claude Code performance and maintains Engineering OS efficiency throughout Phoenix implementation.

#### Primary Context Clear Points (Required)

**Phase Completion Boundaries:**
```bash
# After Phase 0 Complete (Infrastructure Setup) - Commit Point 5
git tag -a "v0.0.1-infrastructure" -m "Infrastructure complete"
/clear  # Context: setup → domain modeling

# After Phase 1 Complete (Domain Layer) - After verification gate
git tag -a "v0.1.0-domain-verified" -m "Domain layer complete - 28 tests passed"
/clear  # Context: domain patterns → business orchestration

# After Phase 2 Complete (Use Cases) - Commit Point 7
git tag -a "v0.2.0-use-cases" -m "Use cases complete - 100% coverage"
/clear  # Context: business logic → external integrations

# After Phase 3 Complete (Infrastructure) - Commit Point 10
git tag -a "v0.3.0-infrastructure" -m "Infrastructure complete - 95% coverage"
/clear  # Context: external services → API translation

# After Phase 4 Complete (Interface Adapters) - Commit Point 13
git tag -a "v0.4.0-adapters" -m "Interface adapters complete - 100% contracts"
/clear  # Context: backend → frontend concerns

# After Phase 5 Complete (Presentation) - Commit Point 16
git tag -a "v0.5.0-presentation" -m "Presentation complete - 95% coverage"
/clear  # Context: UI → deployment operations
```

**Clear Point Rationale:**
- **Architectural boundaries** - Each phase represents different Clean Architecture layer
- **Standards category switch** - New phase loads completely different standards sets
- **Verification completion** - Embedded verification tests passed for current layer
- **Context efficiency** - Maintains <10% context usage target

#### Secondary Clear Points (Optional)

**Performance-Based Clearing:**
- Context usage exceeds 80% of window capacity
- Response times exceed 5 seconds
- Before loading large standard sets (5+ files)
- After complex verification suites (20+ embedded tests)

#### Never Clear During

**Critical Continuity Points:**
- Mid-step implementation within a phase
- Active embedded verification execution  
- Cross-step dependencies (Steps 1-3 within same phase)
- Active standards consultation (DSL navigation in progress)
- Multi-part workflow (/create-spec → /create-tasks → /execute-tasks)

#### Context Checkpoint Template

Before each clear, document the current state:
```markdown
## Context Checkpoint - Phase [X] Complete
- Last Commit: [hash] - [description]
- Coverage: Domain [X]%, Use Cases [X]%, Infrastructure [X]%
- Verification: [X] embedded tests passed
- Next Phase: [Phase name] - [First step description]
- Key Context: [Critical information for next phase]
```

**Expected Benefits:**
- 50% reduction in context window usage per phase
- 30% faster response times after clearing
- Improved embedded verification accuracy with focused context
- Better standards loading efficiency via hierarchical DSL

---

## Checkpoint System & Restart Instructions

### Overview
Two complementary checkpoint files track Phoenix implementation progress and enable seamless restarts after context clears:

1. **PHOENIX-PROGRESS.md** - Comprehensive visual progress tracker with checkboxes
2. **PHOENIX-CHECKPOINT.txt** - Simple restart instructions for quick continuation

### Checkpoint Files Structure

#### PHOENIX-PROGRESS.md (Visual Tracker)
```markdown
# Phoenix Implementation Progress Tracker

## Phase 0: Infrastructure & Project Setup
- [ ] Step 1: Repository Infrastructure Specification
- [ ] Step 2: Monorepo Architecture Specification
- [ ] Step 3: Core Packages Architecture Specification
- [ ] Step 4: Development Environment Specification
- [ ] Step 5: Project Documentation Specification
- [ ] 🔄 CONTEXT CLEAR POINT (After git tag v0.0.1-infrastructure)

## Phase 1: Core Domain Layer
- [ ] Step 1: Domain Entities Implementation (Enhanced with Embedded Verification)
- [ ] Step 2: Domain Services Implementation (Enhanced with Embedded Verification)
- [ ] Step 3: Domain Events & Value Objects Implementation (Enhanced with Embedded Verification)
- [ ] 🔐 Phase Gate: Domain Layer Verification Complete (28 tests)
- [ ] 🔄 CONTEXT CLEAR POINT (After git tag v0.1.0-domain-verified)

## Phase 2: Use Cases & Business Logic
- [ ] Step 1: Authentication & Core Use Cases Implementation
- [ ] Step 2: Organization Management & Billing Use Cases Implementation
- [ ] Step 3: AI Chat & Analytics Use Cases Implementation
- [ ] 🔄 CONTEXT CLEAR POINT (After git tag v0.2.0-enhanced-use-cases)

## Phase 3: Infrastructure Layer
- [ ] Step 1: Database Infrastructure Implementation
- [ ] Step 2: External Services Implementation
- [ ] Step 3: Authentication Infrastructure Implementation
- [ ] 🔄 CONTEXT CLEAR POINT (After git tag v0.3.0-infrastructure)

## Phase 4: Interface Adapters
- [ ] Step 1: API Controllers Implementation
- [ ] Step 2: Contract-Driven Bridge Implementation
- [ ] Step 3: WebSocket & Streaming Implementation
- [ ] 🔄 CONTEXT CLEAR POINT (After git tag v0.4.0-adapters)

## Phase 5: Presentation Layer
- [ ] Step 1: Enhanced Next.js Foundation with Engineering OS Integration
- [ ] Step 2: Enhanced Core Features with Multi-Tenant UI Architecture
- [ ] Step 3: Enhanced AI Chat Interface with Real-Time Architecture
- [ ] 🔄 CONTEXT CLEAR POINT (After git tag v0.5.0-enhanced-presentation)

## Phase 6: New System Deployment & Launch
- [ ] Step 1: Production Environment Setup
- [ ] Step 2: Production Deployment & Validation
- [ ] Step 3: Go-Live & Monitoring Setup

## Phase 7: Documentation & Optimization
- [ ] Step 1: Production Optimization
- [ ] Step 2: Comprehensive Self-Documentation
- [ ] ✅ FINAL: Production Ready (v1.0.0)

## Last Checkpoint
**Date:** [timestamp]
**Last Completed:** [Phase X, Step Y]
**Git Tag:** [last tag created]
**Next Step:** [What to do when restarting]
**Coverage:** Domain [X]%, Use Cases [X]%, Infrastructure [X]%, UI [X]%
**Critical Notes:** [Any important context for restart]
```

#### PHOENIX-CHECKPOINT.txt (Simple Restart)
```
LAST_COMPLETED: Phase 0, Step 5 - Project Documentation Specification
NEXT_ACTION: Start Phase 1, Step 1 - Domain Entities Implementation
GIT_TAG: v0.0.1-infrastructure
COVERAGE: Overall 0% (infrastructure only, no code yet)
NOTE: Infrastructure complete. Next: Domain layer implementation with embedded verification
```

### Checkpoint Update Procedure

**Before Each Context Clear Point:**

1. **Update PHOENIX-PROGRESS.md** - Mark completed steps with `[x]`
2. **Update PHOENIX-CHECKPOINT.txt** with current state information
3. **Commit checkpoint files** before executing `/clear`

**Example Checkpoint Update (Phase 0 → Phase 1):**
```bash
# Update checkpoint files before context clear
echo "Updating checkpoint files before Phase 0 → Phase 1 transition..."

# Update PHOENIX-CHECKPOINT.txt
cat > PHOENIX-CHECKPOINT.txt << EOF
LAST_COMPLETED: Phase 0, Step 5 - Project Documentation Specification
NEXT_ACTION: Start Phase 1, Step 1 - Domain Entities Implementation  
GIT_TAG: v0.0.1-infrastructure
COVERAGE: Overall 0% (infrastructure only, no code yet)
NOTE: Infrastructure complete. Next: Domain layer with 100% coverage requirement
EOF

# Manually update PHOENIX-PROGRESS.md checkboxes for Phase 0 steps
# Mark Phase 0 steps 1-5 as [x] completed

# Commit checkpoint updates
git add PHOENIX-PROGRESS.md PHOENIX-CHECKPOINT.txt
git commit -m "chore: update checkpoint files - Phase 0 complete"

# Now execute context clear
/clear
```

### Restart Procedure After Context Clear

When restarting Claude Code after a context clear:

**Quick Restart:**
```
"Continue Phoenix implementation from checkpoint"
```

**Fastest Restart:**
```
"Continue Phoenix from PHOENIX-CHECKPOINT.txt"  
```

**Claude's Restart Process:**
1. **Read PHOENIX-CHECKPOINT.txt** for immediate context
2. **Check PHOENIX-PROGRESS.md** for detailed progress status
3. **Verify git status** and last tag matches checkpoint
4. **Load appropriate standards** for next phase via hierarchical DSL
5. **Continue implementation** from next unchecked step in progress tracker

### Checkpoint Integration Points

**The following context clear points require checkpoint updates:**

- **Phase 0 → Phase 1** (line ~491): Infrastructure → Domain
- **Phase 1 → Phase 2** (line ~849): Domain → Use Cases  
- **Phase 2 → Phase 3** (line ~1152): Use Cases → Infrastructure
- **Phase 3 → Phase 4** (line ~1256): Infrastructure → Interface Adapters
- **Phase 4 → Phase 5** (line ~1368): Interface Adapters → Presentation
- **Phase 5 → Phase 6** (line ~1722): Presentation → Deployment

### Recovery Procedures

**If Context Lost Unexpectedly:**
```bash
# Find last successful phase
git tag --list | grep -E "v[0-9]" | tail -1

# Check current implementation status  
find packages/ -type f -name "*.ts" | head -20
npm run test -- --coverage

# Consult checkpoint files
cat PHOENIX-CHECKPOINT.txt
tail -20 PHOENIX-PROGRESS.md

# Resume from last known good state
```

**Emergency Recovery:**
If checkpoint files are missing or corrupted:
```bash
# Use git tags to determine last completed phase
git tag --list | grep -E "v[0-9]"

# Check commit messages for phase completion
git log --oneline -10 | grep -E "feat\(phase-[0-9]\)"

# Verify test coverage to determine implementation status  
npm run test:coverage -- --summary
```

### Benefits of Dual Checkpoint System

1. **Visual Progress** - PHOENIX-PROGRESS.md provides complete overview
2. **Quick Restart** - PHOENIX-CHECKPOINT.txt enables immediate continuation
3. **No Lost Work** - Checkpoints committed before each context clear
4. **Deterministic Recovery** - Clear instructions for any restart scenario
5. **Progress Visibility** - Both human and AI can track implementation status
6. **Context Efficiency** - Minimal information needed for restart

---

## Risk Management & Mitigation

### Development Risks

**Risk: Architecture Compliance Drift**
- **Mitigation**: Regular architecture reviews at each commit point
- **Detection**: Automated dependency analysis in CI/CD
- **Response**: Refactoring tasks in subsequent sprints

**Risk: Feature Parity Gaps**  
- **Mitigation**: Comprehensive feature audit before each phase
- **Detection**: Automated comparison testing with legacy system
- **Response**: Feature catch-up tasks in current phase

**Risk: Performance Regression**
- **Mitigation**: Performance benchmarks at each major milestone
- **Detection**: Automated performance testing in CI/CD
- **Response**: Performance optimization sprints

### Operational Risks

**Risk: Production Deployment Issues**
- **Mitigation**: Comprehensive staging environment testing
- **Detection**: Health checks and monitoring alerts
- **Response**: Automated rollback within 5 minutes

**Risk: System Integration Failures**
- **Mitigation**: Extensive end-to-end testing in production-like environment
- **Detection**: Integration test failures and monitoring alerts
- **Response**: Immediate system isolation and investigation

### Rollback Procedures

#### Phase-Level Rollback
Each phase has tagged commits allowing rollback:
```bash
git reset --hard v0.1.0-domain  # Rollback to domain layer
git push --force-with-lease
```

#### Feature-Level Rollback
Individual features can be reverted:
```bash
git revert <feature-commit-hash>
git push
```

#### Production Rollback
Emergency production rollback:
```bash
# Via Vercel CLI
vercel rollback <deployment-url>

# Emergency response
# Isolate Phoenix system, investigate issues
```

---

## Success Criteria & Validation

### Phase Completion Criteria

**Phase 1 - Domain Layer**
- ✅ All domain entities implemented with business behavior
- ✅ 100% test coverage for domain logic
- ✅ Domain services properly abstracted
- ✅ Domain events system functional

**Phase 2 - Use Cases**
- ✅ Business logic isolated from frameworks
- ✅ 100% test coverage for all use cases (Phoenix requirement)
- ✅ Error handling comprehensive
- ✅ Cross-cutting concerns properly addressed

**Phase 3 - Infrastructure**
- ✅ All external dependencies abstracted behind interfaces
- ✅ Repository pattern properly implemented
- ✅ 95% test coverage for infrastructure layer (Phoenix requirement)
- ✅ Database migrations working correctly
- ✅ External service integrations tested

**Phase 4 - Interface Adapters**
- ✅ API contracts enforce type safety end-to-end
- ✅ 100% test coverage for API contracts (Phoenix requirement)
- ✅ Request/response validation working
- ✅ WebSocket connections stable
- ✅ Error handling middleware functional

**Phase 5 - Presentation**
- ✅ Feature-Sliced Design properly implemented
- ✅ 90% test coverage for presentation components (Phoenix requirement)
- ✅ Responsive design working on all devices
- ✅ Accessibility compliance (WCAG 2.1 AA)
- ✅ Performance metrics meet targets (Lighthouse >95)

**Phase 6 - Deployment**
- ✅ Fresh production environment provisioned
- ✅ Phoenix system successfully deployed
- ✅ End-to-end testing validated in production
- ✅ Performance and security targets achieved

**Phase 7 - Documentation & Optimization**
- ✅ Production performance optimization complete
- ✅ Comprehensive self-documentation created
- ✅ Operational procedures documented
- ✅ Monitoring and alerting operational

### Final System Validation

**Architecture Compliance**
- Clean Architecture compliance score: 10/10
- Dependency rule violations: 0
- Circular dependencies: 0
- Framework leakage into domain: 0

**Quality Metrics (Phoenix Greenfield Standard)**
- Test coverage: 98% overall (100% for domain/use cases)
- API test coverage: 100% for contracts
- Infrastructure coverage: 95% minimum
- Presentation coverage: 90% minimum
- Code quality score: >8.5/10
- Security scan: 0 critical vulnerabilities

**Performance Targets**
- Page load time: <2s (95th percentile)
- API response time: <200ms (95th percentile)
- Database query time: <100ms (95th percentile)
- Bundle size: <500KB initial load

**Business Continuity**
- Feature parity: 100% (436/436 features)
- System integrity: 100% maintained
- User experience: Improved performance and usability
- Deployment downtime: <5 minutes

---

## Team Requirements & Organization

### Core Team Structure (4-6 developers)

**Lead Architect (1)**
- Clean Architecture expertise
- Domain-Driven Design experience
- Engineering OS proficiency
- Code review and architectural guidance

**Backend Engineers (2)**
- Domain/Use Cases focus
- Infrastructure layer implementation
- API development experience
- Testing and quality assurance

**Frontend Engineers (2)**
- Feature-Sliced Design expertise
- React/Next.js advanced knowledge
- TypeScript proficiency
- UI/UX implementation

**DevOps Engineer (1)**
- Infrastructure as code
- CI/CD pipeline management
- Monitoring and observability
- Deployment automation

### Engineering OS Training Requirements

All team members must be proficient with:
- `/create-spec` command usage and specification writing
- `/create-tasks` workflow and task breakdown
- `/execute-tasks` implementation patterns
- Standards DSL navigation and usage
- Context-fetcher agent delegation

### Collaboration Protocols

**Daily Standups**
- Progress against current phase milestones
- Blockers and dependency issues
- Architecture decision points
- Code review assignments

**Weekly Architecture Reviews**
- Clean Architecture compliance verification
- Design pattern consistency checks
- Performance and quality metrics review
- Technical debt identification and planning

**Phase Gate Reviews**
- Complete feature validation
- Architecture compliance audit
- Performance benchmark validation
- Go/no-go decision for next phase

---

## Resources & References

### Engineering OS Documentation
- **DSL Instructions**: `/docs/EngineeringOS/dsl/AGENT-INSTRUCTIONS.md`
- **Standards Root**: `/docs/standards/standards.md`
- **Command Reference**: `.claude/commands/`

### Standards Documentation Paths
- **Architecture**: `@docs/standards/architecture/`
- **Code Style**: `@docs/standards/code-style/`  
- **Development**: `@docs/standards/development/`
- **Security**: `@docs/standards/security/`
- **Performance**: `@docs/standards/performance/`

### Key Engineering OS Commands
```bash
# Primary workflow commands
/create-spec    # Generate detailed feature specifications
/create-tasks   # Break specifications into actionable tasks
/execute-tasks  # Implement following Clean Architecture

# Analysis and planning commands
/plan-product   # Define product mission and roadmap
/analyze-product # Analyze existing codebase

# Specialized agent commands
@agent:context-fetcher    # Retrieve standards and documentation
@agent:git-workflow      # Git operations and branch management
@agent:test-runner       # Test execution and failure analysis
@agent:project-manager   # Task tracking and progress updates
```

### Technology Documentation
All implementation should reference up-to-date documentation via Context7 MCP:
- Next.js 15.5+ documentation
- HonoJS 4.9.4+ API patterns
- Drizzle ORM 0.44.4+ best practices
- Better-Auth 1.3.7+ configuration
- TailwindCSS 4.1+ design systems

---

## Appendices

### Appendix A: Legacy System Feature Audit
[Reference: 436 features identified in current system analysis]

### Appendix B: Clean Architecture Compliance Checklist
- Domain layer has no dependencies on external frameworks
- Use cases orchestrate business logic without framework coupling
- Infrastructure implements ports defined in domain/use cases
- Interface adapters translate between external formats and internal models
- Presentation layer depends only on interface adapters

### Appendix C: Performance Benchmarking Methodology
- Lighthouse performance audits at each major milestone
- Load testing with realistic user scenarios
- Database query performance analysis
- Bundle size optimization tracking
- Core Web Vitals monitoring and optimization

### Appendix D: Security Review Checklist  
- Authentication and authorization mechanisms
- API security (rate limiting, input validation, CORS)
- Data encryption at rest and in transit
- Secure secret management
- OWASP security compliance validation

---



---

**Document Status**: Living document - Updated throughout implementation
**Last Updated**: [Current Date]
**Next Review**: At completion of each phase
**Version**: 1.0.1
**Approved By**: [Team Lead/Architect]

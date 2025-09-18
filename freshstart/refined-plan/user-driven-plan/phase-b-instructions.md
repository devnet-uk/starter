# Phase B: Architecture Spine — User Instructions

> **Duration**: 4-6 hours | **Goal**: Create contracts, core abstractions, and infrastructure interfaces

## Overview

Phase B builds the architectural foundation that all domain logic will depend on. You'll create API contracts (Zod schemas), clean architecture primitives (entities, value objects), and infrastructure interfaces - but no concrete implementations yet.

**What you'll build:**
- `packages/contracts` - API schemas and OpenAPI generation
- `packages/core` - Domain primitives and shared kernel
- `packages/infrastructure` - Repository and service interfaces
- Architecture quality gates and dependency enforcement

## Prerequisites Check

Before starting, verify Phase A is complete:

```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

echo "🔍 Phase A Prerequisites:"
echo "- Git repository: $([ -d .git ] && echo '✅' || echo '❌')"
echo "- Workspace config: $([ -f pnpm-workspace.yaml ] && [ -f turbo.json ] && echo '✅' || echo '❌')"
echo "- Tooling setup: $([ -f tsconfig.base.json ] && [ -f biome.json ] && echo '✅' || echo '❌')"
echo "- EOS integration: $([ -d scripts ] && echo '✅' || echo '❌')"
echo "- Verification: $(pnpm verify:local >/dev/null 2>&1 && echo '✅' || echo '❌')"
echo "- Git clean: $([ $(git status --porcelain | wc -l) -eq 0 ] && echo '✅' || echo '❌')"

# Check checkpoint
grep -q 'Phase A' DEVNET-CHECKPOINT.txt && echo "- Checkpoint: ✅" || echo "- Checkpoint: ❌"
```

**Expected**: All items should show ✅

---

## Step B1: Contracts Package Creation

### Step B1.1: Create API Contracts Foundation

**🔗 COPY THIS TO CLAUDE CODE:**

```
I'm implementing DevNet phase-b architecture contracts package (Step B1).

PROJECT CONTEXT:
- Working directory: ${DEVNET_HOME:-~/Projects/devnet/}
- Goal: Create contracts package as single source of truth for API contracts
- Dependencies: Zero downstream dependencies, consumed by API and frontend
- Tech stack: Zod schemas, OpenAPI generation, TypeScript

CURRENT STATUS: Phase A foundation complete, starting Phase B architecture spine
SPECIFIC TASK: Execute Step B1 from phase-b-architecture.md

ARCHITECTURE REQUIREMENT:
This contracts package will be the foundational layer that defines all API interfaces across 4 domain areas:
- Authentication (user registration, sessions, MFA)
- Organizations (multi-tenant, RBAC, memberships)
- Billing (subscriptions, payments, usage tracking)
- Platform services (AI chat, storage, email, audit)

INSTRUCTIONS:
Please execute the contracts package creation following the DevNet phase-b architecture plan.

Run these commands in sequence:
1. /create-spec "Contracts package bootstrap — zod schemas, HTTP contracts, OpenAPI automation. Pull requirements from features/auth/specification.md, features/organizations/specification.md, features/payments/specification.md, and features/api/specification.md."
2. /create-tasks
3. /execute-tasks

Ensure all deliverables from Step B1 are completed:
- packages/contracts as new workspace package with proper exports
- Zod schemas organized by domain (auth, organizations, billing, platform)
- OpenAPI generation script (pnpm --filter @repo/contracts build:openapi)
- Contract validation tests with ≥95% coverage
- Clean integration with workspace configuration
```

### Verification After B1

Run this to verify Step B1 completed successfully:

```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

echo "🔍 Step B1 Verification:"
echo "- Contracts package: $([ -d packages/contracts ] && [ -f packages/contracts/package.json ] && echo '✅' || echo '❌')"
echo "- Workspace config: $(grep -q contracts pnpm-workspace.yaml && echo '✅' || echo '❌')"

if [ -d packages/contracts ]; then
  cd packages/contracts
  echo "- Source structure: $([ -d src ] && echo '✅' || echo '❌')"
  echo "- Schema files: $(find src -name '*.ts' | wc -l | tr -d ' ') files found"
  echo "- Test files: $(find . -name '*.test.ts' -o -name '*.spec.ts' | wc -l | tr -d ' ') test files"
  echo "- OpenAPI script: $(grep -q 'build:openapi' package.json && echo '✅' || echo '❌')"
  cd ../..
fi

# Test build
echo ""
echo "🧪 Build Test:"
pnpm --filter @repo/contracts build >/dev/null 2>&1 && echo "- Package builds: ✅" || echo "- Package builds: ❌"
```

**Expected**: All items should show ✅, package should build successfully

### Step B1.2: Commit Contracts Package

**🔗 COPY THIS TO CLAUDE CODE:**

```
I'm continuing DevNet phase-b architecture - committing the contracts package.

TASK: Commit the contracts package foundation.

Please commit the contracts setup with this exact command structure:
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"
git add packages/contracts pnpm-workspace.yaml turbo.json
git commit -m "feat(phase-b): contracts package established"

Confirm the commit was successful.
```

---

## Step B2: Core Shared Kernel

### Step B2.1: Create Domain Primitives

**🔗 COPY THIS TO CLAUDE CODE:**

```
I'm implementing DevNet phase-b architecture core shared kernel (Step B2).

PROJECT CONTEXT:
- Working directory: ${DEVNET_HOME:-~/Projects/devnet/}
- Goal: Clean architecture shared kernel with domain primitives
- Purpose: Base classes that all domain entities and value objects will extend
- Quality: 100% test coverage, zero framework dependencies

CURRENT STATUS: Contracts package complete, now building core domain abstractions
SPECIFIC TASK: Execute Step B2 from phase-b-architecture.md

ARCHITECTURE REQUIREMENT:
Create the foundational domain abstractions that enforce clean architecture principles:
- Entity<T> - Base entity with identity and equality
- ValueObject<T> - Immutable value objects with structural equality
- DomainEvent - Base class for domain events with metadata
- Result<T, E> - Railway-oriented programming for error handling
- Guard - Argument validation utilities

These will be used across all 4 domain areas (Auth, Organizations, Billing, Platform).

INSTRUCTIONS:
Please execute the core shared kernel creation following the DevNet phase-b architecture plan.

Run these commands in sequence:
1. /create-spec "Core shared kernel — entities, value objects, domain events, result/guard utilities. Reference terminology across features/auth/specification.md, features/organizations/specification.md, features/payments/specification.md, and features/ui-components/specification.md."
2. /create-tasks
3. /execute-tasks

Ensure all deliverables from Step B2 are completed:
- packages/core/src/domain/shared with base abstractions
- 100% unit test coverage for all shared kernel code
- Architectural tests preventing framework imports in core
- ESLint/Biome rules enforcing domain purity
- Comprehensive JSDoc documentation
```

### Verification After B2

Run this to verify Step B2 completed successfully:

```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

echo "🔍 Step B2 Verification:"
echo "- Core package: $([ -d packages/core ] && [ -f packages/core/package.json ] && echo '✅' || echo '❌')"

if [ -d packages/core ]; then
  cd packages/core
  echo "- Domain structure: $([ -d src/domain/shared ] && echo '✅' || echo '❌')"
  echo "- Base classes: $(find src -name '*.ts' | grep -E '(Entity|ValueObject|DomainEvent|Result|Guard)' | wc -l | tr -d ' ') found"
  echo "- Test coverage: $(find . -name '*.test.ts' -o -name '*.spec.ts' | wc -l | tr -d ' ') test files"
  cd ../..
fi

# Test core package
echo ""
echo "🧪 Core Package Tests:"
pnpm --filter @repo/core build >/dev/null 2>&1 && echo "- Core builds: ✅" || echo "- Core builds: ❌"
pnpm --filter @repo/core test >/dev/null 2>&1 && echo "- Core tests: ✅" || echo "- Core tests: ❌"
```

**Expected**: All items should show ✅, tests should pass with high coverage

### Step B2.2: Commit Core Shared Kernel

**🔗 COPY THIS TO CLAUDE CODE:**

```
I'm continuing DevNet phase-b architecture - committing the core shared kernel.

TASK: Commit the core domain abstractions and architectural documentation.

Please commit the core setup with this exact command structure:
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"
git add packages/core docs/adr/* eslint.config.* biome.json
git commit -m "feat(phase-b): core shared kernel implemented"

Confirm the commit was successful.
```

---

## Step B3: Infrastructure Surface Definition

### Step B3.1: Create Infrastructure Interfaces

**🔗 COPY THIS TO CLAUDE CODE:**

```
I'm implementing DevNet phase-b architecture infrastructure surface (Step B3).

PROJECT CONTEXT:
- Working directory: ${DEVNET_HOME:-~/Projects/devnet/}
- Goal: Infrastructure interfaces and anti-corruption layers (NO concrete implementations)
- Purpose: Contracts that adapters will implement for external integrations
- Architecture: Dependency inversion - interfaces in infrastructure, implementations later

CURRENT STATUS: Contracts and core complete, now defining infrastructure boundaries
SPECIFIC TASK: Execute Step B3 from phase-b-architecture.md

ARCHITECTURE REQUIREMENT:
Create interface definitions only - no concrete implementations yet:
- Repository interfaces for all major aggregates (User, Organization, Subscription, etc.)
- Service interfaces for external integrations (Storage, Email, Payments, AI)
- Anti-corruption layers for external service integration
- Shared mapper abstractions between domain and integration contracts
- Cross-cutting concerns (logging context, error translation)

Integration needs from feature specifications:
- Storage services (file upload, media management)
- Email services (transactional, notifications)
- Payment services (Stripe, LemonSqueezy, etc.)
- AI services (chat, embeddings)

INSTRUCTIONS:
Please execute the infrastructure scaffolding following the DevNet phase-b architecture plan.

Run these commands in sequence:
1. /create-spec "Infrastructure scaffolding — repository/service interfaces, anti-corruption layers, shared mapper strategy. Incorporate integration needs from features/storage/specification.md, features/email/specification.md, features/payments/specification.md, and features/api/specification.md."
2. /create-tasks
3. /execute-tasks

Ensure all deliverables from Step B3 are completed:
- packages/infrastructure with interface definitions only
- Repository interfaces aligned with domain aggregates
- Service abstractions for external integrations
- Anti-corruption layer base classes
- Shared infrastructure utilities and mappers
- No concrete implementations (use in-memory fakes for testing)
```

### Verification After B3

Run this to verify Step B3 completed successfully:

```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

echo "🔍 Step B3 Verification:"
echo "- Infrastructure package: $([ -d packages/infrastructure ] && [ -f packages/infrastructure/package.json ] && echo '✅' || echo '❌')"

if [ -d packages/infrastructure ]; then
  cd packages/infrastructure
  echo "- Interfaces directory: $([ -d src/interfaces ] && echo '✅' || echo '❌')"
  echo "- Shared utilities: $([ -d src/shared ] && echo '✅' || echo '❌')"
  echo "- Repository interfaces: $(find src -name '*Repository*.ts' | wc -l | tr -d ' ') found"
  echo "- Service interfaces: $(find src -name '*Service*.ts' | wc -l | tr -d ' ') found"
  echo "- Mapper abstractions: $(find src -name '*Mapper*.ts' | wc -l | tr -d ' ') found"
  cd ../..
fi

echo ""
echo "🧪 Infrastructure Build Test:"
pnpm --filter @repo/infrastructure build >/dev/null 2>&1 && echo "- Infrastructure builds: ✅" || echo "- Infrastructure builds: ❌"
pnpm lint --filter @repo/infrastructure >/dev/null 2>&1 && echo "- Dependency check: ✅" || echo "- Dependency check: ⚠️"
```

**Expected**: All items should show ✅, no dependency violations

### Step B3.2: Commit Infrastructure Interfaces

**🔗 COPY THIS TO CLAUDE CODE:**

```
I'm continuing DevNet phase-b architecture - committing the infrastructure interfaces.

TASK: Commit the infrastructure interface definitions and abstractions.

Please commit the infrastructure setup with this exact command structure:
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"
git add packages/infrastructure
git commit -m "feat(phase-b): infrastructure interfaces scaffolded"

Confirm the commit was successful.
```

---

## Step B4: Architecture Quality Gates

### Step B4.1: Implement Quality Enforcement

**🔗 COPY THIS TO CLAUDE CODE:**

```
I'm implementing DevNet phase-b architecture quality gates (Step B4) - the final step.

PROJECT CONTEXT:
- Working directory: ${DEVNET_HOME:-~/Projects/devnet/}
- Goal: Automated architecture testing and quality enforcement
- Purpose: Prevent architectural violations, enforce clean architecture boundaries
- Integration: CI pipeline, dependency rules, OpenAPI generation

CURRENT STATUS: Contracts, core, and infrastructure complete, now adding quality gates
SPECIFIC TASK: Execute Step B4 from phase-b-architecture.md

ARCHITECTURE REQUIREMENT:
Implement automated quality enforcement:
- Architecture tests preventing layer boundary violations
- Dependency-cruiser or similar for dependency rule enforcement
- CI pipeline integration for automated testing
- OpenAPI generation workflow integration
- Contract generation covering all domain areas from feature mapping

Domain coverage verification:
- Authentication (features/auth/specification.md)
- Organizations (features/organizations/specification.md)
- Billing & Payments (features/payments/specification.md)
- Platform Services (UI, storage, email from respective specifications)

INSTRUCTIONS:
Please execute the architecture quality gates following the DevNet phase-b architecture plan.

Run these commands in sequence:
1. /create-spec "Architecture quality gates — dependency enforcement, openapi generation workflow, ci wiring. Ensure coverage for all domains listed in the Feature Mapping table of freshstart/refined-plan/implementation-plan.md."
2. /create-tasks
3. /execute-tasks

Ensure all deliverables from Step B4 are completed:
- Architecture tests enforcing layer boundaries (dependency-cruiser or custom)
- CI pipeline updates for contracts build and architecture tests
- OpenAPI generation integrated into build process
- Dependency rule enforcement (no circular dependencies)
- Updated DEVNET-CHECKPOINT.txt with Phase B completion
- All packages building and testing successfully
```

### Verification After B4

Run this to verify Step B4 completed successfully:

```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

echo "🔍 Step B4 Verification:"

# Architecture testing
if [ -f ".dependency-cruiser.config.js" ] || find . -name "*arch*test*" | head -1 >/dev/null; then
  echo "- Architecture tests: ✅"
else
  echo "- Architecture tests: ⚠️ check for custom implementation"
fi

# CI integration
if [ -d ".github/workflows" ]; then
  echo "- CI workflows: $(find .github/workflows -name '*.yml' -o -name '*.yaml' | wc -l | tr -d ' ') files"
else
  echo "- CI workflows: ❌ missing .github/workflows/"
fi

# OpenAPI integration
grep -r "openapi\|swagger" packages/contracts/package.json >/dev/null 2>&1 && echo "- OpenAPI integration: ✅" || echo "- OpenAPI integration: ⚠️ verify script"

# Checkpoint
grep -q 'Phase B' DEVNET-CHECKPOINT.txt && echo "- Checkpoint updated: ✅" || echo "- Checkpoint updated: ❌"

echo ""
echo "🧪 Comprehensive Architecture Test:"
pnpm build >/dev/null 2>&1 && echo "- All packages build: ✅" || echo "- All packages build: ❌"
pnpm verify:local >/dev/null 2>&1 && echo "- Verification passes: ✅" || echo "- Verification passes: ❌"

# Package dependencies
echo ""
echo "📦 Package Dependencies:"
echo "- Contracts → Core: $(grep -q '@repo/core' packages/contracts/package.json && echo '❌ violation' || echo '✅ clean')"
echo "- Core → Infrastructure: $(grep -q '@repo/infrastructure' packages/core/package.json && echo '❌ violation' || echo '✅ clean')"
echo "- Infrastructure → Contracts: $(grep -q '@repo/contracts' packages/infrastructure/package.json && echo '✅ expected' || echo '⚠️ review')"
```

**Expected**: Architecture tests exist, CI configured, all builds pass, dependencies are clean

### Step B4.2: Final Commit & Phase Completion

**🔗 COPY THIS TO CLAUDE CODE:**

```
I'm completing DevNet phase-b architecture - final commit and phase validation.

TASKS:
1. Commit the architecture quality gates
2. Validate Phase B completion
3. Prepare for Phase C transition

Please execute:

1. Commit architecture gates:
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"
git add .github/workflows/ DEVNET-CHECKPOINT.txt DEVNET-PROGRESS.md .dependency-cruiser.* package.json
git commit -m "chore(phase-b): architecture gates enforced"

2. Run complete Phase B validation:
- Verify all packages build (pnpm build)
- Confirm all tests pass
- Validate architecture boundaries
- Check OpenAPI generation works

3. Update checkpoint with Phase B completion and Phase C preparation.

Show final status and confirm Phase B is complete and ready for Phase C.
```

---

## Phase B Completion

### Final Verification

Run this comprehensive check to confirm Phase B is complete:

```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

echo "🎯 Phase B Architecture Spine Verification:"
echo ""

# Package structure
echo "📦 Package Structure:"
for pkg in contracts core infrastructure; do
  if [ -d "packages/$pkg" ] && [ -f "packages/$pkg/package.json" ]; then
    echo "- packages/$pkg: ✅"
  else
    echo "- packages/$pkg: ❌ missing"
  fi
done

# Build verification
echo ""
echo "🔨 Build Verification:"
pnpm build >/dev/null 2>&1 && echo "- Full build: ✅" || echo "- Full build: ❌"

# Test verification
echo ""
echo "🧪 Test Verification:"
for pkg in contracts core infrastructure; do
  if pnpm --filter "@repo/$pkg" test >/dev/null 2>&1; then
    echo "- $pkg tests: ✅"
  else
    echo "- $pkg tests: ❌"
  fi
done

# Architecture quality
echo ""
echo "🏗️ Architecture Quality:"
pnpm lint >/dev/null 2>&1 && echo "- Clean dependencies: ✅" || echo "- Clean dependencies: ❌"
pnpm --filter @repo/contracts build:openapi >/dev/null 2>&1 && echo "- OpenAPI generation: ✅" || echo "- OpenAPI generation: ⚠️"
pnpm verify:local >/dev/null 2>&1 && echo "- Overall verification: ✅" || echo "- Overall verification: ❌"

# Progress tracking
echo ""
echo "📋 Progress Tracking:"
grep -q 'Phase B' DEVNET-CHECKPOINT.txt && echo "- Checkpoint updated: ✅" || echo "- Checkpoint updated: ❌"
[ $(git status --porcelain | wc -l) -eq 0 ] && echo "- Git state clean: ✅" || echo "- Git state clean: ❌"

echo ""
if pnpm verify:local >/dev/null 2>&1 && [ $(git status --porcelain | wc -l) -eq 0 ]; then
  echo "🎉 Phase B Complete! Architecture spine established."
  echo ""
  echo "✅ What you've built:"
  echo "   • Contract schemas with OpenAPI generation"
  echo "   • Clean architecture shared kernel (Entity, ValueObject, etc.)"
  echo "   • Infrastructure interface definitions"
  echo "   • Architecture quality gates and CI integration"
  echo ""
  echo "Next Steps:"
  echo "1. Proceed to Phase C: Domain Capability Waves"
  echo "2. Use phase-c-instructions.md for next steps"
else
  echo "❌ Phase B not complete. Review failed items above."
fi
```

### Phase B Acceptance Criteria

✅ **Contracts Package**: Zod schemas with OpenAPI generation
✅ **Core Shared Kernel**: Domain primitives with 100% coverage
✅ **Infrastructure Interfaces**: Repository and service contracts
✅ **Quality Gates**: Architecture tests and CI integration
✅ **Verification**: `pnpm verify:local` passes consistently

### Troubleshooting

**Issue**: Circular dependency errors
**Solution**: Check package import directions. Contracts → dependency-free, Core → uses Contracts, Infrastructure → uses both.

**Issue**: OpenAPI generation fails
**Solution**: Ensure zod-to-openapi tooling is configured in contracts package.

**Issue**: Architecture tests failing
**Solution**: Review dependency-cruiser config. Ensure clean layer separation.

**Issue**: Coverage below 100% for core
**Solution**: Add missing tests for shared kernel utilities.

---

## Next Phase

**🎉 Phase B Complete!**

**What you've accomplished:**
- ✅ Contract schemas defining all API interfaces
- ✅ Clean architecture primitives (Entity, ValueObject, DomainEvent, etc.)
- ✅ Infrastructure interfaces for external integrations
- ✅ Architecture quality gates preventing violations
- ✅ CI integration and automated testing

**👉 Next**: Proceed to **[Phase C: Domain Capability Waves](phase-c-instructions.md)** to implement the actual business logic across 4 domain areas: Authentication, Organizations, Billing, and Platform Services.
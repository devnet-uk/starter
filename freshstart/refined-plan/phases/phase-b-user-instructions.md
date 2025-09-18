# Phase B: Architecture Spine — User Instructions

> **Goal**: Create the foundational architecture with contracts, core abstractions, and infrastructure interfaces.

## Quick Context

You're building the architectural foundation that all domain logic will depend on. This includes API contracts (Zod schemas), clean architecture primitives (entities, value objects), and infrastructure interfaces (repositories, services) - but no concrete implementations yet.

**Duration**: 4-6 hours
**Prerequisites**: Phase A complete with workspace validation passing
**Next Phase**: Phase C (Domain Capability Waves)

## Before You Start

### Phase A Completion Check
Copy and run this verification:

```bash
DEVNET_PATH="${DEVNET_HOME:-$HOME/Projects/devnet}"
cd "$DEVNET_PATH"

echo "🔍 Phase A Prerequisites Check:"
echo "- Working directory: $(pwd)"
echo "- Git initialized: $([ -d .git ] && echo '✅' || echo '❌')"
echo "- pnpm workspace: $([ -f pnpm-workspace.yaml ] && echo '✅' || echo '❌')"
echo "- Verify command: $(pnpm verify:local >/dev/null 2>&1 && echo '✅ passes' || echo '❌ fails')"
echo "- Clean git state: $([ $(git status --porcelain | wc -l) -eq 0 ] && echo '✅' || echo '❌ uncommitted changes')"
echo ""

if [ -f DEVNET-CHECKPOINT.txt ]; then
  echo "📋 Last Checkpoint:"
  tail -3 DEVNET-CHECKPOINT.txt
else
  echo "❌ Missing DEVNET-CHECKPOINT.txt - ensure Phase A is complete"
fi
```

### Expected Output
All items should show ✅. If not, complete Phase A first.

---

## Step B1: Contracts Package Creation

### What You're Doing
Creating a contracts package with Zod schemas, HTTP request/response types, and OpenAPI generation - serving as the single source of truth for API contracts.

### Copy This Into Claude Code:

```
I need to implement Phase B, Step B1: Contracts Package Creation for the DevNet architecture spine.

**Context**:
- This is Phase B of the DevNet clean architecture implementation
- I'm building the foundational contracts package that will be the single source of truth for all API contracts
- This package must have zero downstream dependencies and will be consumed by both API and frontend

**Requirements**:
1. Create `packages/contracts` as a new workspace package
2. Implement Zod schemas for all major domain contracts
3. Set up OpenAPI generation workflow from the schemas
4. Create contract tests ensuring schema integrity
5. Set up proper package exports with barrel files (api, domain, schemas modules)

**Feature Specifications to Reference**:
- `features/auth/specification.md` - Authentication contracts
- `features/organizations/specification.md` - Organization and membership contracts
- `features/payments/specification.md` - Billing and subscription contracts
- `features/api/specification.md` - General API patterns and conventions

**Architecture Standards**:
- Follow `docs/standards/development/api-contracts.md`
- Ensure zero circular dependencies
- ≥95% test coverage for all contract schemas
- OpenAPI generation must be automated via npm script

**Deliverables**:
- `packages/contracts/` package with proper package.json
- Zod schemas organized by domain (auth, organizations, billing, etc.)
- Barrel exports for clean imports
- OpenAPI generation script (e.g., `pnpm --filter @repo/contracts build:openapi`)
- Contract validation tests
- Updated workspace configuration to include new package

Please create this contracts package step-by-step, ensuring all schemas are properly typed and tested.
```

### Verify Success:
```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

echo "🔍 Contracts Package Verification:"
echo "- Package directory: $([ -d packages/contracts ] && echo '✅' || echo '❌')"
echo "- Package.json: $([ -f packages/contracts/package.json ] && echo '✅' || echo '❌')"
echo "- Workspace config: $(grep -q contracts pnpm-workspace.yaml && echo '✅' || echo '❌')"

if [ -d packages/contracts ]; then
  cd packages/contracts
  echo "- Source directory: $([ -d src ] && echo '✅' || echo '❌')"
  echo "- Schema files: $(find src -name '*.ts' | wc -l | tr -d ' ') files found"
  echo "- Test files: $(find . -name '*.test.ts' -o -name '*.spec.ts' | wc -l | tr -d ' ') test files found"

  # Check if OpenAPI script exists
  if [ -f package.json ]; then
    if grep -q "build:openapi" package.json; then
      echo "- OpenAPI script: ✅"
    else
      echo "- OpenAPI script: ❌ missing"
    fi
  fi

  cd ../..
fi

# Test build
echo ""
echo "🧪 Build Test:"
if pnpm --filter @repo/contracts build >/dev/null 2>&1; then
  echo "- Package builds: ✅"
else
  echo "- Package builds: ❌ build failed"
fi
```

### Expected Output
- All package structure items should show ✅
- Build test should pass
- Should find multiple schema and test files

### Commit Checkpoint
```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"
git add packages/contracts pnpm-workspace.yaml turbo.json
git commit -m "feat(phase-b): contracts package established"
```

---

## Step B2: Core Shared Kernel

### What You're Doing
Creating the shared domain primitives (Entity, ValueObject, DomainEvent, Result types) that all domain logic will inherit from, following clean architecture principles.

### Copy This Into Claude Code:

```
Phase B, Step B2: Core Shared Kernel implementation - the foundational domain abstractions.

**Context**:
- Building clean architecture shared kernel in `packages/core`
- These are the base classes and utilities that all domain entities and value objects will extend
- Must maintain 100% test coverage and zero framework dependencies

**Requirements**:
1. Create `packages/core` as a new workspace package
2. Implement clean architecture base classes:
   - `Entity<T>` - Base entity with identity and equality
   - `ValueObject<T>` - Immutable value objects with structural equality
   - `DomainEvent` - Base class for domain events with metadata
   - `Result<T, E>` - Railway-oriented programming for error handling
   - `Guard` - Argument validation utilities
3. Create domain primitive types and utilities
4. Set up architectural tests preventing framework imports
5. Implement comprehensive test suites with 100% coverage

**Feature Specifications to Reference**:
Look across all feature specifications to identify common domain concepts:
- `features/auth/specification.md` - User, Session entities
- `features/organizations/specification.md` - Organization, Member entities
- `features/payments/specification.md` - Subscription, Invoice entities
- `features/ui-components/specification.md` - Shared component patterns

**Architecture Standards**:
- Follow `docs/standards/architecture/clean-architecture.md`
- Ensure zero dependencies on external frameworks
- All abstractions must be generic and reusable
- Domain purity enforced via ESLint/Biome rules

**Quality Requirements**:
- 100% unit test coverage for all shared kernel code
- No circular dependencies
- Framework-agnostic implementations
- Comprehensive JSDoc documentation

**Deliverables**:
- `packages/core/src/domain/shared/` with base abstractions
- Test suites covering all functionality
- ESLint/Biome rules preventing framework imports
- Updated workspace and turbo configuration

Create the shared kernel with strong typing and comprehensive tests.
```

### Verify Success:
```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

echo "🔍 Core Shared Kernel Verification:"
echo "- Package directory: $([ -d packages/core ] && echo '✅' || echo '❌')"
echo "- Package.json: $([ -f packages/core/package.json ] && echo '✅' || echo '❌')"

if [ -d packages/core ]; then
  cd packages/core
  echo "- Source structure: $([ -d src/domain/shared ] && echo '✅' || echo '❌')"
  echo "- Base classes: $(find src -name '*.ts' | grep -E '(Entity|ValueObject|DomainEvent|Result|Guard)' | wc -l | tr -d ' ') found"
  echo "- Test coverage: $(find . -name '*.test.ts' -o -name '*.spec.ts' | wc -l | tr -d ' ') test files"
  cd ../..
fi

# Test core package build and tests
echo ""
echo "🧪 Core Package Tests:"
if pnpm --filter @repo/core build >/dev/null 2>&1; then
  echo "- Core builds: ✅"
else
  echo "- Core builds: ❌ build failed"
fi

if pnpm --filter @repo/core test >/dev/null 2>&1; then
  echo "- Core tests: ✅ pass"
else
  echo "- Core tests: ❌ failing or missing"
fi

# Check coverage (if configured)
echo "- Coverage report: $(find packages/core -name 'coverage' -type d >/dev/null && echo '✅ generated' || echo '⚠️  run tests to generate')"
```

### Expected Output
- All package structure items should show ✅
- Should find multiple base class files
- Build and tests should pass

### Commit Checkpoint
```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"
git add packages/core docs/adr/* eslint.config.* biome.json
git commit -m "feat(phase-b): core shared kernel implemented"
```

---

## Step B3: Infrastructure Surface Definition

### What You're Doing
Creating infrastructure interfaces and anti-corruption layers without concrete implementations - establishing the contracts that adapters will implement later.

### Copy This Into Claude Code:

```
Phase B, Step B3: Infrastructure Surface Definition - establishing adapter interfaces and boundaries.

**Context**:
- Creating `packages/infrastructure` with interface definitions only
- No concrete implementations yet - just the contracts that adapters will fulfill
- Focus on anti-corruption layers and integration patterns

**Requirements**:
1. Create `packages/infrastructure` workspace package
2. Define repository interfaces for all major aggregates
3. Create service interfaces for external integrations
4. Implement anti-corruption layer patterns
5. Set up shared mapper abstractions
6. Define cross-cutting concerns (logging, error handling)

**Integration Requirements from Features**:
- `features/storage/specification.md` - File and media storage interfaces
- `features/email/specification.md` - Email service abstractions
- `features/payments/specification.md` - Payment provider interfaces
- `features/api/specification.md` - API integration patterns

**Architecture Standards**:
- Follow `docs/standards/architecture/integration-strategy.md`
- Dependency inversion principle - interfaces in core, implementations in infrastructure
- Anti-corruption layers for all external services
- Shared mapping strategies between domain and integration contracts

**Structure**:
- `src/interfaces/` - Repository and service interfaces
- `src/shared/` - Base mapper abstractions and utilities
- `src/types/` - Infrastructure-specific type definitions
- Cross-cutting concerns: logging context, error translation, etc.

**Quality Requirements**:
- All interfaces must be generic and testable
- No concrete implementations (use in-memory fakes for testing)
- Clear separation between domain contracts and external contracts
- Comprehensive interface documentation

**Deliverables**:
- Infrastructure interfaces package
- Repository interfaces aligned with domain aggregates
- Service abstractions for external integrations
- Anti-corruption layer base classes
- Shared infrastructure utilities

Create the infrastructure surface that enables clean separation between domain and external concerns.
```

### Verify Success:
```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

echo "🔍 Infrastructure Interfaces Verification:"
echo "- Package directory: $([ -d packages/infrastructure ] && echo '✅' || echo '❌')"
echo "- Package.json: $([ -f packages/infrastructure/package.json ] && echo '✅' || echo '❌')"

if [ -d packages/infrastructure ]; then
  cd packages/infrastructure
  echo "- Interfaces dir: $([ -d src/interfaces ] && echo '✅' || echo '❌')"
  echo "- Shared utilities: $([ -d src/shared ] && echo '✅' || echo '❌')"
  echo "- Repository interfaces: $(find src -name '*Repository*.ts' | wc -l | tr -d ' ') found"
  echo "- Service interfaces: $(find src -name '*Service*.ts' | wc -l | tr -d ' ') found"
  echo "- Mapper abstractions: $(find src -name '*Mapper*.ts' | wc -l | tr -d ' ') found"
  cd ../..
fi

echo ""
echo "🧪 Infrastructure Build Test:"
if pnpm --filter @repo/infrastructure build >/dev/null 2>&1; then
  echo "- Infrastructure builds: ✅"
else
  echo "- Infrastructure builds: ❌ build failed"
fi

# Check for dependency violations
echo "- Dependency check: $(pnpm lint --filter @repo/infrastructure >/dev/null 2>&1 && echo '✅ clean' || echo '⚠️  review lint output')"
```

### Expected Output
- All package structure items should show ✅
- Should find multiple interface files for repositories and services
- Build should pass with no dependency violations

### Commit Checkpoint
```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"
git add packages/infrastructure
git commit -m "feat(phase-b): infrastructure interfaces scaffolded"
```

---

## Step B4: Architecture Quality Gates

### What You're Doing
Setting up automated architecture testing, dependency enforcement, OpenAPI generation workflows, and CI integration to prevent architectural violations.

### Copy This Into Claude Code:

```
Phase B, Step B4: Architecture Quality Gates - the final step ensuring architectural integrity.

**Context**:
- Implementing automated architecture testing and quality gates
- Setting up CI pipeline integration for the architecture packages
- Ensuring dependency rules and clean architecture boundaries are enforced

**Requirements**:
1. Set up architecture testing (dependency-cruiser, ArchUnit-style tests, or custom rules)
2. Configure CI pipeline to build and test contracts, core, and infrastructure packages
3. Set up OpenAPI generation workflow as part of build process
4. Create dependency rule enforcement (prevent violations of clean architecture)
5. Update DEVNET-CHECKPOINT.txt with Phase B completion status
6. Ensure all architecture verification blocks pass

**Verification Domains**:
Ensure coverage for all domains listed in the Feature Mapping table:
- Authentication (from `features/auth/specification.md`)
- Organizations (from `features/organizations/specification.md`)
- Billing & Payments (from `features/payments/specification.md`)
- Platform Services (UI, storage, email from respective feature specifications)

**Quality Gates**:
- Dependency-cruiser or similar tool enforcing layer boundaries
- OpenAPI schema generation from contracts package
- CI pipeline running contract tests and architecture tests
- No circular dependencies between packages
- Clean architecture rules enforced via linting/testing

**Architecture Standards**:
- Apply `docs/standards/architecture/clean-architecture.md` verification blocks
- Follow CI/CD standards for automated quality gates
- Ensure contracts ↔ implementation parity checks

**Deliverables**:
- Architecture tests preventing layer violations
- CI workflow updates (GitHub Actions, etc.)
- OpenAPI generation integrated into build process
- Updated checkpoint files with Phase B exit summary
- Comprehensive verification that all quality gates pass

Complete the architecture spine with bulletproof quality enforcement.
```

### Verify Success:
```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

echo "🔍 Architecture Quality Gates Verification:"

# Check for architecture testing
if [ -f ".dependency-cruiser.config.js" ] || [ -f "dependency-cruiser.config.json" ] || find . -name "*arch*test*" -o -name "*architecture*" | grep -q test; then
  echo "- Architecture tests: ✅"
else
  echo "- Architecture tests: ⚠️  check for custom implementation"
fi

# Check CI configuration
if [ -d ".github/workflows" ]; then
  echo "- CI workflows: $(find .github/workflows -name '*.yml' -o -name '*.yaml' | wc -l | tr -d ' ') workflow files"
else
  echo "- CI workflows: ❌ missing .github/workflows/"
fi

# Check OpenAPI generation
echo "- OpenAPI integration: $(grep -r "openapi\|swagger" packages/contracts/package.json >/dev/null 2>&1 && echo '✅' || echo '⚠️  verify build script')"

# Check checkpoint update
echo "- Checkpoint update: $(grep -q 'Phase B' DEVNET-CHECKPOINT.txt && echo '✅' || echo '❌')"

echo ""
echo "🧪 Comprehensive Architecture Test:"
# Test all packages build together
if pnpm build >/dev/null 2>&1; then
  echo "- All packages build: ✅"
else
  echo "- All packages build: ❌ build failure"
fi

# Test verification command
if pnpm verify:local >/dev/null 2>&1; then
  echo "- Verification passes: ✅"
else
  echo "- Verification passes: ❌ failing checks"
fi

# Check package interdependencies
echo ""
echo "📦 Package Dependencies:"
echo "- Contracts → Core: $(grep -q '@repo/core' packages/contracts/package.json && echo '❌ violation' || echo '✅ clean')"
echo "- Core → Infrastructure: $(grep -q '@repo/infrastructure' packages/core/package.json && echo '❌ violation' || echo '✅ clean')"
echo "- Infrastructure → Contracts: $(grep -q '@repo/contracts' packages/infrastructure/package.json && echo '✅ expected' || echo '⚠️  review')"
```

### Expected Output
- Architecture tests should exist in some form
- CI workflows should be configured
- All packages should build successfully
- `pnpm verify:local` should pass
- Dependency directions should be clean (no violations)

### Final Commit Checkpoint
```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"
git add .github/workflows/ DEVNET-CHECKPOINT.txt DEVNET-PROGRESS.md .dependency-cruiser.* package.json
git commit -m "chore(phase-b): architecture gates enforced"
```

---

## Phase B Completion

### Comprehensive Verification
Run this complete verification of the architecture spine:

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
if pnpm build >/dev/null 2>&1; then
  echo "- Full build: ✅ all packages build"
else
  echo "- Full build: ❌ build failures"
fi

# Test verification
echo ""
echo "🧪 Test Verification:"
for pkg in contracts core infrastructure; do
  if [ -d "packages/$pkg" ]; then
    if pnpm --filter "@repo/$pkg" test >/dev/null 2>&1; then
      echo "- $pkg tests: ✅ pass"
    else
      echo "- $pkg tests: ❌ failing or missing"
    fi
  fi
done

# Architecture quality
echo ""
echo "🏗️  Architecture Quality:"
echo "- Clean dependencies: $(pnpm lint >/dev/null 2>&1 && echo '✅' || echo '❌ violations')"
echo "- OpenAPI generation: $(pnpm --filter @repo/contracts build:openapi >/dev/null 2>&1 && echo '✅' || echo '⚠️  check script')"
echo "- Overall verification: $(pnpm verify:local >/dev/null 2>&1 && echo '✅' || echo '❌')"

# Progress tracking
echo ""
echo "📋 Progress Tracking:"
echo "- Checkpoint updated: $(grep -q 'Phase B' DEVNET-CHECKPOINT.txt && echo '✅' || echo '❌')"
echo "- Git state clean: $([ $(git status --porcelain | wc -l) -eq 0 ] && echo '✅' || echo '❌ uncommitted changes')"

echo ""
if pnpm verify:local >/dev/null 2>&1 && [ $(git status --porcelain | wc -l) -eq 0 ]; then
  echo "🎉 Phase B Complete! Architecture spine established."
  echo ""
  echo "✅ What you've built:"
  echo "   • Contract schemas with OpenAPI generation"
  echo "   • Clean architecture shared kernel"
  echo "   • Infrastructure interface definitions"
  echo "   • Architecture quality gates and CI"
  echo ""
  echo "Next Steps:"
  echo "1. Return to the USER-EXECUTION-GUIDE.md"
  echo "2. Proceed to Phase C: Domain Capability Waves"
else
  echo "❌ Phase B not complete. Review failed items above."
  echo ""
  echo "Common fixes:"
  echo "- Run 'pnpm install' if build failures"
  echo "- Commit any uncommitted changes"
  echo "- Check that all tests pass individually"
fi
```

### Phase B Acceptance Criteria
✅ **Contracts Package**: Zod schemas with OpenAPI generation
✅ **Core Shared Kernel**: Domain primitives with 100% coverage
✅ **Infrastructure Interfaces**: Repository and service contracts
✅ **Quality Gates**: Architecture tests and CI integration
✅ **Verification**: `pnpm verify:local` passes consistently

### Rollback Procedure (If Needed)
If Phase B needs to be restarted:

```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

# Reset to Phase A completion
git reset --hard HEAD~4  # Adjust based on number of Phase B commits
rm -rf packages/contracts packages/core packages/infrastructure
git clean -fd
```

### Troubleshooting Common Issues

**Issue**: Circular dependency errors
**Solution**: Check that packages don't import from each other in wrong directions. Contracts should be dependency-free, Core can use Contracts, Infrastructure can use both.

**Issue**: OpenAPI generation fails
**Solution**: Ensure zod-to-openapi or similar tooling is properly configured in contracts package.

**Issue**: Architecture tests failing
**Solution**: Review dependency-cruiser config or custom architecture test rules. Ensure clean separation between layers.

**Issue**: Coverage below 100% for core
**Solution**: Add missing test cases for all shared kernel utilities. Core domain logic must have complete test coverage.

---

**Phase B Complete!** 🏗️

**Next**: Return to [USER-EXECUTION-GUIDE.md](../USER-EXECUTION-GUIDE.md) and proceed to **Phase C: Domain Capability Waves**.
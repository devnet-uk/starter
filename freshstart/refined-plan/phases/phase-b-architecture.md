# Phase B: Architecture Spine

## Overview

- Phase: Architecture Spine
- Coverage Target: 100% for `packages/core` shared kernel and contracts unit coverage ≥95%
- Status: Ready for execution after Phase A acceptance
- Duration: 4 structured steps (contracts, core kernel, infrastructure adapters, quality gates)
- Next Phase: Phase C — Domain Capability Waves

## Prerequisites & Working Directory

**Required Workspaces**:
- Primary: `${DEVNET_HOME:-~/Projects/devnet/}`
- Secondary (reference): `${ENGINEERING_OS_HOME:-~/Projects/devnet.starter/}`

**Workspace Guard**
```bash
DEVNET_PATH="${DEVNET_HOME:-$HOME/Projects/devnet}"
REMOTE_EXPECTED="${DEVNET_GIT_REMOTE:-}"
ORIGIN_URL=""
if [ -d "$DEVNET_PATH/.git" ]; then
  ORIGIN_URL="$(cd "$DEVNET_PATH" && git config --get remote.origin.url 2>/dev/null)"
fi
if [ ! -d "$DEVNET_PATH/.git" ]; then
  echo "❌ $DEVNET_PATH is not initialized — complete Phase A bootstrap first"
elif [ -n "$REMOTE_EXPECTED" ] && [ "$ORIGIN_URL" != "$REMOTE_EXPECTED" ]; then
  echo "❌ origin remote mismatch — set via: git -C $DEVNET_PATH remote set-url origin $REMOTE_EXPECTED"
else
  echo "✅ Workspace ready at $DEVNET_PATH"
fi
```

**Quick Workspace Check**
```bash
DEVNET_PATH="${DEVNET_HOME:-$HOME/Projects/devnet}"
if [ "$(pwd)" = "$(cd "$DEVNET_PATH" && pwd 2>/dev/null)" ]; then
  echo "✅"
else
  echo "❌ cd $DEVNET_PATH"
fi
```

Ensure Phase A checkpoints marked complete in `DEVNET-CHECKPOINT.txt` before starting.

## Phase Acceptance

- `packages/contracts` published as source of truth (Zod schemas, DTOs, OpenAPI generation) with zero downstream dependencies
- `packages/core` contains clean architecture primitives (Entity, ValueObject, DomainEvent, Result, Guard)
- `packages/infrastructure` seeded with adapter interfaces + anti-corruption layers, but no concrete service logic yet
- Dependency directions validated via `pnpm lint` (import lint rules) and architecture tests (e.g., dependency-cruiser or custom Biome rule)
- Shared observability + error handling primitives defined and unit-tested
- `/execute-tasks` run referencing architecture standards returns green

## Standards & Intents

- Architecture: `docs/standards/architecture/clean-architecture.md`, `integration-strategy.md`
- API contracts: `docs/standards/development/api-contracts.md`
- Testing: `docs/standards/development/testing-strategy.md`

## Implementation Steps

### Step B1: Contracts Package Creation

<user-action-required>
⚠️ USER ACTION: Type the following commands directly into Claude Code:

1. Copy and paste this command:
   /create-spec "Contracts package bootstrap — zod schemas, HTTP contracts, OpenAPI automation. Pull requirements from features/auth/specification.md, features/organizations/specification.md, features/payments/specification.md, and features/api/specification.md."

2. After the spec is created, type:
   /create-tasks

3. Once tasks are generated, type:
   /execute-tasks
</user-action-required>

**Deliverables**
- `packages/contracts` with module barrels (api, domain, schemas)
- Generated OpenAPI doc script (e.g., `pnpm --filter @repo/contracts build:openapi`)
- Contract tests ensuring schema integrity
- Feature inputs: `features/auth/specification.md`, `features/organizations/specification.md`, `features/payments/specification.md`, `features/api/specification.md`

**Validation**
- Follow verification guidance embedded in `docs/standards/development/api-contracts.md` (coverage ≥95%) via the `/execute-tasks` Step 6 verification runner.

**Commit Point**
```bash
git add packages/contracts pnpm-workspace.yaml turbo.json
git commit -m "feat(phase-b): contracts package established"
```

### Step B2: Core Shared Kernel

<user-action-required>
⚠️ USER ACTION: Type the following commands directly into Claude Code:

1. Copy and paste this command:
   /create-spec "Core shared kernel — entities, value objects, domain events, result/guard utilities. Reference terminology across features/auth/specification.md, features/organizations/specification.md, features/payments/specification.md, and features/ui-components/specification.md."

2. After the spec is created, type:
   /create-tasks

3. Once tasks are generated, type:
   /execute-tasks
</user-action-required>

**Deliverables**
- `packages/core/src/domain/shared` primitives with 100% unit coverage
- Architectural docs capturing dependency inversion patterns
- ESLint/Biome rules preventing framework imports in core
- Feature inputs: shared glossary from `features/*/specification.md` (use entities and domain concepts to drive base abstractions)

**Validation**
- Enforce the 100% coverage and domain purity requirements defined in `docs/standards/architecture/clean-architecture.md` through the `/execute-tasks` verification blocks.

**Commit Point**
```bash
git add packages/core docs/adr/*
git commit -m "feat(phase-b): core shared kernel implemented"
```

### Step B3: Infrastructure Surface Definition

<user-action-required>
⚠️ USER ACTION: Type the following commands directly into Claude Code:

1. Copy and paste this command:
   /create-spec "Infrastructure scaffolding — repository/service interfaces, anti-corruption layers, shared mapper strategy. Incorporate integration needs from features/storage/specification.md, features/email/specification.md, features/payments/specification.md, and features/api/specification.md."

2. After the spec is created, type:
   /create-tasks

3. Once tasks are generated, type:
   /execute-tasks
</user-action-required>

**Deliverables**
- Interface definitions for persistence, cache, email, storage (no concrete logic yet)
- Base mapper abstractions in `packages/infrastructure/src/shared`
- Cross-cutting concerns (logging context, error translation) introduced
- Feature inputs: integration requirements from `features/storage/specification.md`, `features/email/specification.md`, `features/payments/specification.md`, `features/api/specification.md`

**Validation**
- Use the infrastructure guidance in `docs/standards/architecture/integration-strategy.md`; the verification runner covers dependency-rule checks during `/execute-tasks`.

**Commit Point**
```bash
git add packages/infrastructure
git commit -m "feat(phase-b): infrastructure interfaces scaffolded"
```

### Step B4: Architecture Quality Gates

<user-action-required>
⚠️ USER ACTION: Type the following commands directly into Claude Code:

1. Copy and paste this command:
   /create-spec "Architecture quality gates — dependency enforcement, openapi generation workflow, ci wiring. Ensure coverage for all domains listed in the Feature Mapping table of freshstart/refined-plan/implementation-plan.md."

2. After the spec is created, type:
   /create-tasks

3. Once tasks are generated, type:
   /execute-tasks
</user-action-required>

**Deliverables**
- Architecture tests (dependency-cruiser/ts-auto-guard) ensuring layer boundaries
- CI pipeline updates to run contracts build + tests
- Updated `DEVNET-CHECKPOINT.txt` with Phase B exit summary + next phase pointer
- Feature inputs: ensure contract generation covers all domains listed in `freshstart/refined-plan/implementation-plan.md` Feature Mapping table

**Validation**
- Apply the Clean Architecture and CI standards; `/execute-tasks` verification will cover dependency rules, OpenAPI generation, and CI gating.

**Commit Point**
```bash
git add .github/workflows/ DEVNET-CHECKPOINT.txt DEVNET-PROGRESS.md
git commit -m "chore(phase-b): architecture gates enforced"
```

## References

- `freshstart/refined-plan/implementation-plan.md`
- `freshstart/refined-plan/phases/phase-c-domain.md`
- Feature specs: auth, organizations, payments (`features/*/specification.md`)

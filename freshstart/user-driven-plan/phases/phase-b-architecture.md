# Phase B: Architecture Spine (User-Driven)

## Agent Brief (copy/paste to start)
```
You are assisting with Phase B: Architecture Spine for the DevNet migration. Focus on building the contracts package, shared core kernel, infrastructure interface layer, and architecture quality gates. Expect to consume feature specifications across auth, organizations, payments, api, storage, email, and ui components. I will send you each step manually; wait for my instructions before acting.
```

## Phase Overview
- Coverage target: 100% for `packages/core` shared kernel; ≥95% for contracts
- Duration: 4 steps (contracts, core kernel, infrastructure interfaces, quality gates)
- Next phase: Phase C — Domain Capability Waves

## Prerequisites
- Implementation workspace prepared during Phase A (`${DEVNET_HOME:-~/Projects/devnet/}`)
- `DEVNET-CHECKPOINT.txt` shows Phase A exit as complete
- Origin remote validated if `DEVNET_GIT_REMOTE` provided

### Workspace Guard (optional)
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

## Acceptance Checklist
- `packages/contracts` established as schema/DTO source of truth (no runtime downstream deps)
- `packages/core` houses clean architecture primitives with 100% unit coverage
- `packages/infrastructure` defines adapter interfaces + anti-corruption layers without concrete adapters
- Dependency directions enforced via lint/verification tooling
- Shared observability + error handling primitives created and tested
- `/execute-tasks` run referencing architecture standards returns green

## Manual Step Runner

### Step B1: Contracts Package Creation
**Message to send:**
```
/create-spec "Contracts package bootstrap — zod schemas, HTTP contracts, OpenAPI automation. Pull requirements from features/auth/specification.md, features/organizations/specification.md, features/payments/specification.md, and features/api/specification.md."
/create-tasks
/execute-tasks
```

**Key Deliverables**
- `packages/contracts` with structured barrels (api, domain, schemas)
- OpenAPI generation script (e.g., `pnpm --filter @repo/contracts build:openapi`)
- Contract tests covering ≥95% schema branches
- Contracts documented per `docs/standards/development/api-contracts.md`

**Suggested Commit**
```
git add packages/contracts pnpm-workspace.yaml turbo.json
git commit -m "feat(phase-b): contracts package established"
```

### Step B2: Core Shared Kernel
**Message to send:**
```
/create-spec "Core shared kernel — entities, value objects, domain events, result/guard utilities. Reference terminology across features/auth/specification.md, features/organizations/specification.md, features/payments/specification.md, and features/ui-components/specification.md."
/create-tasks
/execute-tasks
```

**Key Deliverables**
- `packages/core/src/domain/shared` primitives with 100% unit coverage
- Architectural docs for dependency inversion patterns
- Lint rules preventing framework imports within `packages/core`

**Suggested Commit**
```
git add packages/core docs/adr/
git commit -m "feat(phase-b): core shared kernel implemented"
```

### Step B3: Infrastructure Surface Definition
**Message to send:**
```
/create-spec "Infrastructure scaffolding — repository/service interfaces, anti-corruption layers, shared mapper strategy. Incorporate integration needs from features/storage/specification.md, features/email/specification.md, features/payments/specification.md, and features/api/specification.md."
/create-tasks
/execute-tasks
```

**Key Deliverables**
- Adapter interface definitions for persistence, cache, email, storage
- Base mapper abstractions in `packages/infrastructure/src/shared`
- Cross-cutting concerns (logging context, error translation) stubbed

**Suggested Commit**
```
git add packages/infrastructure
git commit -m "feat(phase-b): infrastructure interfaces scaffolded"
```

### Step B4: Architecture Quality Gates
**Message to send:**
```
/create-spec "Architecture quality gates — dependency enforcement, openapi generation workflow, ci wiring. Ensure coverage for all domains listed in the Feature Mapping table of freshstart/user-driven-plan/implementation-plan.md."
/create-tasks
/execute-tasks
```

**Key Deliverables**
- Architecture tests verifying dependency boundaries (dependency-cruiser or Biome rules)
- CI pipeline updates running contract build/tests automatically
- `DEVNET-CHECKPOINT.txt` updated with Phase B exit summary and next phase pointer

**Suggested Commit**
```
git add .github/workflows/ DEVNET-CHECKPOINT.txt DEVNET-PROGRESS.md
git commit -m "chore(phase-b): architecture gates enforced"
```

## References
- `docs/standards/architecture/clean-architecture.md`
- `docs/standards/architecture/integration-strategy.md`
- `docs/standards/development/api-contracts.md`
- Feature specs (`features/*/specification.md`) for auth, organizations, payments, api, storage, email, ui-components

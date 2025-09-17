# Phase B · Step B2 — Core Shared Kernel (Dry Run)

## Original Plan Excerpt

> ### Step B2: Core Shared Kernel
> ```claude
> Claude: /create-spec "Core shared kernel — entities, value objects, domain events, result/guard utilities"
> Claude: /create-tasks
> Claude: /execute-tasks
> ```
>
> **Deliverables**
> - `packages/core/src/domain/shared` primitives with 100% unit coverage
> - Architectural docs capturing dependency inversion patterns
> - ESLint/Biome rules preventing framework imports in core
>
> **Commit Point**
> ```bash
> git add packages/core docs/adr/*
> git commit -m "feat(phase-b): core shared kernel implemented"
> ```

## Dry-Run Command Plan

1. `Claude: /create-spec "Core shared kernel — entities, value objects, domain events, result/guard utilities. Reference terminology across features/auth/specification.md, features/organizations/specification.md, features/payments/specification.md, and features/ui-components/specification.md."`
   - Standards navigation: `architecture/clean-architecture.md`, `architecture/domain-verification.md`, `development/testing-strategy.md`.
   - Variables: `PROJECT_PHASE=phase-b`, `CORE_COVERAGE=100`, `PROJECT_NAME=devnet`, `DEVNET_HOME=${DEVNET_HOME:-~/Projects/devnet}`, `DEVNET_GIT_REMOTE=${DEVNET_GIT_REMOTE:-git@github.com:your-org/devnet.git}`.
2. `Claude: /create-tasks`
   - Expected tasks:
     - Run workspace guard (ensure `pwd` equals ``${DEVNET_HOME}`` and origin matches ``${DEVNET_GIT_REMOTE}``).
     - Implement base classes (`Entity`, `AggregateRoot`, `ValueObject`, `Result`, `Guard`, `DomainEvent`).
     - Add supporting utilities (UniqueId, DateTime wrappers, error codes).
     - Write comprehensive unit tests achieving 100% coverage.
     - Enforce lint rules preventing framework imports (Biome configuration updates).
     - Document architecture decisions in ADR (dependency rule enforcement).
     - Confirm standards-driven verification will cover coverage and purity in `/execute-tasks`.
3. `Claude: /execute-tasks`
   - Generates code/tests, updates lint configuration, then relies on `/execute-tasks` Step 6 to validate coverage and domain checks.

## Expected Outcome

- Core shared kernel implemented with rich primitives and exhaustive tests.
- Biome/Lint rules catch prohibited imports in `packages/core`.
- ADR updated describing kernel/foundation patterns.
- Verification runner acknowledges 100% coverage; checkpoint and progress updated.
- Commit staged: `git add packages/core docs/adr/*` with message `feat(phase-b): core shared kernel implemented`.
- Standards verification confirms 100% coverage and domain purity; checkpoint reflects completion.

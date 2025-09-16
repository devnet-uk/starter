# Phase B · Step B3 — Infrastructure Surface Definition (Dry Run)

## Original Plan Excerpt

> ### Step B3: Infrastructure Surface Definition
> ```claude
> Claude: /create-spec "Infrastructure scaffolding — repository/service interfaces, anti-corruption layers, shared mapper strategy"
> Claude: /create-tasks
> Claude: /execute-tasks
> ```
>
> **Deliverables**
> - Interface definitions for persistence, cache, email, storage (no concrete logic yet)
> - Base mapper abstractions in `packages/infrastructure/src/shared`
> - Cross-cutting concerns (logging context, error translation) introduced
>
> **Commit Point**
> ```bash
> git add packages/infrastructure
> git commit -m "feat(phase-b): infrastructure interfaces scaffolded"
> ```

## Dry-Run Command Plan

1. `Claude: /create-spec "Infrastructure scaffolding — repository/service interfaces, anti-corruption layers, shared mapper strategy. Incorporate integration needs from features/storage/specification.md, features/email/specification.md, features/payments/specification.md, and features/api/specification.md."`
   - Standards navigation: `architecture/integration-strategy.md`, `development/testing-strategy.md`, `security/appsec.md` (for interface contracts).
   - Variables: `PROJECT_PHASE=phase-b`, `INFRA_SCOPE=interfaces-only`.
2. `Claude: /create-tasks`
   - Expected tasks:
     - Define interfaces for persistence repositories, cache provider, email, storage, external APIs (no implementations).
     - Create mapper patterns to translate between contracts/Core and infrastructure DTOs.
     - Add shared error handling/logging context primitives.
     - Write placeholder tests (e.g., structural tests ensuring interfaces exist) or contract alignment checks.
     - Confirm standards-driven verification will validate interfaces during `/execute-tasks`.
3. `Claude: /execute-tasks`
   - Applies scaffolding, integrates `packages/infrastructure`, and relies on `/execute-tasks` verification to confirm dependency rules.

## Expected Outcome

- `packages/infrastructure` contains interface definitions and mapper scaffolding without concrete implementations.
- Cross-cutting primitives introduced for logging/error translation.
- Tests or lint rules confirm interfaces align with contracts/core.
- Workspace configuration updated if needed; checkpoint/progress log Step B3 completion.
- Commit staged: `git add packages/infrastructure` with message `feat(phase-b): infrastructure interfaces scaffolded`.
- Standards verification confirms gate compliance during `/execute-tasks`.

# Phase B · Step B1 — Contracts Package Creation (Dry Run)

## Original Plan Excerpt

> ### Step B1: Contracts Package Creation
> ```claude
> Claude: /create-spec "Contracts package bootstrap — zod schemas, HTTP contracts, OpenAPI automation"
> Claude: /create-tasks
> Claude: /execute-tasks
> ```
>
> **Deliverables**
> - `packages/contracts` with module barrels (api, domain, schemas)
> - Generated OpenAPI doc script (e.g., `pnpm --filter @repo/contracts build:openapi`)
> - Contract tests ensuring schema integrity
>
> **Commit Point**
> ```bash
> git add packages/contracts pnpm-workspace.yaml turbo.json
> git commit -m "feat(phase-b): contracts package established"
> ```

## Dry-Run Command Plan

1. `Claude: /create-spec "Contracts package bootstrap — zod schemas, HTTP contracts, OpenAPI automation. Pull requirements from features/auth/specification.md, features/organizations/specification.md, features/payments/specification.md, and features/api/specification.md."`
   - Standards navigation: `docs/standards/development/api-contracts.md`, `architecture/integration-strategy.md`, `testing-strategy.md`.
   - Variables: `PACKAGE_NAME=@repo/contracts`, `PROJECT_PHASE=phase-b`, `PROJECT_COVERAGE=95` for contracts.
2. `Claude: /create-tasks`
   - Expected tasks:
     - Scaffold `packages/contracts` with subdirectories (`api`, `domain`, `schemas`) and barrel exports.
     - Implement Zod schemas derived from feature specs; ensure shared types exported.
     - Configure OpenAPI generation script (`pnpm --filter @repo/contracts build:openapi`).
     - Add contract unit tests verifying schema behavior and type inference.
     - Update workspace references (`pnpm-workspace.yaml`, `turbo.json`).
     - Prepare to run verification via the standards’ embedded blocks during `/execute-tasks` Step 6.
3. `Claude: /execute-tasks`
   - Executes scaffolding, writes schemas/tests, updates config files, then relies on `/execute-tasks` Step 6 to run the contract verification suite.

## Expected Outcome

- `packages/contracts` exists with organized modules and exports.
- OpenAPI build target defined and passing.
- Contract tests succeed, coverage meets threshold.
- Workspace files updated to include new package.
- Checkpoint/progress reflect completion; commit staged with message `feat(phase-b): contracts package established`.
- Standards-driven verification (coverage ≥95%, contract checks) recorded via `/execute-tasks` output.

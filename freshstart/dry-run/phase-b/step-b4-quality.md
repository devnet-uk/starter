# Phase B · Step B4 — Architecture Quality Gates (Dry Run)

## Original Plan Excerpt

> ### Step B4: Architecture Quality Gates
> ```claude
> Claude: /create-spec "Architecture quality gates — dependency enforcement, openapi generation workflow, ci wiring"
> Claude: /create-tasks
> Claude: /execute-tasks
> ```
>
> **Deliverables**
> - Architecture tests (dependency-cruiser/ts-auto-guard) ensuring layer boundaries
> - CI pipeline updates to run contracts build + tests
> - Updated `DEVNET-CHECKPOINT.txt` with Phase B exit summary + next phase pointer
>
> **Commit Point**
> ```bash
> git add .github/workflows/ DEVNET-CHECKPOINT.txt DEVNET-PROGRESS.md
> git commit -m "chore(phase-b): architecture gates enforced"
> ```

## Dry-Run Command Plan

1. `Claude: /create-spec "Architecture quality gates — dependency enforcement, openapi generation workflow, ci wiring. Ensure coverage for all domains listed in the Feature Mapping table of freshstart/refined-plan/implementation-plan.md."`
   - Standards navigation: `architecture/clean-architecture.md`, `development/monorepo-setup.md` (for scripts), `testing-strategy.md`, CI standards under `docs/standards/operations/`.
   - Variables: `PROJECT_PHASE=phase-b`, `ARCH_DEP_RULE=enabled`, `DEVNET_HOME=${DEVNET_HOME:-~/Projects/devnet}`, `DEVNET_GIT_REMOTE=${DEVNET_GIT_REMOTE:-git@github.com:your-org/devnet.git}`.
2. `Claude: /create-tasks`
   - Expected tasks:
     - Run workspace guard (ensure `pwd` equals ``${DEVNET_HOME}`` and origin matches ``${DEVNET_GIT_REMOTE}``).
     - Configure dependency enforcement (dependency-cruiser config or Biome rule) verifying layer isolation.
     - Ensure OpenAPI generation integrated into CI workflow (update `.github/workflows/*`).
     - Add CI steps for contracts/core/infrastructure tests.
     - Update checkpoint/progress with Phase B completion metadata.
     - Confirm the standards-based verification runner will exercise these gates during `/execute-tasks`.
3. `Claude: /execute-tasks`
   - Implements configuration, updates CI pipelines, and relies on `/execute-tasks` verification to cover dependency/OpenAPI gates.

## Expected Outcome

- Automated checks enforce Clean Architecture boundaries.
- CI workflows invoke contract build/test and fail fast on violations.
- Checkpoint/progress indicate Phase B completion and next phase pointer.
- Standards-driven verification confirms new gates; checkpoint notes completion.
- Commit staged: `git add .github/workflows/ DEVNET-CHECKPOINT.txt DEVNET-PROGRESS.md` message `chore(phase-b): architecture gates enforced`.

# Phase A · Step A1 — Workspace & Repo Validation (Dry Run)

## Original Plan Excerpt

> ### Step A1: Workspace & Repo Validation
> ```claude
> Claude: /create-spec "DevNet workspace preflight — verify repo cleanliness, pnpm/turbo alignment, env scaffolding"
> Claude: /create-tasks
> Claude: /execute-tasks
> ```
>
> **Deliverables**
> - Verified workspace status logged in `DEVNET-CHECKPOINT.txt`
> - `.nvmrc`, `.npmrc` (if required), `pnpm-workspace.yaml`, and `turbo.json` regenerated or confirmed
> - `.env.example` refreshed with documented variables; link to `devnet-plan/ENV-VARS.md`
>
> **Commit Point**
> ```bash
> git add pnpm-workspace.yaml turbo.json .nvmrc .env.example DEVNET-CHECKPOINT.txt DEVNET-PROGRESS.md
> git commit -m "chore(phase-a): workspace baseline verified"
> ```

## Dry-Run Command Plan

1. `Claude: /create-spec "DevNet workspace preflight — verify repo cleanliness, pnpm/turbo alignment, env scaffolding"`
   - Standards navigation: `monorepo-setup.md`, `typescript-config.md`, `local-quality.md`, `testing-strategy.md`, `freshstart/refined-plan/ENV-VARS.md`.
   - Variables applied: `PROJECT_NAME=devnet`, `PROJECT_PHASE=phase-a`, `DEVNET_HOME=~/Projects/devnet`, `PROJECT_COVERAGE=98`.
   - Specification captures deliverables and verification expectations (workspace cleanliness, control files, env scaffolding).
2. `Claude: /create-tasks`
   - Expected tasks:
     - Verify working directory (`pwd`, `[[ $(basename $(pwd)) == "devnet" ]]`).
     - List and diff `pnpm-workspace.yaml`, `turbo.json`, `.nvmrc`; confirm Node 22 alignment.
     - Inspect or regenerate `.env.example`; ensure `DEVNET_PORT_API=4000`, `DEVNET_PORT_WEB=4001`; document linkage to `ENV-VARS.md`.
    - Optionally run `pnpm install --frozen-lockfile` (or dry-run) to confirm workspace integrity.
    - Update `DEVNET-CHECKPOINT.txt` / `DEVNET-PROGRESS.md` status entries for Step A1.
    - Confirm that `/execute-tasks` Step 6 will invoke the workspace verification blocks.
3. `Claude: /execute-tasks`
   - Drives task execution, logs command outputs, and lets the verification runner confirm workspace readiness (reporting any fix commands).

## Expected Outcome

- Workspace location confirmed; quick check prints `✅`.
- `pnpm-workspace.yaml`, `turbo.json`, `.nvmrc` confirmed or regenerated to match standards (Node 22 LTS, Turbo present).
- `.env.example` refreshed with API/web ports and documented linkage to `freshstart/refined-plan/ENV-VARS.md`.
- `DEVNET-CHECKPOINT.txt` notes completion of Phase A Step A1; `DEVNET-PROGRESS.md` checkbox toggled.
- Standards-driven verification reports a green workspace baseline via `/execute-tasks` output.
- Commit staged with message `chore(phase-a): workspace baseline verified` (pending push).

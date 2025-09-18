# Phase A · Step A1 — Workspace & Repo Validation (Dry Run)

## Original Plan Excerpt

> ### Step A1: Workspace & Repo Validation
> ```claude
> Claude: /create-spec "DevNet workspace bootstrap + preflight — initialize empty repo, set origin remote, verify pnpm/turbo alignment, env scaffolding"
> Claude: /create-tasks
> Claude: /execute-tasks
> ```
>
> **Deliverables**
> - New git workspace bootstrapped at `${DEVNET_HOME:-~/Projects/devnet/}` (empty dir created, `git init`, remote configured via `git remote add origin ${DEVNET_GIT_REMOTE}` when provided)
> - Verified workspace status logged in `DEVNET-CHECKPOINT.txt`
> - `.nvmrc`, `.npmrc` (if required), `pnpm-workspace.yaml`, and `turbo.json` regenerated or confirmed
> - `.env.example` refreshed with documented variables; link to `freshstart/refined-plan/ENV-VARS.md`
>
> **Commit Point**
> ```bash
> git add pnpm-workspace.yaml turbo.json .nvmrc .env.example DEVNET-CHECKPOINT.txt DEVNET-PROGRESS.md
> git commit -m "chore(phase-a): workspace baseline verified"
> ```

## Dry-Run Command Plan

1. `Claude: /create-spec "DevNet workspace bootstrap + preflight — initialize empty repo, set origin remote, verify pnpm/turbo alignment, env scaffolding"`
   - Standards navigation: `monorepo-setup.md`, `typescript-config.md`, `local-quality.md`, `testing-strategy.md`, `freshstart/refined-plan/ENV-VARS.md`.
   - Variables applied: `PROJECT_NAME=devnet`, `PROJECT_PHASE=phase-a`, `DEVNET_HOME=${DEVNET_HOME:-~/Projects/devnet}`, `ENGINEERING_OS_HOME=${ENGINEERING_OS_HOME:-~/Projects/devnet.starter}`, `DEVNET_GIT_REMOTE=${DEVNET_GIT_REMOTE:-git@github.com:your-org/devnet.git}`, `PROJECT_COVERAGE=98`.
   - Specification captures deliverables and verification expectations (workspace cleanliness, control files, env scaffolding).
2. `Claude: /create-tasks`
   - Expected tasks:
     - Run bootstrap guard to ensure ``${DEVNET_HOME}`` is empty before initialization.
     - Initialize git repository (`git init`) and configure the `origin` remote to ``${DEVNET_GIT_REMOTE}``.
     - Verify working directory (`pwd`, compare against `$(cd "${DEVNET_HOME}" && pwd)`), confirm `git status` clean.
     - Confirm `git config --get remote.origin.url` matches ``${DEVNET_GIT_REMOTE}`` when provided.
     - List and diff `pnpm-workspace.yaml`, `turbo.json`, `.nvmrc`, and `.npmrc`; confirm Node 22 alignment and workspace package scopes.
     - Inspect or regenerate `.env.example`; ensure `DEVNET_PORT_API=4000`, `DEVNET_PORT_WEB=4001`; document linkage to `ENV-VARS.md`.
     - Optionally run `pnpm install --frozen-lockfile` (or dry-run) to confirm workspace integrity.
     - Update `DEVNET-CHECKPOINT.txt` / `DEVNET-PROGRESS.md` status entries for Step A1.
     - Confirm that `/execute-tasks` Step 6 will invoke the workspace verification blocks.
3. `Claude: /execute-tasks`
   - Drives task execution, logs command outputs (including bootstrap/remote checks), and lets the verification runner confirm workspace readiness (reporting any fix commands).

## Sample Dry-Run Transcript

Commands executed in a sandbox directory (`.tmp/dry-run/devnet`) to avoid touching the real workspace.

```bash
# 1. Bootstrap guard — creates the directory if empty
DEVNET_HOME="$PWD/.tmp/dry-run/devnet" DEVNET_GIT_REMOTE="git@github.com:your-org/devnet.git" \
  if [ -d "$DEVNET_HOME" ] && [ "$(ls -A "$DEVNET_HOME")" ]; then \
    echo "❌ $DEVNET_HOME is not empty — clear it or choose a fresh directory"; \
  else \
    mkdir -p "$DEVNET_HOME"; \
    echo "✅ Implementation workspace ready at $DEVNET_HOME"; \
  fi
# → ✅ Implementation workspace ready at /Users/bun/Projects/devnet.starter/.tmp/dry-run/devnet

# 2. Initialize git and set origin
cd .tmp/dry-run/devnet && git init
# → Initialized empty Git repository in /Users/bun/Projects/devnet.starter/.tmp/dry-run/devnet/.git/
git remote add origin git@github.com:your-org/devnet.git
git config --get remote.origin.url
# → git@github.com:your-org/devnet.git
```

## Expected Outcome

- Workspace location confirmed; quick check prints `✅` at `${DEVNET_HOME}`.
- Origin remote aligned to `${DEVNET_GIT_REMOTE}` (or intentional override documented).
- `pnpm-workspace.yaml`, `turbo.json`, `.nvmrc`, and `.npmrc` confirmed or regenerated to match standards (Node 22 LTS, Turbo present, registry config aligned).
- `.env.example` refreshed with API/web ports and documented linkage to `freshstart/refined-plan/ENV-VARS.md`.
- `DEVNET-CHECKPOINT.txt` notes completion of Phase A Step A1; `DEVNET-PROGRESS.md` checkbox toggled.
- Standards-driven verification reports a green workspace baseline via `/execute-tasks` output.
- Commit staged with message `chore(phase-a): workspace baseline verified` (pending push).

# Phase A: Engineering OS Foundation (User-Driven)

## Agent Brief (copy/paste to start)
```
You are assisting with Phase A: Engineering OS Foundation for the DevNet migration. Focus on workspace bootstrap, pnpm/turbo alignment, Biome + TypeScript strictness, Husky/lint-staged wiring, coverage threshold setup, and Engineering OS automation. I will feed you each step manually. Wait for my commands and respond with the tasks/diffs needed to complete the step.
```

## Phase Overview
- Coverage target: Configure repo defaults to ≥98% (no enforcement yet)
- Duration: 3 steps (workspace, tooling, Engineering OS automation)
- Next phase: Phase B — Architecture Spine

## Prerequisites
- Primary workspace: `${DEVNET_HOME:-~/Projects/devnet/}`
- Reference workspace: `${ENGINEERING_OS_HOME:-~/Projects/devnet.starter/}`
- Ensure Phase A is not marked complete in `DEVNET-CHECKPOINT.txt` yet.

### Workspace Guard (optional)
Run locally if you need to confirm the implementation directory is clean:
```bash
DEVNET_PATH="${DEVNET_HOME:-$HOME/Projects/devnet}"
if [ -d "$DEVNET_PATH" ] && [ "$(ls -A "$DEVNET_PATH")" ]; then
  echo "❌ $DEVNET_PATH is not empty — clear it or choose a fresh directory"
else
  mkdir -p "$DEVNET_PATH"
  echo "✅ Implementation workspace ready at $DEVNET_PATH"
fi
```

## Acceptance Checklist
All items must pass inside a single `/execute-tasks` cycle before you move to Phase B:
- `pnpm verify:local` passes with Husky/lint-staged hooks wired (`"prepare": "husky install"` present)
- Turborepo + pnpm workspaces aligned (`pnpm-workspace.yaml`, `turbo.json`, `.nvmrc` targeting Node 22 LTS)
- Coverage threshold raised to 98 (Vitest/Jest/Bun equivalent)
- `.env.example` updated with documented ports + placeholder secrets; `ENV-VARS.md` stub refreshed
- `DEVNET-CHECKPOINT.txt` / `DEVNET-PROGRESS.md` updated with Phase A exit status

## Manual Step Runner
Follow each step in order. Paste the command bundle exactly as shown, then collaborate with the assistant to finish the work and commit.

Context Reset Tip: After you commit each step, clear the agent context and start the next step using the Handoff Template in `freshstart/user-driven-plan/implementation-plan.md` (see "Context Resets & Handoff").

### Step A1: Workspace & Repo Validation
**Message to send:**
```
/create-spec "DevNet workspace bootstrap + preflight — initialize empty repo, set origin remote, verify pnpm/turbo alignment, env scaffolding"
/create-tasks
/execute-tasks

# On completion, output a Context Pack for handoff with:
# - Phase/Step: Phase A / Step A1
# - Acceptance: which checklist bullets are satisfied
# - Verification: commands to run (and what to paste back)
# - Files: changed paths
# - Decisions: assumptions/non-obvious choices
# - Commit: suggested commit message
# - Next Step Commands: the exact bundle for Step A2
```

**Key Deliverables**
- Empty git workspace at `${DEVNET_HOME:-~/Projects/devnet/}` with remote configured (when URL available)
- `.nvmrc`, `.npmrc` (if needed), `pnpm-workspace.yaml`, `turbo.json` validated or regenerated
- `.env.example` refreshed; reference `devnet-plan/ENV-VARS.md` when documenting variables
- Workspace status logged in `DEVNET-CHECKPOINT.txt`

**Suggested Commit**
```
git add pnpm-workspace.yaml turbo.json .nvmrc .env.example DEVNET-CHECKPOINT.txt DEVNET-PROGRESS.md
git commit -m "chore(phase-a): workspace baseline verified"
```

### Step A2: Tooling & Automation Hardening
**Message to send:**
```
/create-spec "Tooling hardening — TypeScript strict, Biome strict, Husky + lint-staged + commitlint, coverage >=98"
/create-tasks
/execute-tasks

# On completion, output a Context Pack for handoff with:
# - Phase/Step: Phase A / Step A2
# - Acceptance, Verification commands, Files, Decisions, Commit message, Next Step Commands (A3)
```

**Key Deliverables**
- `tsconfig.base.json` in strict mode with project references
- `biome.json` enforcing repo-wide lint/format rules
- Husky hooks for pre-commit (`pnpm lint && pnpm check`) and commit-msg (commitlint or Biome alternative)
- Coverage threshold configuration committed (Vitest/Jest/Bun)

**Suggested Commit**
```
git add tsconfig.base.json biome.json package.json .husky/ lint-staged.config.*
git commit -m "chore(phase-a): tooling automation hardened"
```

### Step A3: Engineering OS Integration
**Message to send:**
```
/create-spec "Engineering OS integration — scripts wiring, standards routing, verification runner smoke test"
/create-tasks
/execute-tasks

# On completion, output a Context Pack for handoff with:
# - Phase/Step: Phase A / Step A3
# - Acceptance, Verification commands, Files, Decisions, Commit message, Next Step Commands (Phase B / Step B1)
```

**Key Deliverables**
- `scripts/` updated with EOS helpers and verification runner configs
- Plan dispatcher references patched in `DEVNET-CHECKPOINT.txt`
- `/execute-tasks` Step 6 passes default verification (lint/type-check/test placeholders)
- ADR stub or note capturing tooling decisions if not already present

**Suggested Commit**
```
git add scripts/ DEVNET-CHECKPOINT.txt docs/ ADRs/
git commit -m "chore(phase-a): engineering os runner integrated"
```

## References
- `docs/standards/development/monorepo-setup.md`
- `docs/standards/development/typescript-config.md`
- `docs/standards/development/biome-config.md`
- `docs/standards/development/local-quality.md`
- `docs/EngineeringOS/dsl/includes/common-snippets.md`

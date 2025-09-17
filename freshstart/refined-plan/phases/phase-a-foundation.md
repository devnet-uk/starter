# Phase A: Engineering OS Foundation

## Overview

- Phase: Engineering OS Foundation
- Coverage Target: Configure repo defaults to ≥98% (no code coverage enforcement yet)
- Status: Ready for execution
- Duration: 3 steps covering workspace validation, tooling, and automation
- Next Phase: Phase B — Architecture Spine

## Prerequisites & Working Directory

**Required Workspaces**:
- Primary: `~/Projects/devnet/` (new implementation repo)
- Secondary: `~/Projects/devnet.starter/` (starter reference)

**Bootstrap Guard**
```bash
DEVNET_PATH="${DEVNET_HOME:-$HOME/Projects/devnet}"
if [ -d "$DEVNET_PATH" ] && [ "$(ls -A "$DEVNET_PATH")" ]; then
  echo "❌ $DEVNET_PATH is not empty — clear it or choose a fresh directory"
else
  mkdir -p "$DEVNET_PATH"
  echo "✅ Implementation workspace ready at $DEVNET_PATH"
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

## Phase Acceptance

All bullets must be green in a single `/execute-tasks` session before moving to Phase B:
- `pnpm verify:local` passes with Husky/lint-staged configured and `"prepare": "husky install"`
- Turborepo + pnpm workspaces resolved (`pnpm-workspace.yaml`, `turbo.json`, `.nvmrc` aligned to Node 22 LTS)
- Coverage threshold raised to 98 (Enforced via Jest/Vitest config or coverage tooling used in repo)
- `.env.example` established with documented ports + placeholder secrets; `DEVNET-ENV.md` stub updated
- `DEVNET-CHECKPOINT.txt` and `DEVNET-PROGRESS.md` updated with Phase A exit status

## Standards & Intents

- Monorepo: `docs/standards/development/monorepo-setup.md`
- TypeScript: `docs/standards/development/typescript-config.md`
- Quality automation: `docs/standards/development/local-quality.md`, `testing-strategy.md`
- Git workflow: `docs/standards/development/git-workflow.md`

## Implementation Steps

### Step A1: Workspace & Repo Validation

```bash
if [ "${DEVNET_EOS_AUTOMATE}" = "true" ]; then
    echo "🤖 Automated mode detected - executing via pnpm"
    pnpm eos:run --spec "DevNet workspace bootstrap + preflight — initialize empty repo, set origin remote, verify pnpm/turbo alignment, env scaffolding"
    echo "AUTOMATED" > .step-a1-mode
else
    echo "👤 Manual mode - Claude commands required"
    echo "MANUAL" > .step-a1-mode
    echo ""
    echo "════════════════════════════════════════════════════════════════"
    echo "  Execute these Claude Code commands now:"
    echo "  1. /create-spec \"DevNet workspace bootstrap + preflight — initialize empty repo, set origin remote, verify pnpm/turbo alignment, env scaffolding\""
    echo "  2. /create-tasks"
    echo "  3. /execute-tasks"
    echo "════════════════════════════════════════════════════════════════"
fi
```

**Deliverables**
- New git workspace bootstrapped at `${DEVNET_HOME:-~/Projects/devnet/}` (empty dir created, `git init`, remote configured via `git remote add origin ${DEVNET_GIT_REMOTE:-<github-url>}` when provided)
- Verified workspace status logged in `DEVNET-CHECKPOINT.txt`
- `.nvmrc`, `.npmrc` (if required), `pnpm-workspace.yaml`, and `turbo.json` regenerated or confirmed
- `.env.example` refreshed with documented variables; link to `devnet-plan/ENV-VARS.md`

**Commit Point**
```bash
git add pnpm-workspace.yaml turbo.json .nvmrc .env.example DEVNET-CHECKPOINT.txt DEVNET-PROGRESS.md
git commit -m "chore(phase-a): workspace baseline verified"
```

### Step A2: Tooling & Automation Hardening

<user-action-required>
```bash
if [ "${DEVNET_EOS_AUTOMATE}" = "true" ]; then
    echo "🤖 Automated mode detected - executing via pnpm"
    pnpm eos:run --spec "Tooling hardening — TypeScript strict, Biome strict, Husky + lint-staged + commitlint, coverage >=98"
    echo "AUTOMATED" > .step-a2-mode
else
    echo "👤 Manual mode - Claude commands required"
    echo "MANUAL" > .step-a2-mode
    echo ""
    echo "════════════════════════════════════════════════════════════════"
    echo "  Execute these Claude Code commands now:"
    echo "  1. /create-spec \"Tooling hardening — TypeScript strict, Biome strict, Husky + lint-staged + commitlint, coverage >=98\""
    echo "  2. /create-tasks"
    echo "  3. /execute-tasks"
    echo "════════════════════════════════════════════════════════════════"
fi
```
</user-action-required>

**Deliverables**
- `tsconfig.base.json` aligned with strict mode and project references
- `biome.json` enforcing repo-wide lint/format rules
- Husky hooks for pre-commit (`pnpm lint && pnpm check`) and commit-msg (commitlint)
- Coverage threshold configuration committed (Vitest/Jest/Bun equivalent)

**Commit Point**
```bash
git add tsconfig.base.json biome.json package.json .husky/ lint-staged.config.*
git commit -m "chore(phase-a): tooling automation hardened"
```

### Step A3: Engineering OS Integration

<user-action-required>
```bash
if [ "${DEVNET_EOS_AUTOMATE}" = "true" ]; then
    echo "🤖 Automated mode detected - executing via pnpm"
    pnpm eos:run --spec "Engineering OS integration — scripts wiring, standards routing, verification runner smoke test"
    echo "AUTOMATED" > .step-a3-mode
else
    echo "👤 Manual mode - Claude commands required"
    echo "MANUAL" > .step-a3-mode
    echo ""
    echo "════════════════════════════════════════════════════════════════"
    echo "  Execute these Claude Code commands now:"
    echo "  1. /create-spec \"Engineering OS integration — scripts wiring, standards routing, verification runner smoke test\""
    echo "  2. /create-tasks"
    echo "  3. /execute-tasks"
    echo "════════════════════════════════════════════════════════════════"
fi
```
</user-action-required>

**Deliverables**
- `scripts/` updated with EOS helpers (include helper, verification runner configs)
- Plan dispatcher (`freshstart/refined-plan/implementation-plan.md`) linked in `DEVNET-CHECKPOINT.txt`
- `/execute-tasks` Step 6 passes default verification (lint/type-check/test placeholders)
- ADR stub or note capturing tooling decisions (if not existing)

**Commit Point**
```bash
git add scripts/ DEVNET-CHECKPOINT.txt docs/ ADRs/
git commit -m "chore(phase-a): engineering os runner integrated"
```

## References

- `freshstart/refined-plan/implementation-plan.md`
- `devnet-plan/ENV-VARS.md`
- `docs/EngineeringOS/dsl/includes/common-snippets.md`

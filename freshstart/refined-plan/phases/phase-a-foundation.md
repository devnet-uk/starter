# Phase A: Engineering OS Foundation

## Overview

- Phase: Engineering OS Foundation
- Coverage Target: Configure repo defaults to ≥98% (no code coverage enforcement yet)
- Status: Ready for execution
- Duration: 3 steps covering workspace validation, tooling, and automation
- Next Phase: Phase B — Architecture Spine

## Prerequisites & Working Directory

**Required Workspaces**:
- Primary: `~/Projects/devnet/`
- Secondary: `~/Projects/devnet.starter/`

**Quick Workspace Check**
```bash
[[ $(basename $(pwd)) == "devnet" ]] && echo "✅" || echo "❌ cd ~/Projects/devnet"
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

```claude
Claude: /create-spec "DevNet workspace preflight — verify repo cleanliness, pnpm/turbo alignment, env scaffolding"
Claude: /create-tasks
Claude: /execute-tasks
```

**Deliverables**
- Verified workspace status logged in `DEVNET-CHECKPOINT.txt`
- `.nvmrc`, `.npmrc` (if required), `pnpm-workspace.yaml`, and `turbo.json` regenerated or confirmed
- `.env.example` refreshed with documented variables; link to `devnet-plan/ENV-VARS.md`

**Commit Point**
```bash
git add pnpm-workspace.yaml turbo.json .nvmrc .env.example DEVNET-CHECKPOINT.txt DEVNET-PROGRESS.md
git commit -m "chore(phase-a): workspace baseline verified"
```

### Step A2: Tooling & Automation Hardening

```claude
Claude: /create-spec "Tooling hardening — TypeScript strict, Biome strict, Husky + lint-staged + commitlint, coverage >=98"
Claude: /create-tasks
Claude: /execute-tasks
```

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

```claude
Claude: /create-spec "Engineering OS integration — scripts wiring, standards routing, verification runner smoke test"
Claude: /create-tasks
Claude: /execute-tasks
```

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

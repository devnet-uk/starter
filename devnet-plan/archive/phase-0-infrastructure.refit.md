# Phase 0: Infrastructure & Project Setup (Refit)

## Overview

<!-- phase-summary: anchor=overview; keep concise and current -->

- Phase: Infrastructure & Project Setup
- Coverage Target: 0% code (quality gates only); configure coverage threshold ≥ 98 for project
- Status: Ready for implementation
- Duration: 5 steps focusing on repository creation, monorepo, core packages, dev environment, and documentation
- Next Phase: Phase 1 – Core Domain Layer

## Prerequisites & Working Directory

**Required Workspaces**:
<!-- @include-from: docs/EngineeringOS/dsl/includes/common-snippets.md#required-workspaces, hash: 4a5914590c5e5cc7097eeddfa7da51d7d275f34f0d38e78be17a0d77e9f94b00 -->
These repositories should be open in your editor workspace:

- Primary: `~/Projects/devnet/` (implementation & execution)
- Secondary: `~/Projects/devnet.clean_architecture/` (standards reference)
<!-- @end-include -->

**Workspace Checks**:
<!-- @include-from: docs/EngineeringOS/dsl/includes/common-snippets.md#workspace-checks, hash: 8cd810c9f2cfa00bdaa2c1eefd57680455604a990bf8eca80aaba27204124793 -->
Confirm you are in the correct repository and workspace.

```
pwd  # should end with your product repository name (for example, devnet)
ls packages/  # should list expected workspace packages (for example, core, infrastructure)
```

If the directory does not match, switch to the product repository before continuing.
<!-- @end-include -->

**Workspace Verification (Quick Check)**:
<!-- @include-from: docs/EngineeringOS/dsl/includes/common-snippets.md#workspace-quick-check, hash: c549c84e03c8d6b6b773e27a8636f8ede1379adcbca9858e32ffc6c27889aed8 -->
Quick single-line check to confirm you are in the expected product repository directory.

```
[[ $(basename $(pwd)) == "devnet" ]] && echo "✅ Correct workspace" || echo "❌ Wrong directory - run: cd ~/Projects/devnet"
```
<!-- @end-include -->

**Command Notation**
- `claude` code blocks = Commands for the agent to execute
- `bash` code blocks = Shell commands to run locally (examples only)
- "Claude:" prefix = Direct instruction for the agent

## Phase 0 Green (Acceptance)

<!-- @include-from: docs/EngineeringOS/dsl/includes/common-snippets.md#verification-note, hash: 06a507e35e5f387b62627da1e7ca81c98750250cc34d9b736e56238630d35fc0 -->
Verification runs via `/execute-tasks` Step 6 using the verification runner in blocking mode by default.
- All tests marked as blocking must pass before completion.
- Do not run command-line samples for verification; they are illustrative only.
- Review Fix Commands from the report, apply changes, then re-run `/execute-tasks`.
<!-- @end-include -->

Acceptance criteria (typical blocking checks)
- Monorepo essentials present: `pnpm-workspace.yaml`, `turbo.json`, `.nvmrc`, `.env.example` with ports 4000/4001
- TypeScript strict + ESNext; `tsconfig.base.json` present for monorepo; typecheck passes
- Biome config strict; no domain downgrades; `biome check` passes
- Scripts are real (no echo); coverage threshold configured to 98
- Husky + lint-staged + commitlint present and executable; `"prepare": "husky install"` exists
- Git repo ready: `.git` initialized and `origin` remote configured

## Standards & Intents

Start at `docs/standards/standards.md` and route by intent.
- Relevant intents: tooling-config, development, stack-specific
- Likely standards: typescript-config.md, biome-config.md, package-scripts.md, git-workflow.md, monorepo-setup.md, local-environment.md
- Keep ≤ 3 hops; load only what the task requires.

## Implementation Steps

### Step 1: Repository Infrastructure Specification

#### Implementation Commands
```claude
# Execute from Engineering OS repo; the agent will create the devnet repo
Claude: /create-spec "devnet Repository Infrastructure - Create separate greenfield repository at ~/Projects/devnet with git initialization, GitHub remote connection, and proper directory structure"
Claude: /create-tasks
Claude: /execute-tasks
```

**Expected Deliverables:**
- New `~/Projects/devnet` repository with `.git` initialized and `origin` configured
- Baseline folders per monorepo conventions (packages, apps, tools as applicable)
- Checkpoint/progress docs updated via status renderer (optional)

#### 🔄 Commit Point 1
<!-- @include-from: docs/EngineeringOS/dsl/includes/common-snippets.md#commit-rules, hash: c04caa4894227bee0454c55860bc68bd15be12d504f0a978a58b37d49dbfbe30 -->
Use clear, conventional messages and push only when verification is green.

Guidelines
- Write a single, focused commit per logical unit of work.
- Use conventional commit prefixes where appropriate (for example, `feat:`, `fix:`, `docs:`).
- Include a short bullet list of notable changes in the body if needed.
<!-- @end-include -->

```bash
git add .
git commit -m "feat(phase-0): repo infrastructure initialized"
```

### Step 2: Monorepo Architecture Specification

```claude
Claude: /create-spec "Monorepo Setup - pnpm workspaces configuration following standards, with Engineering OS framework migration"
Claude: /create-tasks
Claude: /execute-tasks
```

**Expected Deliverables:**
- `pnpm-workspace.yaml` and `turbo.json` present and valid
- Workspace package layout defined; root scripts aligned with standards
- Local environment scaffolding: `.nvmrc`, `.env.example` (ports 4000/4001)

#### 🔄 Commit Point 2
```bash
git add .
git commit -m "feat(phase-0): monorepo workspace configured"
```

### Step 3: Core Packages Architecture Specification

```claude
Claude: /create-spec "Core Package Structure - Clean Architecture packages (domain, use-cases, infrastructure, contracts, UI, auth) with proper dependency direction"
Claude: /create-tasks
Claude: /execute-tasks
```

**Expected Deliverables:**
- Packages created: domain, use-cases, infrastructure, contracts, UI, auth
- Enforced dependency direction (no inward imports violations)
- Initial package.json scripts (non-echo) and inter-package references

#### 🔄 Commit Point 3
```bash
git add .
git commit -m "feat(phase-0): core packages scaffolded (clean architecture layout)"
```

### Step 4: Development Environment Specification

```claude
Claude: /create-spec "Development Environment Configuration - TypeScript ESNext strict, Biome strict, Husky + lint-staged + commitlint, coverage 98"
Claude: /create-tasks
Claude: /execute-tasks
```

**Expected Deliverables:**
- TypeScript config (ESNext, strict, monorepo `tsconfig.base.json`) and typecheck passes
- Biome config strict; domain quality protections applied
- Real scripts wired (no echo); coverage threshold set to 98
- Husky initialized with `prepare` script; lint-staged and commitlint configured

#### 🔄 Commit Point 4
```bash
git add .
git commit -m "chore(phase-0): dev environment configured (ts, biome, hooks, coverage)"
```

### Step 5: Project Documentation Specification

```claude
Claude: /create-spec "Project Documentation - README, contributing, workspace docs, and basic ADR scaffolding"
Claude: /create-tasks
Claude: /execute-tasks
```

**Expected Deliverables:**
- README and contributing docs aligned to standards
- ADR folder scaffolding and initial templates
- DEVNET-CHECKPOINT.txt and DEVNET-PROGRESS.md rendered via status.yaml (optional)

#### 🔄 Commit Point 5
```bash
git add .
git commit -m "docs(phase-0): project documentation and ADR scaffolding"
```

## References

- Plan dispatcher: `devnet-plan/implementation-plan.md`
- Phase manifest: `devnet-plan/manifest.json`
- Standards root: `docs/standards/standards.md`
- Environment vars: `devnet-plan/ENV-VARS.md`
- Preflight: `scripts/preflight.mjs`
- Status render: `scripts/render-status.mjs`

## Notes

- After Step 1 completes, switch to `~/Projects/devnet` for Steps 2–5.
- Verification is blocking: resolve failures using FIX_COMMAND and re-run `/execute-tasks`.

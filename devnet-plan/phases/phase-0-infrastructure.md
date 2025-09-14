# Phase 0: Infrastructure & Project Setup (Lean)

## Overview

<!-- phase-summary: anchor=overview; keep concise and current -->

- Phase: Infrastructure & Project Setup
- Coverage Target: Configure project coverage threshold ≥ 98 (no code coverage required in this phase)
- Status: Ready for implementation
- Duration: 5 steps — repo, monorepo, packages, dev environment, docs
- Next Phase: Phase 1 – Core Domain Layer

## Prerequisites & Working Directory

**Required Workspaces**:
<!-- @include-from: docs/EngineeringOS/dsl/includes/common-snippets.md#required-workspaces, hash: 4a5914590c5e5cc7097eeddfa7da51d7d275f34f0d38e78be17a0d77e9f94b00 -->
These repositories should be open in your editor workspace:

- Primary: `~/Projects/devnet/` (implementation & execution)
- Secondary: `~/Projects/devnet.clean_architecture/` (standards reference)
<!-- @end-include -->

**Workspace Quick Check**
<!-- @include-from: docs/EngineeringOS/dsl/includes/common-snippets.md#workspace-quick-check, hash: c549c84e03c8d6b6b773e27a8636f8ede1379adcbca9858e32ffc6c27889aed8 -->
Quick single-line check to confirm you are in the expected product repository directory.

```
[[ $(basename $(pwd)) == "devnet" ]] && echo "✅ Correct workspace" || echo "❌ Wrong directory - run: cd ~/Projects/devnet"
```
<!-- @end-include -->

Note: Detailed workspace checks are available at docs/EngineeringOS/dsl/includes/common-snippets.md#workspace-checks (linked, not auto-loaded).

## Phase 0 Green (Acceptance)

<!-- @include-from: docs/EngineeringOS/dsl/includes/common-snippets.md#verification-note, hash: 06a507e35e5f387b62627da1e7ca81c98750250cc34d9b736e56238630d35fc0 -->
Verification runs via `/execute-tasks` Step 6 using the verification runner in blocking mode by default.
- All tests marked as blocking must pass before completion.
- Do not run command-line samples for verification; they are illustrative only.
- Review Fix Commands from the report, apply changes, then re-run `/execute-tasks`.
<!-- @end-include -->

Acceptance criteria
- Monorepo essentials present: `pnpm-workspace.yaml`, `turbo.json`, `.nvmrc`, `.env.example` with ports 4000/4001
- TypeScript strict + ESNext; `tsconfig.base.json` present for monorepo; typecheck passes
- Biome config strict; no domain downgrades; `biome check` passes
- Real scripts (no echo); coverage threshold set to 98
- Husky + lint-staged + commitlint wired; `"prepare": "husky install"`
- Git repo initialized; `origin` configured

## Implementation Steps

### Step 1: Repository Infrastructure Specification

```claude
Claude: /create-spec "devnet Repository Infrastructure — create clean repo at ~/Projects/devnet, init git, add origin"
Claude: /create-tasks
Claude: /execute-tasks
```

**Expected Deliverables**
- New `~/Projects/devnet` repo initialized with `origin`
- Baseline folders per monorepo conventions

Note: After Step 1 completes, switch your working directory to `~/Projects/devnet` for Steps 2–5.

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
Claude: /create-spec "Monorepo Setup — pnpm workspaces + turbo; .nvmrc; .env.example (4000/4001)"
Claude: /create-tasks
Claude: /execute-tasks
```

**Expected Deliverables**
- `pnpm-workspace.yaml`, `turbo.json`, `.nvmrc`, `.env.example`

#### 🔄 Commit Point 2
```bash
git add .
git commit -m "feat(phase-0): monorepo workspace configured"
```

### Step 3: Core Packages Architecture Specification

```claude
Claude: /create-spec "Core packages — domain, use-cases, infrastructure, contracts, UI, auth; enforce dependency direction"
Claude: /create-tasks
Claude: /execute-tasks
```

**Expected Deliverables**
- Packages created and wired; dependency direction enforced

#### 🔄 Commit Point 3
```bash
git add .
git commit -m "feat(phase-0): core packages scaffolded (clean architecture layout)"
```

### Step 4: Development Environment Specification

```claude
Claude: /create-spec "Dev environment — TS ESNext strict, Biome strict, Husky + lint-staged + commitlint, coverage 98"
Claude: /create-tasks
Claude: /execute-tasks
```

**Expected Deliverables**
- Strict TS + monorepo base; Biome strict; real scripts; coverage 98; Husky/lint-staged/commitlint configured

#### 🔄 Commit Point 4
```bash
git add .
git commit -m "chore(phase-0): dev environment configured (ts, biome, hooks, coverage)"
```

### Step 5: Project Documentation Specification

```claude
Claude: /create-spec "Project docs — README, contributing, workspace docs; ADR scaffolding"
Claude: /create-tasks
Claude: /execute-tasks
```

**Expected Deliverables**
- Docs aligned to standards; ADR scaffolding; status files rendered (optional)

#### 🔄 Commit Point 5
```bash
git add .
git commit -m "docs(phase-0): project documentation and ADR scaffolding"
```

## References

- Dispatcher (slim): `devnet-plan/implementation-plan.slim.md`
- Manifest: `devnet-plan/manifest.json`
- Standards root: `docs/standards/standards.md`
- Conventions: `devnet-plan/context/agent-conventions.md`

## Appendix: Phase 0 Gate Index (Standards)

Use these standards sections when consulting gates via the dispatcher. Verification-runner extracts their verification blocks during `/execute-tasks` Step 6.

- Monorepo essentials: `docs/standards/development/monorepo-setup.md` (see "Verification Tests")
- TypeScript configuration: `docs/standards/development/typescript-config.md` (see "Verification Tests")
- Biome configuration: `docs/standards/development/biome-config.md` (see "Verification Tests")
- Local quality & hooks: `docs/standards/development/local-quality.md` (pre-commit/pre-push hooks; commit message and commitlint configuration)
- Testing & coverage: `docs/standards/development/testing-strategy.md` (verification tests for coverage/reporters)
- Git workflow: `docs/standards/development/git-workflow.md` (git initialization and remote checks)

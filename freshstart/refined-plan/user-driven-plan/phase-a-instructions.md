# Phase A: Foundation Setup — User Instructions

> **Duration**: 2-3 hours | **Goal**: Set up workspace, tooling, and automation foundations

## Overview

Phase A establishes the foundation for your DevNet implementation. You'll create a new workspace with strict tooling, automation, and quality gates that all subsequent phases depend on.

**What you'll build:**
- Clean git repository with monorepo structure
- Strict TypeScript + Biome + Husky automation
- Engineering OS integration
- Quality gates and verification systems

## Prerequisites Check

Before starting, verify your environment:

```bash
# Check required tools
node --version  # Need 22+ LTS
pnpm --version  # Need 10.14.0+
git --version   # Any recent version

# Check environment variables
echo "DEVNET_HOME: ${DEVNET_HOME:-'❌ NOT SET'}"
echo "DEVNET_GIT_REMOTE: ${DEVNET_GIT_REMOTE:-'❌ NOT SET'}"

# Verify target directory is empty or doesn't exist
ls "${DEVNET_HOME:-$HOME/Projects/devnet}" 2>/dev/null && echo "⚠️ Directory exists" || echo "✅ Ready"
```

**Expected**: Node 22+, pnpm 10.14+, environment variables set, empty target directory.

---

## Step A1: Workspace & Repository Bootstrap

### Step A1.1: Create Workspace Foundation

**🔗 COPY THIS TO CLAUDE CODE:**

```
I'm implementing DevNet phase-a foundation workspace setup (Step A1.1).

PROJECT CONTEXT:
- Repository: ${DEVNET_GIT_REMOTE}
- Target workspace: ${DEVNET_HOME:-~/Projects/devnet/}
- Project type: Clean architecture SaaS application
- Tech stack: Next.js, TypeScript, pnpm workspaces, Turbo

CURRENT STATUS: Starting Phase A foundation setup
SPECIFIC TASK: Execute Step A1.1 from phase-a-foundation.md

INSTRUCTIONS:
Please execute the workspace bootstrap process following the DevNet phase-a foundation plan.

Run these commands in sequence:
1. /create-spec "DevNet workspace bootstrap + preflight — initialize empty repo, set origin remote, verify pnpm/turbo alignment, env scaffolding"
2. /create-tasks
3. /execute-tasks

Ensure all deliverables from Step A1.1 are completed:
- New git workspace at target location
- Workspace status logged in DEVNET-CHECKPOINT.txt
- Monorepo configuration files (.nvmrc, pnpm-workspace.yaml, turbo.json)
- Environment configuration (.env.example with documented variables)
```

### Verification After A1.1

Run this to verify Step A1.1 completed successfully:

```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

echo "🔍 Step A1.1 Verification:"
echo "- Git repository: $([ -d .git ] && echo '✅' || echo '❌')"
echo "- pnpm workspace: $([ -f pnpm-workspace.yaml ] && echo '✅' || echo '❌')"
echo "- Turbo config: $([ -f turbo.json ] && echo '✅' || echo '❌')"
echo "- Node version: $([ -f .nvmrc ] && echo '✅' || echo '❌')"
echo "- Environment: $([ -f .env.example ] && echo '✅' || echo '❌')"
echo "- Checkpoint: $([ -f DEVNET-CHECKPOINT.txt ] && echo '✅' || echo '❌')"

# Check git remote if configured
if [ -n "${DEVNET_GIT_REMOTE}" ]; then
  ORIGIN_URL="$(git config --get remote.origin.url 2>/dev/null)"
  echo "- Git remote: $([ "$ORIGIN_URL" = "${DEVNET_GIT_REMOTE}" ] && echo '✅' || echo '❌')"
fi
```

**Expected**: All items should show ✅

### Step A1.2: Commit Checkpoint

**🔗 COPY THIS TO CLAUDE CODE:**

```
I'm continuing DevNet phase-a foundation (Step A1.2) - committing the workspace baseline.

TASK: Create the first commit for the workspace foundation.

Please commit the workspace baseline with this exact command structure:
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"
git add pnpm-workspace.yaml turbo.json .nvmrc .env.example DEVNET-CHECKPOINT.txt DEVNET-PROGRESS.md
git commit -m "chore(phase-a): workspace baseline verified"

Confirm the commit was successful and show the git log.
```

---

## Step A2: Tooling & Automation Hardening

### Step A2.1: Configure Development Tools

**🔗 COPY THIS TO CLAUDE CODE:**

```
I'm implementing DevNet phase-a foundation tooling hardening (Step A2).

PROJECT CONTEXT:
- Working directory: ${DEVNET_HOME:-~/Projects/devnet/}
- Goal: Strict TypeScript, Biome linting, Husky automation, coverage thresholds
- Target: Enterprise-grade development tooling

CURRENT STATUS: Workspace foundation complete, now adding tooling automation
SPECIFIC TASK: Execute Step A2 from phase-a-foundation.md

INSTRUCTIONS:
Please execute the tooling hardening process following the DevNet phase-a foundation plan.

Run these commands in sequence:
1. /create-spec "Tooling hardening — TypeScript strict, Biome strict, Husky + lint-staged + commitlint, coverage >=98"
2. /create-tasks
3. /execute-tasks

Ensure all deliverables from Step A2 are completed:
- tsconfig.base.json with strict mode and project references
- biome.json with enforced repo-wide rules
- Husky hooks for pre-commit and commit-msg
- Coverage threshold configuration (≥98%)
- Working lint, format, and commit automation
```

### Verification After A2

Run this to verify Step A2 completed successfully:

```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

echo "🔍 Step A2 Verification:"
echo "- TypeScript config: $([ -f tsconfig.base.json ] && echo '✅' || echo '❌')"
echo "- Biome config: $([ -f biome.json ] && echo '✅' || echo '❌')"
echo "- Husky directory: $([ -d .husky ] && echo '✅' || echo '❌')"
echo "- Lint-staged: $(find . -name '*lint-staged*' | head -1 | sed 's/.*\///' | sed 's/^/✅ /' || echo '❌')"

# Test automation
echo ""
echo "🧪 Automation Tests:"
pnpm lint >/dev/null 2>&1 && echo "- Lint command: ✅" || echo "- Lint command: ❌"
pnpm format --check >/dev/null 2>&1 && echo "- Format check: ✅" || echo "- Format check: ❌"

# Check git hooks
[ -f .husky/pre-commit ] && echo "- Pre-commit hook: ✅" || echo "- Pre-commit hook: ❌"
```

**Expected**: All items should show ✅, automation tests should pass

### Step A2.2: Commit Tooling Setup

**🔗 COPY THIS TO CLAUDE CODE:**

```
I'm continuing DevNet phase-a foundation - committing the tooling automation setup.

TASK: Commit the tooling and automation configuration.

Please commit the tooling setup with this exact command structure:
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"
git add tsconfig.base.json biome.json package.json .husky/ lint-staged.config.* commitlint.config.*
git commit -m "chore(phase-a): tooling automation hardened"

Confirm the commit was successful.
```

---

## Step A3: Engineering OS Integration

### Step A3.1: Configure EOS Systems

**🔗 COPY THIS TO CLAUDE CODE:**

```
I'm implementing DevNet phase-a foundation Engineering OS integration (Step A3).

PROJECT CONTEXT:
- Working directory: ${DEVNET_HOME:-~/Projects/devnet/}
- Goal: EOS scripts, standards routing, verification runners
- Integration: Connect to freshstart/refined-plan/implementation-plan.md

CURRENT STATUS: Workspace and tooling complete, now adding EOS integration
SPECIFIC TASK: Execute Step A3 from phase-a-foundation.md

INSTRUCTIONS:
Please execute the Engineering OS integration following the DevNet phase-a foundation plan.

Run these commands in sequence:
1. /create-spec "Engineering OS integration — scripts wiring, standards routing, verification runner smoke test"
2. /create-tasks
3. /execute-tasks

Ensure all deliverables from Step A3 are completed:
- scripts/ directory with EOS helpers and verification configs
- Plan dispatcher linked in DEVNET-CHECKPOINT.txt
- Working verification runner (pnpm verify:local)
- ADR stub for tooling decisions
- All quality gates passing
```

### Verification After A3

Run this to verify Step A3 completed successfully:

```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

echo "🔍 Step A3 Verification:"
echo "- Scripts directory: $([ -d scripts ] && echo '✅' || echo '❌')"
echo "- Checkpoint updated: $(grep -q 'Phase A' DEVNET-CHECKPOINT.txt 2>/dev/null && echo '✅' || echo '❌')"
echo "- Progress tracker: $([ -f DEVNET-PROGRESS.md ] && echo '✅' || echo '❌')"

# Test verification system
echo ""
echo "🧪 EOS Integration Test:"
if pnpm verify:local >/dev/null 2>&1; then
  echo "- pnpm verify:local: ✅ PASSES"
else
  echo "- pnpm verify:local: ❌ FAILS (must fix before Phase B)"
fi

# Repository state
echo ""
echo "📊 Repository State:"
echo "- Uncommitted changes: $(git status --porcelain | wc -l | tr -d ' ')"
echo "- Total commits: $(git rev-list --count HEAD)"
```

**Expected**: All items should show ✅, pnpm verify:local must pass

### Step A3.2: Final Commit & Phase Completion

**🔗 COPY THIS TO CLAUDE CODE:**

```
I'm completing DevNet phase-a foundation - final commit and phase validation.

TASKS:
1. Commit the Engineering OS integration
2. Validate Phase A completion
3. Prepare for Phase B transition

Please execute:

1. Commit EOS integration:
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"
git add scripts/ DEVNET-CHECKPOINT.txt DEVNET-PROGRESS.md docs/ ADRs/ .adr-dir
git commit -m "chore(phase-a): engineering os runner integrated"

2. Run complete Phase A validation:
- Verify all systems working (pnpm verify:local)
- Confirm git repository is clean
- Validate all deliverables present

3. Update checkpoint with Phase A completion status and next phase pointer.

Show final status and confirm Phase A is complete and ready for Phase B.
```

---

## Phase A Completion

### Final Verification

Run this comprehensive check to confirm Phase A is complete:

```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

echo "🎯 Phase A Completion Check:"
echo ""

# Core workspace
echo "Workspace Foundation:"
echo "- Git repository: $([ -d .git ] && echo '✅' || echo '❌')"
echo "- Monorepo config: $([ -f pnpm-workspace.yaml ] && [ -f turbo.json ] && echo '✅' || echo '❌')"
echo "- Node/pnpm config: $([ -f .nvmrc ] && echo '✅' || echo '❌')"

# Tooling
echo ""
echo "Development Tooling:"
echo "- TypeScript: $([ -f tsconfig.base.json ] && echo '✅' || echo '❌')"
echo "- Biome linting: $([ -f biome.json ] && echo '✅' || echo '❌')"
echo "- Git automation: $([ -d .husky ] && echo '✅' || echo '❌')"

# EOS Integration
echo ""
echo "Engineering OS:"
echo "- Scripts directory: $([ -d scripts ] && echo '✅' || echo '❌')"
echo "- Verification runner: $(pnpm verify:local >/dev/null 2>&1 && echo '✅ passes' || echo '❌ fails')"

# Progress tracking
echo ""
echo "Progress Tracking:"
echo "- Checkpoint file: $([ -f DEVNET-CHECKPOINT.txt ] && echo '✅' || echo '❌')"
echo "- Clean git state: $([ $(git status --porcelain | wc -l) -eq 0 ] && echo '✅' || echo '❌')"

echo ""
if pnpm verify:local >/dev/null 2>&1 && [ $(git status --porcelain | wc -l) -eq 0 ]; then
  echo "🎉 Phase A Complete! Ready for Phase B."
  echo ""
  echo "Next Steps:"
  echo "1. Proceed to Phase B: Architecture Spine"
  echo "2. Use phase-b-instructions.md for next steps"
else
  echo "❌ Phase A not complete. Review failed items above."
fi
```

### Success Criteria

✅ **All verification items pass**
✅ **pnpm verify:local command works**
✅ **Git repository is clean with all changes committed**
✅ **Workspace ready for Phase B architecture work**

### Troubleshooting

**Issue**: `pnpm verify:local` command not found
**Solution**: Check package.json scripts. Ask Claude Code to add missing verification scripts.

**Issue**: Git hooks not working
**Solution**: Ensure Husky was properly installed. Run `pnpm prepare` if needed.

**Issue**: TypeScript/Biome errors
**Solution**: Check config file syntax. Run `pnpm lint --fix` to auto-fix issues.

**Issue**: Environment variables not set
**Solution**: Add variables to shell profile and restart terminal.

---

## Next Phase

**🎉 Phase A Complete!**

**What you've accomplished:**
- ✅ Clean workspace with monorepo structure
- ✅ Strict TypeScript + Biome + Husky automation
- ✅ Engineering OS integration and verification systems
- ✅ Quality gates and progress tracking established

**👉 Next**: Proceed to **[Phase B: Architecture Spine](phase-b-instructions.md)** to build the foundational contracts, core abstractions, and infrastructure interfaces.
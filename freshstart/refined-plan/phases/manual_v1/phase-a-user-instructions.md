# Phase A: Engineering OS Foundation — User Instructions

> **Goal**: Set up workspace, tooling automation, and quality gates for the DevNet implementation.

## Quick Context

You're creating a new, clean implementation repository with all the automation, tooling, and quality gates needed for the subsequent phases. This phase establishes the foundation that all other phases depend on.

**Duration**: 2-3 hours
**Prerequisites**: Clean environment, no existing `~/Projects/devnet/` directory

## Before You Start

### Environment Check
Copy and run this verification block first:

```bash
# Check prerequisites
echo "🔍 Prerequisites Check:"
echo "- Node version: $(node --version)"
echo "- pnpm version: $(pnpm --version)"
echo "- Git version: $(git --version)"
echo ""

# Check environment variables
echo "📝 Environment Variables:"
echo "- DEVNET_HOME: ${DEVNET_HOME:-'⚠️  NOT SET (will use default ~/Projects/devnet)'}"
echo "- ENGINEERING_OS_HOME: ${ENGINEERING_OS_HOME:-'⚠️  NOT SET (will use default ~/Projects/devnet.starter)'}"
echo "- DEVNET_GIT_REMOTE: ${DEVNET_GIT_REMOTE:-'⚠️  NOT SET (will prompt during setup)'}"
echo ""

# Check workspace state
DEVNET_PATH="${DEVNET_HOME:-$HOME/Projects/devnet}"
if [ -d "$DEVNET_PATH" ] && [ "$(ls -A "$DEVNET_PATH" 2>/dev/null)" ]; then
  echo "❌ $DEVNET_PATH is not empty — clear it or choose a fresh directory"
else
  echo "✅ Implementation workspace ready for creation at $DEVNET_PATH"
fi
```

### Expected Output
You should see:
- Node 22+ and pnpm 10.14.0+
- Either environment variables set OR acknowledgment of defaults
- Green checkmark for workspace readiness

---

## Step A1: Workspace & Repository Bootstrap

### What You're Doing
Creating a new git repository with the basic monorepo structure (pnpm workspaces, turbo, environment files).

### Copy This Into Claude Code:

```
I need you to bootstrap a new DevNet implementation workspace. Here's what I need:

**Context**: I'm implementing a clean architecture SaaS application using the DevNet refined plan. This is Phase A - Foundation setup.

**Requirements**:
1. Create a new git repository at `${DEVNET_HOME:-~/Projects/devnet/}`
2. Initialize with proper monorepo structure using pnpm workspaces and Turbo
3. Set up `.nvmrc` for Node 22 LTS, basic `turbo.json`, and `pnpm-workspace.yaml`
4. Create `.env.example` with documented environment variables for development
5. Set up initial `DEVNET-CHECKPOINT.txt` and `DEVNET-PROGRESS.md` files
6. Configure git remote if DEVNET_GIT_REMOTE is provided

**Standards to follow**: Reference `docs/standards/development/monorepo-setup.md` from the devnet.starter repository for structure patterns.

**Deliverables**:
- New git workspace initialized
- Monorepo configuration files (pnpm-workspace.yaml, turbo.json, .nvmrc)
- Environment configuration (.env.example with documented variables)
- Progress tracking files (DEVNET-CHECKPOINT.txt, DEVNET-PROGRESS.md)
- Git remote configured (if DEVNET_GIT_REMOTE is set)

Please implement this step by step and let me know when it's complete.
```

### Verify Success:
```bash
DEVNET_PATH="${DEVNET_HOME:-$HOME/Projects/devnet}"
cd "$DEVNET_PATH"

echo "🔍 Workspace Verification:"
echo "- Git initialized: $([ -d .git ] && echo '✅' || echo '❌')"
echo "- pnpm workspace: $([ -f pnpm-workspace.yaml ] && echo '✅' || echo '❌')"
echo "- Turbo config: $([ -f turbo.json ] && echo '✅' || echo '❌')"
echo "- Node version file: $([ -f .nvmrc ] && echo '✅' || echo '❌')"
echo "- Environment example: $([ -f .env.example ] && echo '✅' || echo '❌')"
echo "- Progress tracking: $([ -f DEVNET-CHECKPOINT.txt ] && echo '✅' || echo '❌')"

# Check git remote if expected
if [ -n "${DEVNET_GIT_REMOTE}" ]; then
  ORIGIN_URL="$(git config --get remote.origin.url 2>/dev/null)"
  if [ "$ORIGIN_URL" = "${DEVNET_GIT_REMOTE}" ]; then
    echo "- Git remote: ✅ matches expected"
  else
    echo "- Git remote: ❌ expected ${DEVNET_GIT_REMOTE}, got ${ORIGIN_URL:-'none'}"
  fi
fi
```

### Expected Output
All items should show ✅. If any show ❌, ask Claude Code to fix the specific issues.

### Commit Checkpoint
```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"
git add pnpm-workspace.yaml turbo.json .nvmrc .env.example DEVNET-CHECKPOINT.txt DEVNET-PROGRESS.md
git commit -m "chore(phase-a): workspace baseline verified"
```

---

## Step A2: Tooling & Automation Hardening

### What You're Doing
Setting up strict TypeScript configuration, Biome for linting/formatting, Husky for git hooks, and coverage thresholds for quality gates.

### Copy This Into Claude Code:

```
Now I need to harden the tooling and automation for the DevNet workspace. This is Phase A, Step A2.

**Context**: Building on the workspace foundation, now adding strict development tools and automation.

**Requirements**:
1. Configure strict TypeScript with `tsconfig.base.json` and project references
2. Set up Biome for code linting and formatting with strict rules
3. Install and configure Husky for git hooks (pre-commit and commit-msg)
4. Configure lint-staged for pre-commit automation
5. Set up commitlint for conventional commit messages
6. Configure coverage thresholds at ≥98% (Jest/Vitest configuration)
7. Add npm scripts for common development tasks

**Standards to follow**:
- `docs/standards/development/typescript-config.md`
- `docs/standards/development/local-quality.md`
- `docs/standards/development/git-workflow.md`

**Quality Gates**:
- All linting rules should be strict/error level
- Pre-commit hooks should block commits that fail lint/format/type checks
- Coverage thresholds should be enforced (≥98%)
- Conventional commit messages required

**Deliverables**:
- `tsconfig.base.json` with strict configuration
- `biome.json` with enforced rules
- `.husky/` directory with pre-commit and commit-msg hooks
- `lint-staged.config.js` (or similar) for pre-commit tasks
- Coverage configuration in appropriate test config file
- Updated `package.json` with scripts and dev dependencies

Please implement all tooling and then run the verification commands to ensure everything works.
```

### Verify Success:
```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

echo "🔍 Tooling Verification:"
echo "- TypeScript config: $([ -f tsconfig.base.json ] && echo '✅' || echo '❌')"
echo "- Biome config: $([ -f biome.json ] && echo '✅' || echo '❌')"
echo "- Husky directory: $([ -d .husky ] && echo '✅' || echo '❌')"
echo "- Lint-staged config: $(find . -name '*lint-staged*' -type f | head -1 | sed 's/.*\///' | sed 's/^/✅ /' || echo '❌')"

# Test the automation
echo ""
echo "🧪 Automation Tests:"
if command -v pnpm >/dev/null 2>&1; then
  echo "- pnpm lint: $(pnpm lint >/dev/null 2>&1 && echo '✅ passes' || echo '❌ fails')"
  echo "- pnpm format check: $(pnpm format --check >/dev/null 2>&1 && echo '✅ passes' || echo '❌ fails')"
else
  echo "- pnpm not available in this context"
fi

# Check git hooks
if [ -f .husky/pre-commit ]; then
  echo "- Pre-commit hook: ✅ exists"
else
  echo "- Pre-commit hook: ❌ missing"
fi
```

### Expected Output
All tooling items should show ✅ and automation tests should pass.

### Commit Checkpoint
```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"
git add tsconfig.base.json biome.json package.json .husky/ lint-staged.config.* commitlint.config.*
git commit -m "chore(phase-a): tooling automation hardened"
```

---

## Step A3: Engineering OS Integration

### What You're Doing
Setting up Engineering OS (EOS) scripts, standards routing, and verification runners that will be used throughout all subsequent phases.

### Copy This Into Claude Code:

```
Final step for Phase A: Engineering OS integration. This sets up the automation framework that subsequent phases will use.

**Context**: Phase A, Step A3 - Integration with Engineering OS verification and task automation.

**Requirements**:
1. Set up `scripts/` directory with EOS helper scripts
2. Configure standards routing and verification runner
3. Create plan dispatcher linkage to `freshstart/refined-plan/implementation-plan.md`
4. Set up verification runner for lint/type-check/test workflows
5. Update `DEVNET-CHECKPOINT.txt` with Phase A completion status
6. Create ADR stub or decision log for tooling choices
7. Ensure `/execute-tasks` workflow can run basic verifications

**Standards Integration**:
- Link to standards in `docs/standards/` for automated verification
- Configure verification runner to check standards compliance
- Set up EOS command integration for future phases

**Verification Requirements**:
- `pnpm verify:local` command should exist and pass
- Standards verification should be functional
- Progress tracking updated with Phase A exit status
- Plan dispatcher ready for Phase B transition

**Deliverables**:
- `scripts/` directory with EOS helpers and verification configs
- Updated `DEVNET-CHECKPOINT.txt` with Phase A completion
- ADR entry for major tooling decisions
- Working verification commands for quality gates

Please implement the EOS integration and run final verification to confirm Phase A is complete.
```

### Verify Success:
```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

echo "🔍 EOS Integration Verification:"
echo "- Scripts directory: $([ -d scripts ] && echo '✅' || echo '❌')"
echo "- Checkpoint updated: $([ -f DEVNET-CHECKPOINT.txt ] && grep -q 'Phase A' DEVNET-CHECKPOINT.txt && echo '✅' || echo '❌')"
echo "- Progress tracker: $([ -f DEVNET-PROGRESS.md ] && echo '✅' || echo '❌')"

# Test verification command
echo ""
echo "🧪 Final Phase A Verification:"
if command -v pnpm >/dev/null 2>&1; then
  if pnpm verify:local >/dev/null 2>&1; then
    echo "- pnpm verify:local: ✅ passes"
  else
    echo "- pnpm verify:local: ❌ fails (this needs to work before Phase B)"
  fi
else
  echo "- Verification commands will be tested after pnpm install"
fi

# Check repository state
echo ""
echo "📊 Repository State:"
echo "- Uncommitted changes: $(git status --porcelain | wc -l | tr -d ' ')"
echo "- Total commits: $(git rev-list --count HEAD)"
echo "- Current branch: $(git branch --show-current)"
```

### Expected Output
- All EOS integration items should show ✅
- `pnpm verify:local` should pass
- Repository should be clean (0 uncommitted changes)

### Final Commit Checkpoint
```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"
git add scripts/ DEVNET-CHECKPOINT.txt DEVNET-PROGRESS.md docs/ ADRs/ .adr-dir
git commit -m "chore(phase-a): engineering os runner integrated"
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
echo "- Verification runner: $(command -v pnpm >/dev/null && pnpm verify:local >/dev/null 2>&1 && echo '✅ passes' || echo '❌ fails/missing')"

# Progress tracking
echo ""
echo "Progress Tracking:"
echo "- Checkpoint file: $([ -f DEVNET-CHECKPOINT.txt ] && echo '✅' || echo '❌')"
echo "- Clean git state: $([ $(git status --porcelain | wc -l) -eq 0 ] && echo '✅' || echo '❌')"

echo ""
if [ $(git status --porcelain | wc -l) -eq 0 ] && [ -f DEVNET-CHECKPOINT.txt ] && [ -f biome.json ]; then
  echo "🎉 Phase A Complete! Ready for Phase B."
  echo ""
  echo "Next Steps:"
  echo "1. Return to the USER-EXECUTION-GUIDE.md"
  echo "2. Proceed to Phase B: Architecture Spine"
else
  echo "❌ Phase A not complete. Review failed items above."
fi
```

### Success Criteria Met
✅ All verification items pass
✅ `pnpm verify:local` command works
✅ Git repository is clean with all changes committed
✅ Workspace ready for Phase B architecture work

### Rollback Procedure (If Needed)
If Phase A fails or needs to be restarted:

```bash
# Completely reset and start over
rm -rf "${DEVNET_HOME:-$HOME/Projects/devnet}"
# Then restart from Step A1
```

### Troubleshooting Common Issues

**Issue**: `pnpm verify:local` command not found
**Solution**: Check that the verify:local script was added to package.json. Ask Claude Code to add missing verification scripts.

**Issue**: Git hooks not working
**Solution**: Ensure Husky was properly installed with `pnpm prepare` or similar setup command.

**Issue**: TypeScript/Biome errors
**Solution**: Check that all config files exist and have proper syntax. Run `pnpm lint --fix` to auto-fix issues.

---

**Phase A Complete!** 🎉

**Next**: Return to [USER-EXECUTION-GUIDE.md](../USER-EXECUTION-GUIDE.md) and proceed to **Phase B: Architecture Spine**.
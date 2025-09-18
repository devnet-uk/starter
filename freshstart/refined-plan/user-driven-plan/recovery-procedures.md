# DevNet Recovery Procedures

> **Step-by-step recovery procedures for DevNet implementation issues**

## Recovery Strategy Overview

### Recovery Levels

1. **Soft Recovery**: Fix current issues without losing work
2. **Phase Reset**: Reset to the beginning of current phase
3. **Checkpoint Reset**: Reset to last completed phase
4. **Hard Reset**: Complete restart from Phase A
5. **Emergency Reset**: Nuclear option - complete workspace recreation

### Before You Recover

**⚠️ Always backup your work first:**

```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

# Create backup branch
git checkout -b backup-$(date +%Y%m%d-%H%M%S)
git add -A
git commit -m "Backup before recovery procedure"

# Return to main branch
git checkout main
```

## Soft Recovery Procedures

### Fix Common Issues Without Data Loss

**Clear Build Artifacts**
```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

# Clear all build outputs
rm -rf dist packages/*/dist
rm -rf .next apps/*/.next
rm -rf coverage packages/*/coverage
rm -rf .turbo

# Rebuild everything
pnpm install
pnpm build
```

**Reset Dependencies**
```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

# Clear all node_modules
rm -rf node_modules packages/*/node_modules apps/*/node_modules

# Clear pnpm cache (optional)
pnpm store prune

# Reinstall everything
pnpm install
```

**Fix Git State Issues**
```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

# Unstage all changes
git reset HEAD

# Discard unstaged changes (⚠️ loses uncommitted work)
git checkout -- .

# Remove untracked files (⚠️ loses new files)
git clean -fd
```

**Reset Specific Package**
```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

# Reset single package (example: contracts)
rm -rf packages/contracts/node_modules packages/contracts/dist
pnpm --filter @repo/contracts install
pnpm --filter @repo/contracts build
```

## Phase Reset Procedures

### Reset to Beginning of Current Phase

**Identify Current Phase**
```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

echo "🔍 Current Phase Detection:"
if [ -f DEVNET-CHECKPOINT.txt ]; then
  echo "Last checkpoint:"
  tail -5 DEVNET-CHECKPOINT.txt
else
  echo "No checkpoint file found"
fi

echo ""
echo "Recent commits:"
git log --oneline -10
```

**Reset to Phase A Start**
```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

# Find Phase A commits
git log --oneline --grep="phase-a"

# Reset to before Phase A (clean workspace)
git log --oneline | grep -E "(initial|workspace|bootstrap)" | head -1

# If you have a clean workspace commit:
git reset --hard <commit-hash>

# If no clean commit exists, see Hard Reset section
```

**Reset to Phase B Start**
```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

# Find last Phase A commit
PHASE_A_COMMIT=$(git log --oneline --grep="phase-a" | tail -1 | cut -d' ' -f1)
echo "Phase A completion commit: $PHASE_A_COMMIT"

# Reset to Phase A completion
git reset --hard $PHASE_A_COMMIT
git clean -fd

# Verify Phase A is complete
pnpm verify:local
```

**Reset to Phase C Start**
```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

# Find last Phase B commit
PHASE_B_COMMIT=$(git log --oneline --grep="phase-b" | tail -1 | cut -d' ' -f1)
echo "Phase B completion commit: $PHASE_B_COMMIT"

# Reset to Phase B completion
git reset --hard $PHASE_B_COMMIT
git clean -fd

# Verify architecture spine is complete
pnpm build
pnpm verify:local
```

**Reset to Phase D Start**
```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

# Find last Phase C commit
PHASE_C_COMMIT=$(git log --oneline --grep="phase-c.*complete" | head -1 | cut -d' ' -f1)
echo "Phase C completion commit: $PHASE_C_COMMIT"

# Reset to Phase C completion
git reset --hard $PHASE_C_COMMIT
git clean -fd

# Verify all domain capabilities are complete
pnpm --filter @repo/core test
pnpm build
```

**Reset to Phase E Start**
```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

# Find last Phase D commit
PHASE_D_COMMIT=$(git log --oneline --grep="phase-d.*complete" | head -1 | cut -d' ' -f1)
echo "Phase D completion commit: $PHASE_D_COMMIT"

# Reset to Phase D completion
git reset --hard $PHASE_D_COMMIT
git clean -fd

# Verify delivery layers are complete
pnpm build
pnpm --filter @repo/web e2e --version  # Check E2E setup
```

## Checkpoint Reset Procedures

### Reset to Last Completed Phase

**Automated Checkpoint Detection**
```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

echo "🔍 Finding Last Completed Phase:"

# Function to find last completed phase
find_last_phase() {
  for phase in E D C B A; do
    if git log --oneline --grep="phase-$(echo $phase | tr 'A-Z' 'a-z').*complete" | head -1 >/dev/null; then
      echo $phase
      return
    fi
  done
  echo "NONE"
}

LAST_PHASE=$(find_last_phase)
echo "Last completed phase: $LAST_PHASE"

# Reset to that phase
if [ "$LAST_PHASE" != "NONE" ]; then
  PHASE_COMMIT=$(git log --oneline --grep="phase-$(echo $LAST_PHASE | tr 'A-Z' 'a-z').*complete" | head -1 | cut -d' ' -f1)
  echo "Resetting to commit: $PHASE_COMMIT"
  git reset --hard $PHASE_COMMIT
  git clean -fd
else
  echo "No completed phases found. Consider Hard Reset."
fi
```

**Manual Checkpoint Reset**
```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

# List all phase completion commits
echo "📋 Available Phase Completions:"
git log --oneline --grep="phase-[a-e].*complete" | head -10

# Choose commit and reset
echo "Enter commit hash to reset to:"
read COMMIT_HASH

git reset --hard $COMMIT_HASH
git clean -fd

echo "✅ Reset complete. Verify state:"
pnpm build
pnpm verify:local
```

## Hard Reset Procedures

### Complete Restart from Phase A

**Full Workspace Reset**
```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

echo "⚠️  HARD RESET: This will destroy all uncommitted work!"
echo "Are you sure? (Type 'YES' to continue)"
read CONFIRMATION

if [ "$CONFIRMATION" = "YES" ]; then
  # Reset to initial commit or delete everything
  git log --oneline | tail -1  # Shows first commit

  # Option 1: Reset to first commit
  FIRST_COMMIT=$(git log --oneline | tail -1 | cut -d' ' -f1)
  git reset --hard $FIRST_COMMIT

  # Option 2: Clean everything except .git
  find . -not -path './.git/*' -not -name '.git' -delete

  # Clean git state
  git clean -fd

  echo "✅ Hard reset complete. Ready for Phase A."
else
  echo "❌ Hard reset cancelled."
fi
```

**Selective Hard Reset**
```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

# Keep git history but reset all files
git reset --hard HEAD~50  # Go back 50 commits
git clean -fd

# Or reset to specific known good commit
git log --oneline | grep -E "(initial|baseline|foundation)"
git reset --hard <commit-hash>
```

## Emergency Reset Procedures

### Nuclear Option: Complete Workspace Recreation

**Full Directory Reset**
```bash
echo "☢️  EMERGENCY RESET: Complete workspace destruction!"
echo "This will delete EVERYTHING in ${DEVNET_HOME:-$HOME/Projects/devnet}"
echo "Type 'NUCLEAR' to continue:"
read CONFIRMATION

if [ "$CONFIRMATION" = "NUCLEAR" ]; then
  # Backup git remote URL
  cd "${DEVNET_HOME:-$HOME/Projects/devnet}"
  REMOTE_URL=$(git config --get remote.origin.url 2>/dev/null)
  echo "Backing up remote URL: $REMOTE_URL"

  # Destroy and recreate
  cd ..
  rm -rf "${DEVNET_HOME:-$HOME/Projects/devnet}"
  mkdir -p "${DEVNET_HOME:-$HOME/Projects/devnet}"
  cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

  # Reinitialize git
  git init
  if [ -n "$REMOTE_URL" ]; then
    git remote add origin "$REMOTE_URL"
  fi

  # Create initial commit
  echo "# DevNet Implementation" > README.md
  echo "Fresh start after emergency reset" >> README.md
  git add README.md
  git commit -m "Emergency reset: fresh start"

  echo "✅ Emergency reset complete. Start from Phase A."
  echo "Remote URL restored: $REMOTE_URL"
else
  echo "❌ Emergency reset cancelled."
fi
```

**Environment Reset**
```bash
# Reset environment variables (add to shell profile if needed)
export DEVNET_HOME="$HOME/Projects/devnet"
export ENGINEERING_OS_HOME="$HOME/Projects/devnet.starter"
# Update with your actual GitHub URL:
export DEVNET_GIT_REMOTE="git@github.com:YOUR_USERNAME/devnet.git"

# Clear any cached pnpm data
pnpm store prune

# Reset global tools if needed
npm install -g pnpm@latest
```

## Recovery Verification

### Post-Recovery Checks

**Basic System Verification**
```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

echo "🔍 Post-Recovery Verification:"
echo "Current directory: $(pwd)"
echo "Git status: $(git status --porcelain | wc -l) uncommitted files"
echo "Git branch: $(git branch --show-current)"
echo "Last commit: $(git log -1 --oneline)"
echo ""

# Environment check
echo "📝 Environment:"
echo "- DEVNET_HOME: ${DEVNET_HOME:-'UNSET'}"
echo "- Node: $(node --version 2>/dev/null || echo 'MISSING')"
echo "- pnpm: $(pnpm --version 2>/dev/null || echo 'MISSING')"
echo ""

# Dependencies check
if [ -f package.json ]; then
  echo "📦 Dependencies:"
  pnpm install >/dev/null 2>&1 && echo "- Install: ✅" || echo "- Install: ❌"
  pnpm build >/dev/null 2>&1 && echo "- Build: ✅" || echo "- Build: ❌"

  # Phase-specific checks
  if [ -f packages/contracts/package.json ]; then
    echo "- Phase B architecture: ✅ packages exist"
  fi

  if [ -f packages/core/package.json ]; then
    pnpm --filter @repo/core test >/dev/null 2>&1 && echo "- Phase C domain: ✅" || echo "- Phase C domain: ❌"
  fi

  if [ -d apps/web ]; then
    echo "- Phase D delivery: ✅ frontend exists"
  fi
else
  echo "❌ No package.json found - complete reset needed"
fi
```

**Phase-Specific Verification**

```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

echo "🎯 Phase Verification:"

# Phase A: Foundation
if [ -f tsconfig.base.json ] && [ -f biome.json ]; then
  echo "- Phase A Foundation: ✅ Tooling configured"
else
  echo "- Phase A Foundation: ❌ Missing tooling config"
fi

# Phase B: Architecture
if [ -d packages/contracts ] && [ -d packages/core ] && [ -d packages/infrastructure ]; then
  echo "- Phase B Architecture: ✅ All packages exist"
else
  echo "- Phase B Architecture: ❌ Missing packages"
fi

# Phase C: Domain
DOMAIN_ENTITIES=$(find packages/core -name '*User*.ts' -o -name '*Org*.ts' -o -name '*Subscription*.ts' 2>/dev/null | wc -l)
if [ $DOMAIN_ENTITIES -gt 0 ]; then
  echo "- Phase C Domain: ✅ $DOMAIN_ENTITIES domain entities found"
else
  echo "- Phase C Domain: ❌ No domain entities found"
fi

# Phase D: Delivery
if [ -d packages/api ] && [ -d apps/web/tests ]; then
  echo "- Phase D Delivery: ✅ API and E2E tests exist"
else
  echo "- Phase D Delivery: ❌ Missing delivery components"
fi

# Phase E: Production
if [ -d docs/security ] && [ -d docs/operations ]; then
  echo "- Phase E Production: ✅ Operational docs exist"
else
  echo "- Phase E Production: ❌ Missing operational components"
fi
```

## Recovery Best Practices

### Prevention

**Regular Backups**
```bash
# Create backup before each phase
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

# Tag important milestones
git tag "phase-a-backup-$(date +%Y%m%d)"
git tag "phase-b-backup-$(date +%Y%m%d)"
# etc.

# Push tags to remote
git push origin --tags
```

**Checkpoint Validation**
```bash
# Always verify after major steps
pnpm build
pnpm verify:local
pnpm test

# Commit frequently with descriptive messages
git add .
git commit -m "step-b1: contracts package complete and tested"
```

### Recovery Planning

**Know Your Exit Points**
- Phase A complete: Tooling working, `pnpm verify:local` passes
- Phase B complete: All packages build, architecture tests pass
- Phase C complete: Domain tests pass, 100% coverage achieved
- Phase D complete: E2E tests exist and API/frontend integrated
- Phase E complete: Production docs and deployment ready

**Recovery Decision Tree**
1. **Minor issues**: Try soft recovery first
2. **Build/dependency issues**: Reset dependencies and rebuild
3. **Phase-specific issues**: Reset to beginning of current phase
4. **Major corruption**: Reset to last completed phase
5. **Complete failure**: Hard reset or emergency procedures

### Post-Recovery Actions

**Resume Implementation**
```bash
# After any recovery, verify current state
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

# Check where you are
echo "📍 Current Position:"
if [ -f DEVNET-CHECKPOINT.txt ]; then
  tail -3 DEVNET-CHECKPOINT.txt
fi

# Determine next steps
echo ""
echo "🎯 Next Steps:"
echo "1. Review EXECUTION-GUIDE.md for current phase"
echo "2. Run phase-specific verification"
echo "3. Continue with next step in sequence"
```

---

**Remember**: Recovery procedures are safety nets, not daily tools. Focus on prevention through regular commits and verification. When recovery is needed, choose the least destructive option that solves your problem.
# devnet Checkpoint System

## Overview

The devnet checkpoint system enables seamless restarts and progress tracking through two complementary files:

1. **DEVNET-PROGRESS.md** - Comprehensive visual progress tracker with checkboxes
2. **DEVNET-CHECKPOINT.txt** - Simple restart instructions for quick continuation

## Checkpoint Files Structure

### DEVNET-CHECKPOINT.txt (Simple Restart)
```
LAST_COMPLETED: Phase 1, Step 3 - Domain Events & Value Objects Implementation
NEXT_ACTION: Start Phase 2, Step 1 - Authentication & Core Use Cases Implementation
CURRENT_FILE: devnet-plan/phases/phase-2-use-cases.md
GIT_TAG: v0.1.0-domain-verified
COVERAGE: Domain 100%, Overall 25% (domain complete, 28 verification tests passed)
NOTE: Domain layer complete with 100% Clean Architecture compliance. Next: Use cases layer
```

### DEVNET-PROGRESS.md (Visual Tracker)
```markdown
# devnet Implementation Progress Tracker

## Phase 0: Infrastructure & Project Setup
- [x] Step 1: Repository Infrastructure Specification
- [x] Step 2: Monorepo Architecture Specification
- [x] Step 3: Core Packages Architecture Specification
- [x] Step 4: Development Environment Specification
- [x] Step 5: Project Documentation Specification
- [x] 🔄 CONTEXT CLEAR POINT (After git tag v0.0.1-infrastructure)

## Phase 1: Core Domain Layer
- [x] Step 1: Domain Entities Implementation (Enhanced with Embedded Verification)
- [x] Step 2: Domain Services Implementation (Enhanced with Embedded Verification)
- [x] Step 3: Domain Events & Value Objects Implementation (Enhanced with Embedded Verification)
- [x] 🔐 Phase Gate: Domain Layer Verification Complete (28 tests)
- [x] 🔄 CONTEXT CLEAR POINT (After git tag v0.1.0-domain-verified)

## Phase 2: Use Cases & Business Logic
- [ ] Step 1: Authentication & Core Use Cases Implementation
- [ ] Step 2: Organization Management & Billing Use Cases Implementation
- [ ] Step 3: AI Chat & Analytics Use Cases Implementation
- [ ] 🔄 CONTEXT CLEAR POINT (After git tag v0.2.0-enhanced-use-cases)

[Remaining phases...]

## Last Checkpoint
**Date:** [timestamp]
**Last Completed:** Phase 1, Step 3 - Domain Events & Value Objects Implementation
**Git Tag:** v0.1.0-domain-verified
**Next Step:** Start Phase 2, Step 1 - Authentication & Core Use Cases Implementation
**Current File:** devnet-plan/phases/phase-2-use-cases.md
**Coverage:** Domain 100%, Overall 25%
**Critical Notes:** Domain layer complete with embedded verification compliance. Next: Use cases layer
```

## Context Clear Points

### Primary Clear Points (Mandatory)
Occur at the end of each major phase:

- **Phase 0 → Phase 1** (Infrastructure → Domain)
- **Phase 1 → Phase 2** (Domain → Use Cases)  
- **Phase 2 → Phase 3** (Use Cases → Infrastructure)
- **Phase 3 → Phase 4** (Infrastructure → Interface Adapters)
- **Phase 4 → Phase 5** (Interface Adapters → Presentation)
- **Phase 5 → Phase 6** (Presentation → Deployment)

### Secondary Clear Points (Optional)
Performance-based clearing when:

- Context usage exceeds 80% of window capacity
- Response times exceed 5 seconds
- Before loading large standard sets (5+ files)
- After complex verification suites (20+ embedded tests)

### Never Clear During

**Critical Continuity Points:**
- Mid-step implementation within a phase
- Active embedded verification execution  
- Cross-step dependencies (Steps 1-3 within same phase)
- Active standards consultation (DSL navigation in progress)
- Multi-part workflow (/create-spec → /create-tasks → /execute-tasks)

## Checkpoint Update Procedure

### Before Each Context Clear Point

1. **Update DEVNET-PROGRESS.md** - Mark completed steps with `[x]`
2. **Update DEVNET-CHECKPOINT.txt** with current state information
3. **Commit checkpoint files** before executing `/clear`

### Enhanced Checkpoint Update Template with Workspace Verification

```bash
# Workspace verification before Phase X → Phase Y transition
echo "=== Phase X → Phase Y Transition: Workspace Verification ==="

# Critical: Verify we're in devnet repository
[[ $(basename $(pwd)) == "devnet" ]] && echo "✅ Correct workspace" || (echo "❌ Wrong directory - must be in ~/Projects/devnet" && exit 1)

# Verify devnet repository structure exists
[[ -d "packages/core" ]] && echo "✅ devnet structure verified" || (echo "❌ devnet packages not found - complete Phase 0 first" && exit 1)

# Verify git context is devnet repository
[[ -d ".git" ]] && echo "✅ Git repository verified" || (echo "❌ Not in a git repository" && exit 1)

# Phase-specific verification (customize per phase)
# Example for domain layer:
# [[ -d "packages/core/src/domain" ]] && echo "✅ Domain layer verified" || echo "⚠️ Domain implementation incomplete"
# 
# Example for use cases layer:
# [[ -d "packages/core/src/use-cases" ]] && echo "✅ Use cases layer verified" || echo "⚠️ Use cases implementation incomplete"

# Update checkpoint files before Phase X → Phase Y transition
echo "Updating checkpoint files before Phase X → Phase Y transition..."

# Update DEVNET-CHECKPOINT.txt with workspace tracking
cat > DEVNET-CHECKPOINT.txt << EOF
LAST_COMPLETED: Phase X, Step Z - [Step Description]
NEXT_ACTION: Start Phase Y, Step 1 - [Next Step Description]
CURRENT_FILE: devnet-plan/phases/phase-Y-[name].md
WORKING_DIRECTORY: ~/Projects/devnet/ (devnet implementation repo)
STANDARDS_DIRECTORY: ~/Projects/devnet.clean_architecture/ (Engineering OS standards)
GIT_TAG: [latest-tag]
COVERAGE: [Layer] X%, Overall Y% ([status description])
NOTE: [Phase X] complete with [compliance status]. Next: [Phase Y description]. MUST remain in devnet repository.
EOF

# Update DEVNET-PROGRESS.md - mark Phase X steps as [x] completed
# (Manual update of checkboxes in visual tracker)

# Commit checkpoint updates
git add DEVNET-PROGRESS.md DEVNET-CHECKPOINT.txt
git commit -m "chore: update checkpoint files - Phase X complete"

# Now execute context clear
/clear
```

## Restart Procedure After Context Clear

When restarting Claude Code after a context clear:

### Quick Restart Commands

**Fastest Restart:**
```
Continue devnet from DEVNET-CHECKPOINT.txt
```

**Context-Aware Restart:**
```
Continue devnet implementation from checkpoint
```

**Phase-Specific Restart:**
```
Work on devnet Phase [X] from checkpoint
```

### Claude's Restart Process

1. **Read DEVNET-CHECKPOINT.txt** for immediate context
2. **Check DEVNET-PROGRESS.md** for detailed progress status
3. **Verify git status** and last tag matches checkpoint
4. **Load appropriate phase file** via DSL routing to devnet-plan/implementation-plan.md
5. **Continue implementation** from next unchecked step in progress tracker

## Recovery Procedures

### If Context Lost Unexpectedly

```bash
# Find last successful phase
git tag --list | grep -E "v[0-9]" | tail -1

# Check current implementation status  
find packages/ -type f -name "*.ts" | head -20
npm run test -- --coverage

# Consult checkpoint files
cat DEVNET-CHECKPOINT.txt
tail -20 DEVNET-PROGRESS.md

# Resume from last known good state
```

### If Checkpoint Files Become Inconsistent

```bash
# Reconcile from git history
git log --oneline | head -10

# Check latest tag
git describe --tags --abbrev=0

# Manually update checkpoint to match reality
# Then continue from verified state
```

## Context Checkpoint Template

Before each clear, document the current state:

```markdown
## Context Checkpoint - Phase [X] Complete
- Last Commit: [hash] - [description]
- Coverage: Domain [X]%, Use Cases [X]%, Infrastructure [X]%
- Verification: [X] embedded tests passed
- Next Phase: [Phase name] - [First step description]
- Key Context: [Critical information for next phase]
```

## Expected Benefits

- **50% reduction** in context window usage per phase
- **30% faster response times** after clearing
- **Improved embedded verification accuracy** with focused context
- **Better standards loading efficiency** via hierarchical DSL
- **Seamless restart capability** with single command
- **Progress visibility** for stakeholders and planning

## Integration with devnet DSL

The checkpoint system is integrated with the devnet DSL dispatcher:

1. **devnet-plan/implementation-plan.md** reads current checkpoint status
2. **Conditional routing** loads appropriate phase file
3. **Context modules** available on demand
4. **Verification framework** tracks compliance per phase
5. **Engineering OS integration** maintains workflow continuity

## File Locations

- **Checkpoint Files**: Project root (`DEVNET-CHECKPOINT.txt`, `DEVNET-PROGRESS.md`)
- **Phase Files**: `devnet-plan/phases/phase-[0-7]-[name].md`
- **Context Modules**: `devnet-plan/context/[module].md`
- **DSL Dispatcher**: `devnet-plan/implementation-plan.md`

# devnet Workspace Setup Guide

## Overview

The devnet implementation requires a **dual repository architecture** to function properly:

1. **devnet Repository** (`~/Projects/devnet/`) - Where implementation happens
2. **Engineering OS Repository** (`~/Projects/devnet.clean_architecture/`) - Where standards live

## Dual Repository Architecture

### Why Two Repositories?

**Engineering OS Repository** (`devnet.clean_architecture`):
- Contains all Engineering OS standards and documentation
- Houses the `/docs/standards/` hierarchy
- Provides DSL dispatchers and agent configurations
- Acts as the "brain" with patterns and best practices
- **Should NOT be modified** during devnet implementation

**devnet Repository** (`devnet`):
- Greenfield codebase implementing the actual devnet system
- Where all `/create-spec`, `/create-tasks`, `/execute-tasks` commands run
- Contains the monorepo structure (`packages/`, `apps/`)
- Where git commits for devnet implementation occur
- **Primary working directory** for development

### Repository Responsibilities

| Function | Engineering OS Repo | devnet Repo |
|----------|-------------------|--------------|
| Standards Lookup | ✅ Primary | ❌ No |
| Code Implementation | ❌ No | ✅ Primary |
| Git Commits | ❌ No | ✅ Primary |
| DSL Standards | ✅ Source | ❌ Consumer |
| Engineering OS Commands | ❌ Reference Only | ✅ Execution |
| Package Development | ❌ No | ✅ Primary |

## Workspace Setup Instructions

### Initial Setup (Phase 0)

**Step 1: Start in Engineering OS Repository**
```bash
# You begin here - reading the implementation plan
cd ~/Projects/devnet.clean_architecture
pwd  # Should show: /Users/bun/Projects/devnet.clean_architecture
```

**Step 2: Phase 0 Creates devnet Repository**
Phase 0, Step 1 creates the new devnet repository at `~/Projects/devnet/`.

**Step 3: CRITICAL Context Switch**
After Phase 0, Step 1, you **MUST** switch to devnet repository:
```bash
cd ~/Projects/devnet
claude-code  # Start new session in devnet repository
```

### Claude Code Workspace Configuration

For optimal experience, configure Claude Code with both repositories:

**Option A: Primary + Additional Workspace**
```bash
# Start Claude Code in devnet repository (primary)
cd ~/Projects/devnet
claude-code

# Add Engineering OS as additional workspace through Claude Code UI
# File -> Add Folder to Workspace -> ~/Projects/devnet.clean_architecture
```

**Option B: Dual Sessions**
```bash
# Terminal 1: devnet implementation
cd ~/Projects/devnet
claude-code

# Terminal 2: Standards reference (read-only)
cd ~/Projects/devnet.clean_architecture
claude-code
```

## Workspace Verification

### Pre-Phase Checklist

Before starting any phase (1-7), verify workspace setup:

```bash
# 1. Confirm you're in devnet repository
pwd  # MUST show: /Users/bun/Projects/devnet

# 2. Verify devnet repository structure
ls -la  # Should show .git directory
ls packages/  # Should show monorepo packages (after Phase 0)

# 3. Verify git context
git status  # Should show devnet repository status
git remote -v  # Should show devnet GitHub remote

# 4. Quick verification script
[[ $(basename $(pwd)) == "devnet" ]] && echo "✅ Correct workspace" || echo "❌ Wrong directory"
```

### Standards Access Verification

Verify you can access Engineering OS standards:

```bash
# From devnet repository, verify standards access
ls ~/Projects/devnet.clean_architecture/docs/standards/
# Should list architecture, development, etc.

# Test conditional standards loading
ls ~/Projects/devnet.clean_architecture/.claude/
# Should show commands and agents directories
```

## Troubleshooting Common Issues

### Issue 1: Commands Fail with "File Not Found"

**Symptoms**:
- `/create-spec` fails to find standards
- `npm run test:domain` fails
- `packages/core` doesn't exist

**Cause**: Still in Engineering OS repository instead of devnet repository

**Solution**:
```bash
# Switch to devnet repository
cd ~/Projects/devnet

# Verify switch
pwd  # Must show devnet path
```

### Issue 2: Standards Not Found

**Symptoms**:
- DSL routing fails
- `@docs/standards/` references fail
- Context-fetcher can't find standards

**Cause**: Engineering OS repository not accessible

**Solution**:
```bash
# Verify Engineering OS repository exists and is accessible
ls ~/Projects/devnet.clean_architecture/docs/standards/
# If this fails, Engineering OS repository is missing or moved

# Ensure Claude Code has access to both repositories
# Add as additional workspace if needed
```

### Issue 3: Git Commits Going to Wrong Repository

**Symptoms**:
- devnet commits appearing in Engineering OS repository
- Can't find devnet git history

**Cause**: Working directory confusion

**Solution**:
```bash
# Check current git context
git status
git remote -v

# If wrong repository, switch to devnet
cd ~/Projects/devnet
git status  # Should show devnet repository
```

### Issue 4: Phase Prerequisites Not Met

**Symptoms**:
- Phase says "devnet repository doesn't exist"
- Package structure not found

**Cause**: Phase 0 not completed or context switch not performed

**Solution**:
```bash
# Check if devnet repository exists
ls ~/Projects/devnet/
# If not found, complete Phase 0 first

# If exists but empty, Phase 0 needs completion
ls ~/Projects/devnet/packages/
# Should list monorepo structure after Phase 0
```

## Directory Structure Reference

### Engineering OS Repository Structure
```
~/Projects/devnet.clean_architecture/
├── docs/
│   └── standards/           # DSL standards hierarchy
├── .claude/
│   ├── commands/           # Engineering OS commands
│   └── agents/            # Specialized agents
├── devnet-plan/          # Implementation plan (this structure)
├── DEVNET-CHECKPOINT.txt # Progress tracking
└── DEVNET-PROGRESS.md    # Visual progress tracker
```

### devnet Repository Structure (After Phase 0)
```
~/Projects/devnet/
├── apps/
│   ├── web/               # Next.js application
│   └── api/               # HonoJS API server
├── packages/
│   ├── core/              # Domain layer
│   ├── infrastructure/    # Infrastructure layer
│   ├── contracts/         # API contracts
│   ├── ui/               # Shared UI components
│   └── auth/             # Authentication
├── docs/                 # devnet-specific docs
├── .git/                 # devnet git repository
└── package.json          # devnet monorepo config
```

## Best Practices

### 1. Always Verify Workspace Before Starting

```bash
# Add this to beginning of each phase work session
echo "Current workspace: $(pwd)"
[[ $(basename $(pwd)) == "devnet" ]] && echo "✅ Ready to proceed" || echo "❌ Wrong workspace - switch to devnet"
```

### 2. Use Absolute Paths for Standards

When referencing standards from devnet repository:
```bash
# Good - absolute path
@docs/standards/architecture/clean-architecture.md

# Bad - relative path (will fail from devnet repo)
../docs/standards/architecture/clean-architecture.md
```

### 3. Checkpoint After Context Switches

Always update checkpoint files after major context switches:
```bash
# Update checkpoint with current workspace
echo "WORKING_DIRECTORY: $(pwd)" >> DEVNET-CHECKPOINT.txt
```

### 4. Keep Engineering OS Repository Clean

- Never commit devnet implementation to Engineering OS repository
- Only update devnet plan and checkpoint files in Engineering OS repository
- All code changes belong in devnet repository

## Integration with devnet Plan Structure

The workspace setup integrates with other devnet plan components:

- **implementation-plan.md**: Root dispatcher includes workspace requirements
- **Phase files**: All phases 1-7 include prerequisites sections
- **Checkpoint system**: Tracks workspace in DEVNET-CHECKPOINT.txt
- **Verification framework**: Includes workspace verification commands

## Quick Reference Commands

```bash
# Switch to devnet workspace
cd ~/Projects/devnet

# Verify correct workspace
pwd && ls packages/

# Access standards (read-only)
ls ~/Projects/devnet.clean_architecture/docs/standards/

# Quick workspace verification
[[ $(basename $(pwd)) == "devnet" ]] && echo "✅ devnet workspace" || echo "❌ Wrong workspace"

# Emergency workspace recovery
cd ~/Projects/devnet && echo "Switched to devnet repository"
```

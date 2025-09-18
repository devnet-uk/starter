# DevNet Implementation — User Execution Guide

> **Transform your AI-agent implementation plan into manual, copy-paste instructions for Claude Code**

## Quick Navigation

| Phase | Focus Area | Time Est. | Status |
|-------|------------|-----------|---------|
| [Phase A](#phase-a-foundation) | Engineering OS Foundation | 2-3 hours | ⏳ |
| [Phase B](#phase-b-architecture) | Architecture Spine | 4-6 hours | ⏸️ |
| [Phase C](#phase-c-domain) | Domain Capability Waves | 8-12 hours | ⏸️ |
| [Phase D](#phase-d-delivery) | API + Frontend Delivery | 6-8 hours | ⏸️ |
| [Phase E](#phase-e-hardening) | Production Readiness | 4-6 hours | ⏸️ |

## Overview

This guide transforms the AI-agent dispatcher system into step-by-step instructions that you, as a technical PM, can copy-paste directly into Claude Code. Each phase builds on the previous one and includes all verification gates to ensure quality.

### What's Different from the Original Plan?
- 🎯 **User-focused**: Designed for manual execution rather than AI agent automation
- 📋 **Copy-paste ready**: Each step includes exact prompts for Claude Code
- ✅ **Verification built-in**: Quality gates and progress tracking preserved
- 🔄 **Recovery procedures**: Rollback steps for when things go wrong
- ⏱️ **Time estimates**: Realistic duration expectations per phase

## Phase Dependencies

```
Phase A (Foundation)
    ↓
Phase B (Architecture Spine)
    ↓
Phase C (Domain Waves)
    ├── Wave C1: Auth & Identity
    ├── Wave C2: Organizations
    ├── Wave C3: Billing & Payments
    └── Wave C4: Platform Services
    ↓
Phase D (Delivery Layers)
    ├── API Delivery
    ├── Frontend Migration
    └── E2E Testing
    ↓
Phase E (Production Hardening)
```

## Before You Start

### Environment Setup
1. **Required Workspaces**:
   - Primary: `~/Projects/devnet/` (will be created)
   - Reference: `~/Projects/devnet.starter/` (current location)

2. **Environment Variables** (add to your shell profile):
   ```bash
   export DEVNET_HOME="$HOME/Projects/devnet"
   export ENGINEERING_OS_HOME="$HOME/Projects/devnet.starter"
   export DEVNET_GIT_REMOTE="git@github.com:your-org/devnet.git"  # Replace with your repo
   ```

3. **Prerequisites Check**:
   ```bash
   # Verify you have the required tools
   node --version    # Should be 22+ (LTS)
   pnpm --version   # Should be 10.14.0+
   git --version    # Any recent version
   ```

### Current State Assessment
Run this to determine where to start:

```bash
cd ~/Projects/devnet.starter
echo "🔍 Current Repository State:"
echo "- Working Directory: $(pwd)"
echo "- Git Status: $(git status --porcelain | wc -l) uncommitted changes"
echo "- Last Commit: $(git log -1 --oneline)"
echo ""
echo "📍 Phase Status Check:"
if [ -d "$DEVNET_HOME" ]; then
  echo "- Phase A workspace: ✅ exists at $DEVNET_HOME"
  if [ -f "$DEVNET_HOME/packages/contracts/package.json" ]; then
    echo "- Phase B contracts: ✅ exists"
  else
    echo "- Phase B contracts: ❌ missing"
  fi
else
  echo "- Phase A workspace: ❌ missing - start with Phase A"
fi
```

---

## Phase A: Foundation

**Goal**: Set up the workspace, tooling, and automation foundations.

**Duration**: 2-3 hours
**Prerequisites**: Clean environment, no existing `~/Projects/devnet/`

### Quick Start
👉 **[Open Phase A Instructions](phases/phase-a-user-instructions.md)** to begin execution.

### What You'll Build
- New git repository at `~/Projects/devnet/`
- Monorepo structure with pnpm workspaces
- TypeScript + Biome + Husky automation
- Coverage thresholds and quality gates

### Success Criteria
- `pnpm verify:local` passes
- Workspace guards validate correctly
- Quality automation (lint, format, commit hooks) working

---

## Phase B: Architecture Spine

**Goal**: Create contracts, core domain abstractions, and infrastructure interfaces.

**Duration**: 4-6 hours
**Prerequisites**: Phase A complete and verified

### Quick Start
👉 **[Open Phase B Instructions](phases/phase-b-user-instructions.md)** after Phase A is complete.

### What You'll Build
- `packages/contracts` with Zod schemas and OpenAPI generation
- `packages/core` with clean architecture primitives
- `packages/infrastructure` interface scaffolding
- Architecture quality gates and dependency enforcement

### Success Criteria
- Contract generation pipeline working
- Clean architecture boundaries enforced
- 100% coverage on core domain modules

---

## Phase C: Domain Capability Waves

**Goal**: Implement the four domain capability waves with full business logic.

**Duration**: 8-12 hours (2-3 hours per wave)
**Prerequisites**: Phase B architecture spine complete

### Quick Start
👉 **[Open Phase C Instructions](phases/phase-c-user-instructions.md)** for wave-by-wave execution.

### Domain Waves
1. **Wave C1: Authentication & Identity** (2-3 hours)
2. **Wave C2: Organizations & RBAC** (2-3 hours)
3. **Wave C3: Billing & Payments** (3-4 hours)
4. **Wave C4: Platform Services** (2-3 hours)

### Execution Options
- **Sequential**: Complete C1 → C2 → C3 → C4
- **Parallel** (after C1): Run C2, C3, C4 simultaneously if you have multiple Claude sessions

### Success Criteria
- All domain use cases implemented with 100% coverage
- Contract synchronization validated
- In-memory adapters ready for API layer

---

## Phase D: Delivery Layers

**Goal**: Build the API delivery layer and migrate frontend to Feature-Sliced Design.

**Duration**: 6-8 hours
**Prerequisites**: Phase C domain capabilities complete

### Quick Start
👉 **[Open Phase D Instructions](phases/phase-d-user-instructions.md)** for API and frontend work.

### Major Milestones
1. **API Delivery**: Hono routes with contract validation
2. **Frontend Migration**: Feature-Sliced Design reorganization
3. **E2E Integration**: Playwright test suites for core journeys

### Success Criteria
- API routes match contracts exactly
- Frontend follows FSD structure
- E2E tests pass for auth, orgs, billing, and platform features

---

## Phase E: Production Hardening

**Goal**: Add observability, security hardening, deployment automation, and documentation.

**Duration**: 4-6 hours
**Prerequisites**: Phase D delivery layers complete

### Quick Start
👉 **[Open Phase E Instructions](phases/phase-e-user-instructions.md)** for production readiness.

### Hardening Areas
1. **Observability**: Logging, metrics, tracing, health checks
2. **Security**: Threat modeling, dependency audits, secrets management
3. **Deployment**: CI/CD pipelines, infrastructure automation
4. **Documentation**: Runbooks, onboarding, handoff materials

### Success Criteria
- Production monitoring ready
- Security review complete
- Deployment automation functional
- Documentation and runbooks finalized

---

## Progress Tracking

### Checkpoint Files
- `DEVNET-CHECKPOINT.txt` - Current status and metrics
- `DEVNET-PROGRESS.md` - Detailed progress log
- Git tags - Version milestones per phase

### Verification Commands
Run these at any point to check system health:

```bash
# Overall system verification
pnpm verify:local

# Phase-specific checks
pnpm --filter @repo/contracts test     # Phase B+
pnpm --filter @repo/core test          # Phase C+
pnpm --filter @repo/api test           # Phase D+
pnpm --filter @repo/web e2e            # Phase D+

# Coverage reports
pnpm test:coverage                     # All packages
```

### Recovery Procedures
If something goes wrong:

1. **Workspace Issues**: Delete `~/Projects/devnet/` and restart current phase
2. **Build Failures**: Check `pnpm install` and `pnpm build` in clean state
3. **Test Failures**: Review error output, fix issues, re-run verification
4. **Git Issues**: Use `git reset --hard` to last known good commit

---

## Getting Help

### Common Issues
- **Workspace conflicts**: Ensure `DEVNET_HOME` is clean before Phase A
- **Dependencies**: Run `pnpm install` in workspace root after each phase
- **TypeScript errors**: Check `tsconfig.base.json` configuration
- **Coverage failures**: Review test files and implementation coverage

### Claude Code Tips
- Use specific, focused prompts from the phase instructions
- Include relevant feature specifications as context
- Run verification commands after each major change
- Commit progress frequently at the specified commit points

### Support
- Review the original plan files in `freshstart/refined-plan/phases/` for technical details
- Check `docs/standards/` for implementation patterns
- Refer to `features/*/specification.md` for domain requirements

---

**Ready to start?** Begin with [Phase A Foundation Instructions](phases/phase-a-user-instructions.md) 🚀
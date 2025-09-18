# DevNet User-Driven Implementation Guide

> **Manual execution guide that leverages the DevNet dispatcher system for intelligent context loading**

## How This System Works

This guide provides **smart prompts** that you copy-paste directly into Claude Code. Each prompt is designed to:

1. **Auto-trigger the dispatcher** - Keywords automatically load relevant phase context
2. **Provide complete instructions** - Everything Claude Code needs to execute tasks
3. **Include project context** - Your specific environment and requirements
4. **Reference exact steps** - Precise locations in the auto-loaded phase files

## Phase Overview

| Phase | Duration | Focus | Status |
|-------|----------|-------|---------|
| **Phase A** | 2-3 hours | Foundation & tooling setup | ⏳ Start here |
| **Phase B** | 4-6 hours | Architecture spine (contracts, core, infrastructure) | ⏸️ |
| **Phase C** | 8-12 hours | Domain capabilities (4 waves: Auth, Orgs, Billing, Platform) | ⏸️ |
| **Phase D** | 6-8 hours | Delivery layers (API + Frontend + E2E) | ⏸️ |
| **Phase E** | 4-6 hours | Production hardening (monitoring, security, deployment) | ⏸️ |

**Total Implementation Time**: 24-35 hours

## Prerequisites

### Environment Setup
```bash
# Required environment variables
export DEVNET_HOME="$HOME/Projects/devnet"
export ENGINEERING_OS_HOME="$HOME/Projects/devnet.starter"
export DEVNET_GIT_REMOTE="git@github.com:YOUR_USERNAME/devnet.git"

# Verify prerequisites
node --version  # Need 22+ LTS
pnpm --version  # Need 10.14.0+
git --version   # Any recent version
```

### Project Context
Before starting, you should know:
- **Your GitHub repository URL** (for DEVNET_GIT_REMOTE)
- **Your development preferences** (IDE, extensions, etc.)
- **Your deployment target** (AWS, Vercel, local, etc.)

## How to Execute Each Phase

### 1. Navigate to Phase Instructions
Each phase has detailed instructions with copy-ready prompts:
- [Phase A: Foundation Setup](phase-a-instructions.md)
- [Phase B: Architecture Spine](phase-b-instructions.md)
- [Phase C: Domain Capabilities](phase-c-instructions.md)
- [Phase D: Delivery Layers](phase-d-instructions.md)
- [Phase E: Production Hardening](phase-e-instructions.md)

### 2. Copy-Paste Smart Prompts
Each step provides a **smart prompt** like this:

```
🔗 COPY THIS TO CLAUDE CODE:

I'm implementing DevNet phase-a foundation workspace setup (Step A1.1).

PROJECT CONTEXT:
- Repository: [YOUR_REPO_URL]
- Target: ~/Projects/devnet/
- Environment: Development setup for SaaS application

TASK: Execute workspace bootstrap following phase-a-foundation.md Step A1.1.

Please run: /create-spec "DevNet workspace bootstrap + preflight — initialize empty repo, set origin remote, verify pnpm/turbo alignment, env scaffolding"

Then: /create-tasks
Then: /execute-tasks
```

### 3. The Magic of Auto-Loading
When Claude Code processes your prompt:
1. **Keywords trigger dispatcher** - "phase-a foundation" automatically loads `phase-a-foundation.md`
2. **Context is available** - Claude Code has the full phase documentation
3. **Smart execution** - Claude Code knows exactly what to do for Step A1.1
4. **Quality gates** - All verification and standards are automatically applied

## Execution Strategy

### Sequential Approach (Recommended)
Execute phases in order: **A → B → C → D → E**

**Why sequential?**
- Each phase builds on the previous
- Easier debugging and verification
- Clear milestone progression
- Dependencies are properly established

### Parallel Approach (Advanced)
For Phase C only: After completing Wave C1 (Authentication), you can run Waves C2, C3, C4 in parallel using multiple Claude Code sessions.

## Progress Tracking

### Checkpoint System
- **DEVNET-CHECKPOINT.txt** - Updated after each major step
- **Git tags** - Created after each phase completion
- **Verification commands** - Run after each step to ensure success

### Status Verification
```bash
# Overall system check
pnpm verify:local

# Phase-specific checks
pnpm --filter @repo/contracts test    # Phase B+
pnpm --filter @repo/core test         # Phase C+
pnpm --filter @repo/api test          # Phase D+
pnpm --filter @repo/web e2e           # Phase D+
```

## Key Features of This System

### 🧠 **Intelligent Context Loading**
- Dispatcher automatically loads relevant documentation
- No need to manually reference multiple files
- Context is always current and complete

### 📋 **Copy-Paste Simplicity**
- Each step has a ready-to-use prompt
- No complex setup or configuration
- Immediate execution capability

### ✅ **Built-in Quality Gates**
- All verification commands included
- Standards compliance automated
- Progress tracking maintained

### 🔄 **Recovery Procedures**
- Clear rollback steps for each phase
- Troubleshooting guides included
- Common issues and solutions documented

## What You'll Build

By the end of all phases, you'll have a **production-ready SaaS application** with:

**🏗️ Technical Excellence:**
- Clean architecture with domain-driven design
- 100% TypeScript with strict configuration
- Comprehensive testing (unit, integration, E2E)
- Modern tooling (pnpm, Turbo, Biome, Husky)

**💼 Business Capabilities:**
- **Authentication**: User registration, MFA, session management
- **Organizations**: Multi-tenant collaboration with RBAC
- **Billing**: Subscription management with multiple payment providers
- **Platform Services**: AI chat, file storage, email, audit logging

**🚀 Production Readiness:**
- **Observability**: Monitoring, logging, metrics, health checks
- **Security**: Threat modeling, security hardening, compliance
- **Deployment**: Automated CI/CD with rollback capabilities
- **Documentation**: Complete runbooks and operational guides

## Getting Started

**👉 Ready to begin?**

1. **Complete environment setup** above
2. **Start with [Phase A Instructions](phase-a-instructions.md)**
3. **Copy the first smart prompt** and paste it into Claude Code
4. **Follow the verification steps** after each execution
5. **Progress through phases sequentially**

## Support & Troubleshooting

- **[Environment Setup Guide](environment-setup.md)** - Detailed prerequisites and configuration
- **[Troubleshooting Guide](troubleshooting.md)** - Common issues and solutions
- **[Recovery Procedures](recovery-procedures.md)** - How to restart or rollback phases

---

**🎯 Your Goal**: Transform weeks of development into a systematic, verified implementation process that leverages AI assistance while maintaining full control and understanding of your system.

**Let's build something amazing!** 🚀
# Phase 6: New System Deployment & Launch

## Prerequisites & Working Directory

⚠️ **Critical: This phase MUST be executed in the devnet repository**

```bash
# Switch to devnet repository
cd ~/Projects/devnet

# Verify correct workspace
pwd  # Should show: ~/Projects/devnet
ls packages/  # Should list: core, infrastructure, contracts, etc.
```

**Required Workspaces**:
<!-- @include-from: docs/EngineeringOS/dsl/includes/common-snippets.md#required-workspaces, hash: 4a5914590c5e5cc7097eeddfa7da51d7d275f34f0d38e78be17a0d77e9f94b00 -->
These repositories should be open in your editor workspace:

- Primary: `~/Projects/devnet/` (implementation & execution)
- Secondary: `~/Projects/devnet.clean_architecture/` (standards reference)
<!-- @end-include -->

**Workspace Verification**:
<!-- @include-from: docs/EngineeringOS/dsl/includes/common-snippets.md#workspace-quick-check, hash: c549c84e03c8d6b6b773e27a8636f8ede1379adcbca9858e32ffc6c27889aed8 -->
Quick single-line check to confirm you are in the expected product repository directory.

```
[[ $(basename $(pwd)) == "devnet" ]] && echo "✅ Correct workspace" || echo "❌ Wrong directory - run: cd ~/Projects/devnet"
```
<!-- @end-include -->

**If devnet repository doesn't exist**: Complete [Phase 0 - Infrastructure Setup](phase-0-infrastructure.md) first.

**Note**: Commands starting with "/" are Claude AI workflows, not shell scripts.

<!-- @include-from: docs/EngineeringOS/dsl/includes/common-snippets.md#workspace-checks, hash: 8cd810c9f2cfa00bdaa2c1eefd57680455604a990bf8eca80aaba27204124793 -->
Confirm you are in the correct repository and workspace.

```
pwd  # should end with your product repository name (for example, devnet)
ls packages/  # should list expected workspace packages (for example, core, infrastructure)
```

If the directory does not match, switch to the product repository before continuing.
<!-- @end-include -->

## Overview

<!-- phase-summary: anchor=overview; keep concise and current -->
**Coverage Target:** Production deployment with comprehensive validation and monitoring  
**Status:** Ready for implementation  
**Duration:** 3 steps focusing on environment setup, deployment validation, and go-live procedures  

This phase deploys the devnet system to production with comprehensive testing, performance validation, and operational readiness.

## Command Notation

Commands in this document use the following notation:
- `claude` code blocks = Commands for Claude Code to execute
- `bash` code blocks = Shell commands to run in terminal  
- "Claude:" prefix = Direct instruction for Claude to execute the following command

## Implementation Steps

### Phase 6 Green (Acceptance)

<!-- @include-from: docs/EngineeringOS/dsl/includes/common-snippets.md#verification-note, hash: 06a507e35e5f387b62627da1e7ca81c98750250cc34d9b736e56238630d35fc0 -->
Verification runs via `/execute-tasks` Step 6 using the verification runner in blocking mode by default.
- All tests marked as blocking must pass before completion.
- Do not run command-line samples for verification; they are illustrative only.
- Review Fix Commands from the report, apply changes, then re-run `/execute-tasks`.
<!-- @end-include -->

  - All BLOCKING deployment tests pass in one session (e.g., production readiness, security validation, CI/CD checks as defined by standards).
  - See this file’s verification gates and deployment/security standards for specifics.

### Step 1: Production Environment Setup

```bash
Claude: /create-spec "Production Environment Setup - Fresh PostgreSQL database provisioning, Vercel deployment configuration, environment setup, and performance infrastructure with verification of production readiness"

# Expected verification output:
# ✅ Fresh PostgreSQL database provisioned with devnet schemas
# ✅ Vercel configuration valid and deployable
# ✅ Environment variables properly configured and accessible
# ✅ CDN and performance infrastructure operational
# ✅ Production database connectivity verified

Claude: /create-tasks
Claude: /execute-tasks
```

**Expected Deliverables:**
- Fresh PostgreSQL database with clean devnet schemas
- Vercel deployment configuration for devnet system (ports 4000/4001)
- Production environment variables and secrets management
- CDN and performance infrastructure setup
- Database initialization and schema validation

<!-- @include-from: docs/EngineeringOS/dsl/includes/common-snippets.md#commit-rules, hash: c04caa4894227bee0454c55860bc68bd15be12d504f0a978a58b37d49dbfbe30 -->
Use clear, conventional messages and push only when verification is green.

Guidelines
- Write a single, focused commit per logical unit of work.
- Use conventional commit prefixes where appropriate (for example, `feat:`, `fix:`, `docs:`).
- Include a short bullet list of notable changes in the body if needed.
<!-- @end-include -->

#### 🔄 Commit Point 17: Production Environment Ready
```bash
git add .
git commit -m "feat(phase-6): setup production environment (step 1)

- Fresh PostgreSQL database provisioned with clean devnet schemas
- Vercel deployment configuration for devnet system
- Production environment variables and secrets management
- CDN and performance infrastructure implementation
- Database connectivity and schema validation complete"

git push
```

### Step 2: Production Deployment & Validation

```bash
Claude: /create-spec "Production Deployment - Deploy devnet system, end-to-end testing, performance validation, and security assessment with verification of production deployment success"

# Expected verification output:
# ✅ devnet system successfully deployed to production
# ✅ End-to-end tests passing in production environment
# ✅ Performance targets met (LCP <2.5s, API <200ms)
# ✅ Security scan shows zero critical vulnerabilities
# ✅ Load testing validates system capacity

Claude: /create-tasks
Claude: /execute-tasks
```

**Expected Deliverables:**
- devnet system deployed to production environment
- Comprehensive end-to-end testing in production
- Performance validation and load testing results
- Security scanning and vulnerability assessment
- Production deployment verification and health checks

#### 🔄 Commit Point 18: Production Deployment Complete
```bash
git add .
git commit -m "feat(phase-6): complete production deployment (step 2)

- devnet system successfully deployed to production environment
- End-to-end testing validated in production context
- Performance targets achieved (LCP <2.5s, API <200ms)
- Security assessment completed with zero critical vulnerabilities
- Load testing confirms system capacity and scalability"

git push
```

### Step 3: Go-Live & Monitoring Setup

```bash
Claude: /create-spec "Go-Live & Monitoring - Launch devnet system, activate monitoring infrastructure, implement alerting, and establish operational procedures"
Claude: /create-tasks
Claude: /execute-tasks
```

**Expected Deliverables:**
- devnet system launched for production use
- Monitoring and alerting infrastructure activated
- Health checks and uptime monitoring operational
- Performance metrics and analytics tracking
- Incident response procedures established

## Phase Completion & Transition

#### 🔄 Commit Point 19: Production Launch Complete
```bash
git add .
git commit -m "feat(phase-6): complete production launch (step 3)

- devnet system launched for production use
- Comprehensive monitoring and alerting infrastructure activated
- Health checks and uptime monitoring operational
- Performance metrics and analytics tracking implemented
- Incident response procedures and operational protocols established"

git push
git tag -a "v1.0.0-beta" -m "Beta release - Production devnet system launched"
git push --tags
```

## Next Phase
Continue to Phase 7: Documentation & Optimization (2 Steps) → `phase-7-documentation.md`

## Success Metrics
- **Production system deployed** with zero-downtime deployment process
- **Performance targets achieved** (LCP <2.5s, API response times <200ms)
- **Security compliance verified** with zero critical vulnerabilities
- **Load testing validated** for expected traffic capacity
- **Monitoring infrastructure operational** with comprehensive alerting
- **Health checks and uptime monitoring** providing 99.9% availability visibility
- **Production database** operational with clean devnet schemas
- **CDN and performance infrastructure** optimized for global deployment

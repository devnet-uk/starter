# Phase 3: Infrastructure Layer

### Phase 3 Green (Acceptance)

<!-- @include-from: docs/EngineeringOS/dsl/includes/common-snippets.md#verification-note, hash: 06a507e35e5f387b62627da1e7ca81c98750250cc34d9b736e56238630d35fc0 -->
Verification runs via `/execute-tasks` Step 6 using the verification runner in blocking mode by default.
- All tests marked as blocking must pass before completion.
- Do not run command-line samples for verification; they are illustrative only.
- Review Fix Commands from the report, apply changes, then re-run `/execute-tasks`.
<!-- @end-include -->

  - All BLOCKING infra tests pass in one session (e.g., DI patterns, repository correctness, migrations validated, coverage targets met).
  - See this file’s verification gates and stack-specific standards for specifics.

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
**Coverage Target:** 95% infrastructure implementation with external service abstraction  
**Status:** Ready for implementation  
**Duration:** 3 steps focusing on database, external services, and authentication infrastructure  

This phase implements the infrastructure layer ensuring proper abstraction of external dependencies and services.

## Command Notation

Commands in this document use the following notation:
- `claude` code blocks = Commands for Claude Code to execute
- `bash` code blocks = Shell commands to run in terminal  
- "Claude:" prefix = Direct instruction for Claude to execute the following command

## Implementation Steps

### Step 1: Database Infrastructure Implementation

```claude
Claude: /create-spec "Database Infrastructure - PostgreSQL setup, Drizzle ORM repositories, migrations, connection management, and query optimization with verification of database connectivity and schema integrity"

# Expected verification output:
# ✅ Database connection established and validated
# ✅ Drizzle ORM configuration functional
# ✅ Migration system operational (up/down migrations work)
# ✅ Repository pattern correctly implemented
# ✅ Query optimization and indexing configured

Claude: /create-tasks
Claude: /execute-tasks
```

**Expected Deliverables:**
- PostgreSQL connection management with pooling
- Drizzle ORM configuration and schemas (following @docs/standards/stack-specific/drizzle-patterns.md)
- Repository implementations following Clean Architecture (implementing @docs/standards/architecture/infrastructure-patterns.md)
- Migration system with rollback capabilities (following @docs/standards/development/database-migrations.md patterns)
- Database performance optimization
- **95% test coverage for infrastructure layer (devnet requirement)**

<!-- @include-from: docs/EngineeringOS/dsl/includes/common-snippets.md#commit-rules, hash: c04caa4894227bee0454c55860bc68bd15be12d504f0a978a58b37d49dbfbe30 -->
Use clear, conventional messages and push only when verification is green.

Guidelines
- Write a single, focused commit per logical unit of work.
- Use conventional commit prefixes where appropriate (for example, `feat:`, `fix:`, `docs:`).
- Include a short bullet list of notable changes in the body if needed.
<!-- @end-include -->

#### 🔄 Commit Point 8: Database Layer Complete
```bash
git add .
git commit -m "feat(phase-3): implement database infrastructure (step 1)

- PostgreSQL connection management with pooling
- Drizzle ORM configuration and type-safe schemas
- Repository implementations following Clean Architecture
- Migration system with rollback capabilities
- Database query optimization and indexing"

git push
```

### Step 2: External Services Implementation

```claude
Claude: /create-spec "External Services - OpenAI/Anthropic integration, Stripe payments, Email service, Analytics, and monitoring integrations"
Claude: /create-tasks
Claude: /execute-tasks
```

**Expected Deliverables:**
- OpenAI/Anthropic AI provider integrations
- Stripe payment processing with webhooks (following @docs/standards/architecture/billing-patterns.md)
- Email service integration (Resend/SendGrid)
- Analytics and monitoring setup
- External service error handling and retries (implementing @docs/standards/architecture/resilience-patterns.md)
- **95% test coverage for external service integrations (devnet requirement)**

<!-- @include-from: docs/EngineeringOS/dsl/includes/common-snippets.md#commit-rules, hash: c04caa4894227bee0454c55860bc68bd15be12d504f0a978a58b37d49dbfbe30 -->
Use clear, conventional messages and push only when verification is green.

Guidelines
- Write a single, focused commit per logical unit of work.
- Use conventional commit prefixes where appropriate (for example, `feat:`, `fix:`, `docs:`).
- Include a short bullet list of notable changes in the body if needed.
<!-- @end-include -->

#### 🔄 Commit Point 9: External Services Complete
```bash
git add .
git commit -m "feat(phase-3): implement external services (step 2)

- OpenAI/Anthropic AI providers with fallback
- Stripe payment processing with webhook handling
- Email service integration with template management
- Analytics and monitoring with error tracking
- Resilient external service communication"

git push
```

### Step 3: Authentication Infrastructure Implementation

```claude
Claude: /create-spec "Auth Infrastructure - Better-Auth setup, session management, OAuth providers, security middleware, and token management"
Claude: /create-tasks
Claude: /execute-tasks
```

**Expected Deliverables:**
- Better-Auth integration and configuration (following @docs/standards/security/authentication-patterns.md)
- Session persistence and security
- OAuth provider setup (Google, GitHub)
- Security middleware and CSRF protection
- Token management and refresh mechanisms

## Phase Completion & Transition

<!-- @include-from: docs/EngineeringOS/dsl/includes/common-snippets.md#commit-rules, hash: c04caa4894227bee0454c55860bc68bd15be12d504f0a978a58b37d49dbfbe30 -->
Use clear, conventional messages and push only when verification is green.

Guidelines
- Write a single, focused commit per logical unit of work.
- Use conventional commit prefixes where appropriate (for example, `feat:`, `fix:`, `docs:`).
- Include a short bullet list of notable changes in the body if needed.
<!-- @end-include -->

#### 🔄 Commit Point 10: Infrastructure Complete
```bash
git add .
git commit -m "feat(phase-3): complete infrastructure layer (step 3)

- Better-Auth integration with OAuth providers
- Secure session persistence and management
- OAuth provider setup (Google, GitHub, etc.)
- Security middleware with CSRF protection
- Token management and automatic refresh"

git push
git tag -a "v0.3.0-infrastructure" -m "Infrastructure layer complete - External dependencies properly abstracted"
git push --tags

# 🔄 CONTEXT CLEAR POINT: Infrastructure Layer Complete
# Rationale: External services complete, moving to API translation layer

# Update checkpoint files before context clear
echo "Updating checkpoint files before Phase 3 → Phase 4 transition..."

# Update DEVNET-CHECKPOINT.txt
cat > DEVNET-CHECKPOINT.txt << EOF
LAST_COMPLETED: Phase 3, Step 3 - Authentication Infrastructure Implementation
NEXT_ACTION: Start Phase 4, Step 1 - API Controllers Implementation
GIT_TAG: v0.3.0-infrastructure
COVERAGE: Domain 100%, Use Cases 100%, Infrastructure 95%, Overall 65%
NOTE: Infrastructure complete with external services abstracted. Next: Interface adapters layer
EOF

# Update DEVNET-PROGRESS.md - mark Phase 3 steps 1-3 as [x] completed
# (Manual update of checkboxes in visual tracker)

# Commit checkpoint updates
git add DEVNET-PROGRESS.md DEVNET-CHECKPOINT.txt
git commit -m "chore: update checkpoint files - Phase 3 complete"
```

```claude
# Reminder: clear context (do not execute)
Claude: Reminder — please clear your context by typing `/clear` when ready. Do not execute automatically.
```

## Next Phase
Continue to Phase 4: Interface Adapters (3 Steps) → `phase-4-interface-adapters.md`

## Success Metrics
- **95% infrastructure test coverage** (devnet requirement)
- **External service abstraction** properly implemented
- **Database connectivity** and schema integrity verified
- **Authentication infrastructure** operational with OAuth support
- **Performance optimization** with connection pooling and caching
- **Resilient service communication** with error handling and retries

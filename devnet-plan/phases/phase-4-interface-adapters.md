# Phase 4: Interface Adapters

### Phase 4 Green (Acceptance)

<!-- @include-from: docs/EngineeringOS/dsl/includes/common-snippets.md#verification-note, hash: 06a507e35e5f387b62627da1e7ca81c98750250cc34d9b736e56238630d35fc0 -->
Verification runs via `/execute-tasks` Step 6 using the verification runner in blocking mode by default.
- All tests marked as blocking must pass before completion.
- Do not run command-line samples for verification; they are illustrative only.
- Review Fix Commands from the report, apply changes, then re-run `/execute-tasks`.
<!-- @end-include -->

  - All BLOCKING adapter tests pass in one session (e.g., API contracts validated, controller patterns correct, security middleware enforced).
  - See this file’s verification gates and security/API standards for specifics.

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
**Coverage Target:** 95% API controller and contract implementation with multi-tenant architecture  
**Status:** Ready for implementation  
**Duration:** 3 steps focusing on API controllers, contract-driven bridge, and WebSocket/streaming implementation  

This phase implements the interface adapters layer providing clean API abstraction and real-time communication.

## Command Notation

Commands in this document use the following notation:
- `claude` code blocks = Commands for Claude Code to execute
- `bash` code blocks = Shell commands to run in terminal  
- "Claude:" prefix = Direct instruction for Claude to execute the following command

## Implementation Steps

### Step 1: API Controllers Implementation

```claude
Claude: /create-spec "API Controllers - Multi-tenant HonoJS REST endpoints with JWT authentication, RBAC authorization, security middleware, performance optimization, and comprehensive testing"
Claude: /create-tasks
Claude: /execute-tasks
```

**Expected Deliverables:**
- **Multi-tenant API architecture** with tenant isolation and context propagation
- **JWT authentication middleware** with refresh token rotation and secure storage
- **Role-based authorization (RBAC)** with fine-grained permission matrices
- **Security middleware stack** including rate limiting, CORS, CSP headers, and request sanitization
- **Performance optimization** achieving <200ms p95 API response times
- **HonoJS route handlers** following contract-first development patterns from [`docs/standards/stack-specific/hono-api.md`](docs/standards/stack-specific/hono-api.md#contract-first-api-development)
- **Request validation** using Zod schemas with tenant-specific validation rules
- **Standardized response formatting** with consistent error codes and structured logging
- **Error handling middleware** with proper HTTP status codes and security-aware error responses
- **API documentation generation** with OpenAPI 3.1 and tenant-specific examples
- **95% test coverage** for all controller implementations (devnet requirement)

<!-- @include-from: docs/EngineeringOS/dsl/includes/common-snippets.md#commit-rules, hash: c04caa4894227bee0454c55860bc68bd15be12d504f0a978a58b37d49dbfbe30 -->
Use clear, conventional messages and push only when verification is green.

Guidelines
- Write a single, focused commit per logical unit of work.
- Use conventional commit prefixes where appropriate (for example, `feat:`, `fix:`, `docs:`).
- Include a short bullet list of notable changes in the body if needed.
<!-- @end-include -->

#### 🔄 Commit Point 11: API Controllers Complete
```bash
git add .
git commit -m "feat(phase-4): implement API controllers (step 1)

- HonoJS route handlers with clean structure
- Request validation with Zod schemas
- Standardized response formatting and errors
- Comprehensive error handling middleware
- API documentation with OpenAPI generation"

git push
```

### Step 2: Contract-Driven Bridge Implementation

```claude
Claude: /create-spec "Contract-First API Bridge - Multi-tenant Zod contracts with versioning, performance SLAs, comprehensive testing, and end-to-end type safety using zod-endpoints pattern"
Claude: /create-tasks
Claude: /execute-tasks
```

**Expected Deliverables:**
- **Contract-first development** using `zod-endpoints` pattern from [`docs/standards/stack-specific/hono-api.md`](docs/standards/stack-specific/hono-api.md#contract-first-api-development)
- **Multi-tenant contract validation** with tenant context propagation and isolation rules
- **Versioned API contracts** with backward compatibility and migration support
- **Performance validation contracts** with response time SLAs (<200ms) and load testing schemas
- **Type-safe API contracts** using Zod with enhanced validation hooks and custom error messages
- **Shared schema definitions** across frontend/backend with zero-duplication architecture
- **OpenAPI 3.1 documentation** generation with tenant-specific examples and authentication flows
- **End-to-end type safety** validation from database entities to UI components
- **Comprehensive contract testing** with boundary value analysis and edge case coverage
- **Security contract validation** with input sanitization and output encoding rules
- **100% test coverage for API contracts** (devnet requirement) including integration and performance tests

<!-- @include-from: docs/EngineeringOS/dsl/includes/common-snippets.md#commit-rules, hash: c04caa4894227bee0454c55860bc68bd15be12d504f0a978a58b37d49dbfbe30 -->
Use clear, conventional messages and push only when verification is green.

Guidelines
- Write a single, focused commit per logical unit of work.
- Use conventional commit prefixes where appropriate (for example, `feat:`, `fix:`, `docs:`).
- Include a short bullet list of notable changes in the body if needed.
<!-- @end-include -->

#### 🔄 Commit Point 12: Contracts Complete
```bash
git add .
git commit -m "feat(phase-4): implement contract-driven bridge (step 2)

- Type-safe API contracts with Zod validation
- Shared schemas ensuring frontend/backend consistency
- OpenAPI documentation with automatic generation
- End-to-end type safety from DB to UI
- 100% test coverage for API contracts (devnet requirement verified)"

git push
```

### Step 3: WebSocket & Streaming Implementation

```claude
Claude: /create-spec "Multi-tenant Real-time Features - WebSocket isolation, AI streaming with usage tracking, live updates with tenant boundaries, performance optimization, and comprehensive testing"
Claude: /create-tasks
Claude: /execute-tasks
```

**Expected Deliverables:**
- **Multi-tenant WebSocket isolation** with tenant-specific rooms and connection management
- **Tenant-aware rate limiting** for real-time events and connection throttling per tenant
- **Performance optimization** achieving <100ms real-time event delivery target
- **AI streaming with token usage tracking** per tenant for billing and quota management
- **WebSocket connection management** with automatic reconnection and circuit breaker patterns from [`docs/standards/architecture/streaming-patterns.md`](docs/standards/architecture/streaming-patterns.md#connection-management)
- **Server-sent events** for real-time updates with tenant context propagation
- **Real-time subscriptions** and notifications with fine-grained permission controls
- **Connection resilience patterns** with exponential backoff and graceful degradation
- **Comprehensive error handling** with connection state recovery and user-friendly error messages
- **Security middleware** for WebSocket connections including authentication validation and CORS policies
- **90% integration test coverage** for all real-time features (devnet requirement)

## Phase Completion & Transition

<!-- @include-from: docs/EngineeringOS/dsl/includes/common-snippets.md#commit-rules, hash: c04caa4894227bee0454c55860bc68bd15be12d504f0a978a58b37d49dbfbe30 -->
Use clear, conventional messages and push only when verification is green.

Guidelines
- Write a single, focused commit per logical unit of work.
- Use conventional commit prefixes where appropriate (for example, `feat:`, `fix:`, `docs:`).
- Include a short bullet list of notable changes in the body if needed.
<!-- @end-include -->

#### 🔄 Commit Point 13: Interface Adapters Complete
```bash
git add .
git commit -m "feat(phase-4): complete interface adapters (step 3)

- WebSocket connections with proper management
- Server-sent events for real-time updates
- AI streaming handlers with error recovery
- Real-time subscriptions and notifications
- Resilient connection management"

git push
git tag -a "v0.4.0-adapters" -m "Interface adapters complete - Clean API layer established"
git push --tags

# 🔄 CONTEXT CLEAR POINT: Interface Adapters Complete
# Rationale: API layer complete, moving to frontend concerns

# Update checkpoint files before context clear
echo "Updating checkpoint files before Phase 4 → Phase 5 transition..."

# Update DEVNET-CHECKPOINT.txt
cat > DEVNET-CHECKPOINT.txt << EOF
LAST_COMPLETED: Phase 4, Step 3 - WebSocket & Streaming Implementation
NEXT_ACTION: Start Phase 5, Step 1 - Enhanced Next.js Foundation with Engineering OS Integration
GIT_TAG: v0.4.0-adapters
COVERAGE: Domain 100%, Use Cases 100%, Infrastructure 95%, API Contracts 100%, Overall 75%
NOTE: Interface adapters complete with clean API layer. Next: Presentation layer (95% UI coverage target)
EOF

# Update DEVNET-PROGRESS.md - mark Phase 4 steps 1-3 as [x] completed
# (Manual update of checkboxes in visual tracker)

# Commit checkpoint updates
git add DEVNET-PROGRESS.md DEVNET-CHECKPOINT.txt
git commit -m "chore: update checkpoint files - Phase 4 complete"
```

```claude
# Reminder: clear context (do not execute)
Claude: Reminder — please clear your context by typing `/clear` when ready. Do not execute automatically.
```

## Next Phase
Continue to Phase 5: Presentation Layer (3 Steps) → `phase-5-presentation.md`

## Success Metrics

**Feature Implementation Requirements:**
- ✅ All 436 features implemented with functional API endpoints
- ✅ Multi-tenant architecture implemented with complete tenant isolation
- ✅ JWT authentication and RBAC authorization fully operational

**Performance Targets:**
- ✅ <200ms p95 API response time achieved across all endpoints
- ✅ <100ms real-time event delivery for WebSocket and SSE
- ✅ API rate limiting properly configured per tenant tier

**Quality Assurance:**
- ✅ 95% test coverage for all API controllers (verified via coverage reports)
- ✅ 100% test coverage for all API contracts (comprehensive validation testing)
- ✅ 90% integration test coverage for real-time features
- ✅ Zero critical security vulnerabilities (verified via security scan)

**Architecture Compliance:**
- ✅ 10/10 Clean Architecture compliance score (Interface Adapters layer complete)
- ✅ Contract-first development patterns implemented using [`docs/standards/stack-specific/hono-api.md`](docs/standards/stack-specific/hono-api.md#contract-first-api-development)
- ✅ Security patterns aligned with [`docs/standards/security/api-security.md`](docs/standards/security/api-security.md)
- ✅ Streaming patterns following [`docs/standards/architecture/streaming-patterns.md`](docs/standards/architecture/streaming-patterns.md#connection-management)

**Documentation & Standards:**
- ✅ OpenAPI 3.1 documentation generated with tenant-specific examples
- ✅ API contracts versioned with backward compatibility support
- ✅ Real-time API documentation including connection management patterns

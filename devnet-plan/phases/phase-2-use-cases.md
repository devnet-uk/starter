# Phase 2: Use Cases & Business Logic

### Phase 2 Green (Acceptance)

<!-- @include-from: docs/EngineeringOS/dsl/includes/common-snippets.md#verification-note, hash: 06a507e35e5f387b62627da1e7ca81c98750250cc34d9b736e56238630d35fc0 -->
Verification runs via `/execute-tasks` Step 6 using the verification runner in blocking mode by default.
- All tests marked as blocking must pass before completion.
- Do not run command-line samples for verification; they are illustrative only.
- Review Fix Commands from the report, apply changes, then re-run `/execute-tasks`.
<!-- @end-include -->

  - All BLOCKING use-case orchestration tests pass in one session (e.g., interfaces respected, business rules verified, coverage targets met).
  - See this file’s verification gates and the Use Case patterns standard for specifics.

## Prerequisites & Working Directory

⚠️ **Critical: This phase MUST be executed in the devnet repository**

```claude
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
**Coverage Target:** 100% use case implementation with comprehensive integration  
**Status:** Ready for implementation  
**Duration:** 3 steps focusing on authentication, organization management, and AI chat features  

This phase implements the business logic layer with enhanced integration across audit logging, notifications, background processing, and multi-channel communication systems.

## Command Notation

Commands in this document use the following notation:
- `claude` code blocks = Commands for Claude Code to execute
- `bash` code blocks = Shell commands to run in terminal  
- "Claude:" prefix = Direct instruction for Claude to execute the following command

## Implementation Steps

### Step 1: Authentication & Core Use Cases Implementation

```claude
Claude: /create-spec "Authentication Use Cases with Enhanced Integration - Sign up, sign in, password reset, MFA, session management with proper error handling, security, audit logging, and notification systems following comprehensive standards:

ENHANCED STANDARDS CONSULTATION:
- authentication-patterns.md: Core auth flows and security patterns
- use-case-patterns.md: Clean Architecture use case implementation
- audit-logging-patterns.md: Event sourcing for auth events and compliance
- notification-patterns.md: Multi-channel auth notifications (email, SMS)
- caching-patterns.md: Session and rate limiting cache strategies

COMPREHENSIVE FEATURE SET:
Authentication Core:
- User registration with email/phone verification using notification patterns
- Multi-factor authentication with time-based tokens
- Secure password reset with audit trail logging
- Session management with Redis caching and security policies
- Social OAuth integration (Google, GitHub) with audit events

Enhanced Security & Compliance:
- Audit logging for all authentication events (login attempts, password changes, MFA setup)
- Rate limiting with Redis-based caching strategies
- Notification workflows for security events (login alerts, password changes)
- Compliance tracking (GDPR consent, data retention) with event sourcing
- Fraud detection patterns with background job processing

Background Processing Integration:
- Email verification via background job queue
- Failed login attempt monitoring and alerting
- Password breach monitoring with scheduled checks
- Account cleanup and maintenance jobs
- Security report generation with async processing

EXPECTED DELIVERABLES:
- Authentication use cases with comprehensive validation and Result<T> patterns
- Event sourcing implementation for all auth events (UserRegisteredEvent, LoginAttemptedEvent, etc.)
- Multi-channel notification system for auth flows (welcome emails, security alerts)
- Redis-based session management and rate limiting
- Background job integration for async auth processing
- 100% test coverage with comprehensive security testing scenarios"

Claude: /create-tasks
Claude: /execute-tasks
```

**Expected Deliverables:**
- User registration with email/phone verification and audit trail
- Multi-factor authentication with comprehensive security measures
- Password reset with event sourcing and notification workflows
- Session management with Redis caching and security policies
- OAuth integration with full audit logging
- Rate limiting and fraud detection with background processing
- **100% test coverage for all authentication use cases (devnet requirement)**

### Step 2: Organization Management & Billing Use Cases Implementation

```claude
Claude: /create-spec "Organization Management Use Cases with Billing Integration - Create organizations, invite members, manage roles, comprehensive billing, subscription management, and audit compliance following enhanced standards:

ENHANCED STANDARDS CONSULTATION:
- multi-tenancy-patterns.md: Organization and role management patterns
- billing-patterns.md: Stripe integration and subscription management
- use-case-patterns.md: Clean Architecture use case implementation
- audit-logging-patterns.md: Organization and billing event tracking
- notification-patterns.md: Organization and billing notifications
- background-job-patterns.md: Async billing and invitation processing
- search-patterns.md: Organization member and billing history search

COMPREHENSIVE FEATURE SET:
Organization Management:
- Organization creation with billing setup and audit logging
- Member invitation system with email workflows and background processing
- Role-based access control with granular permissions and audit trails
- Team management with hierarchical roles and compliance tracking
- Organization settings with event sourcing for all changes

Billing & Subscription Integration:
- Stripe subscription management with webhook processing
- Plan upgrades/downgrades with proration and audit logging
- Invoice generation and payment processing with comprehensive tracking
- Usage-based billing for AI credits with real-time monitoring
- Billing history and analytics with search functionality
- Payment method management with secure storage and notifications

Enhanced Compliance & Processing:
- Audit logging for all organization and billing events
- Background processing for subscription renewals and notifications
- Search functionality for member management and billing history
- Notification workflows for billing events (payment success, failures, renewals)
- Compliance tracking for financial regulations and data protection
- Multi-level caching for organization data and billing information

EXPECTED DELIVERABLES:
- Organization CRUD operations with comprehensive validation and event sourcing
- Stripe billing integration with webhook handling and retry mechanisms
- Role-based permission system with audit trails and compliance features
- Member invitation workflows with email notifications and background processing
- Billing analytics and search functionality with performance optimization
- 100% test coverage including billing edge cases and webhook scenarios"

Claude: /create-tasks
Claude: /execute-tasks
```

**Expected Deliverables:**
- Organization creation and configuration with billing integration
- Member invitation system with comprehensive email workflows
- Role-based access control with granular permissions and audit trails
- Stripe subscription management with webhook processing
- Billing history and analytics with search functionality
- Multi-channel notifications for org and billing events
- **100% test coverage for organization and billing use cases (devnet requirement)**

### Step 3: AI Chat & Analytics Use Cases Implementation

```claude
Claude: /create-spec "AI Chat Use Cases with Analytics & Performance - Create conversations, streaming responses, history management, token tracking, search functionality, and comprehensive analytics following enhanced standards:

ENHANCED STANDARDS CONSULTATION:
- streaming-patterns.md: Real-time chat and response streaming patterns
- use-case-patterns.md: Clean Architecture use case implementation
- search-patterns.md: Conversation search and indexing with Elasticsearch
- caching-patterns.md: Chat history and response caching strategies
- audit-logging-patterns.md: Chat analytics and usage tracking
- background-job-patterns.md: Async chat processing and analytics generation
- notification-patterns.md: Chat notifications and alerts

COMPREHENSIVE FEATURE SET:
AI Chat Core:
- Conversation creation and management with comprehensive state handling
- Streaming response handling with WebSocket connections and error recovery
- Message validation and content filtering with security measures
- Token usage tracking with billing integration and real-time monitoring
- Conversation persistence with optimized storage and retrieval patterns

Advanced Search & Analytics:
- Elasticsearch integration for full-text conversation search
- Faceted search with filters (date, participants, topics, message types)
- Chat analytics dashboard with usage patterns and performance metrics
- Conversation export functionality with multiple format support
- AI usage analytics with billing insights and optimization recommendations

Performance & Caching:
- Multi-level caching for chat history and frequent queries
- Redis-based real-time message caching with TTL optimization
- Conversation indexing with background job processing
- Performance monitoring for response times and system health
- Intelligent pre-loading of conversation context and history

Background Processing & Notifications:
- Async conversation indexing and search optimization
- Chat analytics generation with scheduled background jobs
- Notification workflows for chat events (mentions, direct messages)
- Conversation summarization with AI processing queues
- Usage report generation and delivery with email notifications

EXPECTED DELIVERABLES:
- AI chat conversation management with comprehensive state handling
- WebSocket streaming with error recovery and performance optimization
- Elasticsearch integration for powerful conversation search capabilities
- Multi-level caching strategies for optimal chat performance
- Background processing for analytics and search indexing
- Token tracking with real-time billing integration and usage analytics
- 100% test coverage including streaming edge cases and search functionality"

Claude: /create-tasks
Claude: /execute-tasks
```

**Expected Deliverables:**
- AI chat conversation management with streaming and state handling
- Elasticsearch-powered conversation search with faceted filtering
- Multi-level caching for optimal chat performance and user experience
- Token usage tracking with real-time billing integration
- Background processing for chat analytics and search indexing
- Multi-channel notifications for chat events and system alerts
- **100% test coverage for AI chat and analytics use cases (devnet requirement)**

## Phase Completion & Transition

<!-- @include-from: docs/EngineeringOS/dsl/includes/common-snippets.md#commit-rules, hash: c04caa4894227bee0454c55860bc68bd15be12d504f0a978a58b37d49dbfbe30 -->
Use clear, conventional messages and push only when verification is green.

Guidelines
- Write a single, focused commit per logical unit of work.
- Use conventional commit prefixes where appropriate (for example, `feat:`, `fix:`, `docs:`).
- Include a short bullet list of notable changes in the body if needed.
<!-- @end-include -->

#### 🔄 Commit Point 7: Enhanced Use Cases Layer Complete
```bash
git add .
git commit -m "feat(phase-2): complete enhanced use cases layer with comprehensive integration (step 3)

- AI chat conversation management with streaming response handling and state management
- Elasticsearch integration for powerful full-text conversation search with faceted filtering
- Multi-level caching strategies (Redis + in-memory) for optimal chat performance
- Token usage tracking with real-time billing integration and comprehensive usage analytics
- Background processing for conversation indexing, analytics generation, and search optimization
- Multi-channel notification workflows for chat events, mentions, and system alerts
- Event sourcing for all chat interactions ensuring complete audit trail and analytics capability
- WebSocket streaming with comprehensive error recovery and performance monitoring
- AI provider abstraction supporting multiple services with fallback mechanisms
- 100% test coverage including complex streaming edge cases and search functionality (devnet requirement verified)"

git push
git tag -a "v0.2.0-enhanced-use-cases" -m "Enhanced use cases layer complete - Business logic with comprehensive integration (billing, search, caching, notifications, audit)"
git push --tags

# 🔄 CONTEXT CLEAR POINT: Use Cases Layer Complete
# Rationale: Business logic complete, moving to external integrations

# Update checkpoint files before context clear
echo "Updating checkpoint files before Phase 2 → Phase 3 transition..."

# Update DEVNET-CHECKPOINT.txt
cat > DEVNET-CHECKPOINT.txt << EOF
LAST_COMPLETED: Phase 2, Step 3 - AI Chat & Analytics Use Cases Implementation
NEXT_ACTION: Start Phase 3, Step 1 - Database Infrastructure Implementation
GIT_TAG: v0.2.0-enhanced-use-cases
COVERAGE: Domain 100%, Use Cases 100%, Overall 50% (business logic complete)
NOTE: Use cases complete with comprehensive integration. Next: Infrastructure layer (95% coverage target)
EOF

# Update DEVNET-PROGRESS.md - mark Phase 2 steps 1-3 as [x] completed
# (Manual update of checkboxes in visual tracker)

# Commit checkpoint updates
git add DEVNET-PROGRESS.md DEVNET-CHECKPOINT.txt
git commit -m "chore: update checkpoint files - Phase 2 complete"
```

```claude
# Reminder: clear context (do not execute)
Claude: Reminder — please clear your context by typing `/clear` when ready. Do not execute automatically.
```

## Next Phase
Continue to Phase 3: Infrastructure Layer (3 Steps) → `phase-3-infrastructure.md`

## Success Metrics
- **100% use case test coverage** (devnet requirement)
- **Comprehensive integration** across audit, notifications, background processing
- **Event sourcing implementation** for all business events
- **Multi-channel communication** systems operational
- **Performance optimization** with caching and search capabilities
- **Security compliance** with comprehensive audit trails

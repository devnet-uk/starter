# Phase C: Domain Capability Waves — User Instructions

> **Duration**: 8-12 hours (2-3 hours per wave) | **Goal**: Implement business logic across 4 domain areas

## Overview

Phase C implements the actual business logic of your application across four domain capability waves. Each wave builds specific domain capabilities using the architecture spine from Phase B. All waves must achieve 100% coverage on domain/use-case modules.

**What you'll build:**
- **Wave C1**: Authentication & Identity (2-3 hours)
- **Wave C2**: Organizations & RBAC (2-3 hours)
- **Wave C3**: Billing & Payments (3-4 hours)
- **Wave C4**: Platform Services (2-3 hours)

## Prerequisites Check

Before starting, verify Phase B is complete:

```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

echo "🔍 Phase B Prerequisites:"
echo "- Contracts package: $([ -f packages/contracts/package.json ] && echo '✅' || echo '❌')"
echo "- Core package: $([ -f packages/core/package.json ] && echo '✅' || echo '❌')"
echo "- Infrastructure package: $([ -f packages/infrastructure/package.json ] && echo '✅' || echo '❌')"
echo "- Full build: $(pnpm build >/dev/null 2>&1 && echo '✅' || echo '❌')"
echo "- Verification: $(pnpm verify:local >/dev/null 2>&1 && echo '✅' || echo '❌')"

# Check checkpoint
grep -A2 -B2 "Phase B" DEVNET-CHECKPOINT.txt 2>/dev/null || echo "❌ Missing Phase B checkpoint"
```

**Expected**: All items should show ✅

## Wave Execution Strategy

### Sequential Approach (Recommended)
Execute waves in order: **C1 → C2 → C3 → C4**
- Authentication (C1) is foundational for all others
- Easier debugging and verification
- Clear dependency progression

### Parallel Approach (Advanced)
After completing C1, run C2, C3, C4 simultaneously:
- Complete Wave C1 first (required dependency)
- Use separate Claude Code sessions for C2, C3, C4
- Merge and integrate after all waves complete

---

## Wave C1: Authentication & Identity

### Wave C1.1: Implement Authentication Domain

**🔗 COPY THIS TO CLAUDE CODE:**

```
I'm implementing DevNet phase-c domain authentication wave (Wave C1).

PROJECT CONTEXT:
- Working directory: ${DEVNET_HOME:-~/Projects/devnet/}
- Goal: Complete user authentication and identity management
- Foundation: This is the foundational domain - all other domains depend on authentication
- Architecture: Building on contracts and core from Phase B

CURRENT STATUS: Phase B architecture spine complete, starting Phase C domain capabilities
SPECIFIC TASK: Execute Wave C1 from phase-c-domain.md

DOMAIN SCOPE - Authentication & Identity:
**Entities to Implement:**
- User - Core user entity with identity, profile, security attributes
- Session - User session management with expiration and security tracking
- Credential - Authentication credentials (password, passkeys, OAuth tokens)
- MfaDevice - Multi-factor authentication device management

**Use Cases to Implement:**
- User registration and email verification
- Sign-in with password and passkey support
- Multi-factor authentication enrollment and challenges
- Password reset and recovery flows
- Session rotation and security management

**Domain Events:**
- UserRegistered - New user account created
- UserAuthenticated - Successful authentication event
- MfaChallengeRequested - MFA challenge initiated

**Feature Specifications:**
Primary: features/auth/specification.md
Secondary: features/users/specification.md

ARCHITECTURE REQUIREMENTS:
- Use clean architecture patterns from packages/core
- 100% test coverage on all business logic
- Domain services for password hashing, MFA policies (interface-based)
- Contract-aligned DTO mappers (core ↔ contracts)
- Repository interfaces with in-memory implementations for testing

INSTRUCTIONS:
Please execute the authentication domain wave following the DevNet phase-c domain plan.

Run these commands in sequence:
1. /create-spec "Authentication domain wave — implement entities, MFA policies, and contract mappers. Load requirements from features/auth/specification.md and features/users/specification.md."
2. /create-tasks
3. /execute-tasks

Ensure all deliverables are completed with enterprise-grade security patterns and 100% test coverage.
```

### Verification After C1

Run this to verify Wave C1 completed successfully:

```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

echo "🔍 Wave C1 Verification:"
echo "- Auth entities: $(find packages/core -name '*User*.ts' -o -name '*Session*.ts' -o -name '*Credential*.ts' | wc -l | tr -d ' ') files"
echo "- Use case services: $(find packages/core -name '*UseCase*.ts' -o -name '*Service*.ts' | grep -i auth | wc -l | tr -d ' ') services"
echo "- Domain events: $(find packages/core -name '*Event*.ts' | wc -l | tr -d ' ') event types"
echo "- Test coverage: $(find packages/core -name '*test*.ts' -o -name '*spec*.ts' | wc -l | tr -d ' ') test files"

echo ""
echo "🧪 Wave C1 Testing:"
pnpm --filter @repo/core test >/dev/null 2>&1 && echo "- Core domain tests: ✅" || echo "- Core domain tests: ❌"
pnpm --filter @repo/contracts test >/dev/null 2>&1 && echo "- Contract tests: ✅" || echo "- Contract tests: ❌"

echo "- Coverage: Run 'pnpm --filter @repo/core test -- --coverage' to verify ≥100%"
```

**Expected**: Multiple entity/service files, all tests pass, high coverage

### Wave C1.2: Commit Authentication Domain

**🔗 COPY THIS TO CLAUDE CODE:**

```
I'm completing DevNet phase-c authentication wave - committing Wave C1.

TASK: Commit the authentication domain implementation.

Please commit Wave C1 with this exact command structure:
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"
git add packages/core packages/contracts tests/
git commit -m "feat(phase-c): authentication domain wave complete"

Confirm the commit was successful and show authentication capabilities implemented.
```

---

## Wave C2: Organizations & Collaboration

### Wave C2.1: Implement Organization Domain

**🔗 COPY THIS TO CLAUDE CODE:**

```
I'm implementing DevNet phase-c domain organizations wave (Wave C2).

PROJECT CONTEXT:
- Working directory: ${DEVNET_HOME:-~/Projects/devnet/}
- Goal: Multi-tenant organization management with RBAC
- Dependencies: Authentication entities from Wave C1 (User, Session)
- Focus: Membership management, invitations, permission systems

CURRENT STATUS: Authentication domain complete, building organization capabilities
SPECIFIC TASK: Execute Wave C2 from phase-c-domain.md

DOMAIN SCOPE - Organizations & Collaboration:
**Entities to Implement:**
- Organization - Core organization aggregate with settings and metadata
- Member - Organization membership with role and status tracking
- Invitation - Invitation management with expiration and acceptance flows
- Role - Role definitions with permissions and hierarchies

**Use Cases to Implement:**
- Organization creation and management
- Member invitation, acceptance, and removal
- Role assignment and permission management
- Organization context switching for users
- Seat limit enforcement and billing integration hooks

**Business Policies:**
- Seat limits based on subscription tier
- Owner/Admin/Member permission hierarchies
- Invitation expiration and security policies
- Organization resource access controls

**Domain Events:**
- OrganizationCreated - New organization established
- MemberInvited, MemberJoined, MemberRemoved - Membership lifecycle
- RoleAssigned, RoleRevoked - Permission changes

**Feature Specifications:**
Primary: features/organizations/specification.md
Secondary: features/users/specification.md

ARCHITECTURE REQUIREMENTS:
- Build on authentication entities from Wave C1
- RBAC policy service with contract-driven roles
- Aggregates enforcing membership invariants (seat limits, permissions)
- Domain events for membership audit trails
- 100% coverage on RBAC policy logic

INSTRUCTIONS:
Please execute the organizations domain wave following the DevNet phase-c domain plan.

Run these commands in sequence:
1. /create-spec "Organizations domain wave — RBAC policies, invitations, membership invariants. Use features/organizations/specification.md and features/users/specification.md as inputs."
2. /create-tasks
3. /execute-tasks

Ensure robust multi-tenant organization management with enterprise RBAC.
```

### Verification After C2

Run this to verify Wave C2 completed successfully:

```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

echo "🔍 Wave C2 Verification:"
echo "- Org entities: $(find packages/core -name '*Org*.ts' -o -name '*Member*.ts' -o -name '*Role*.ts' | wc -l | tr -d ' ') files"
echo "- RBAC services: $(find packages/core -name '*Rbac*.ts' -o -name '*Permission*.ts' -o -name '*Policy*.ts' | wc -l | tr -d ' ') services"
echo "- Invitation logic: $(find packages/core -name '*Invit*.ts' | wc -l | tr -d ' ') files"

echo ""
echo "🧪 Wave C2 Testing:"
echo "- Organization tests: $(find packages/core -path '*test*' -name '*org*' -o -path '*test*' -name '*member*' | wc -l | tr -d ' ') test suites"
pnpm --filter @repo/core test >/dev/null 2>&1 && echo "- Core domain tests: ✅" || echo "- Core domain tests: ❌"
```

**Expected**: Organization entities, RBAC services, all tests pass

### Wave C2.2: Commit Organizations Domain

**🔗 COPY THIS TO CLAUDE CODE:**

```
I'm completing DevNet phase-c organizations wave - committing Wave C2.

TASK: Commit the organizations domain implementation.

Please commit Wave C2 with this exact command structure:
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"
git add packages/core packages/contracts tests/
git commit -m "feat(phase-c): organization domain wave complete"

Confirm the commit was successful and show organization capabilities implemented.
```

---

## Wave C3: Billing & Payments

### Wave C3.1: Implement Billing Domain

**🔗 COPY THIS TO CLAUDE CODE:**

```
I'm implementing DevNet phase-c domain billing wave (Wave C3).

PROJECT CONTEXT:
- Working directory: ${DEVNET_HOME:-~/Projects/devnet/}
- Goal: Comprehensive billing and subscription management
- Provider-agnostic: Support Stripe, LemonSqueezy, Polar, Creem
- Complexity: Complex business logic for pricing, proration, seat-based billing

CURRENT STATUS: Authentication and Organizations complete, building billing capabilities
SPECIFIC TASK: Execute Wave C3 from phase-c-domain.md

DOMAIN SCOPE - Billing & Payments:
**Entities to Implement:**
- Subscription - Core subscription aggregate with lifecycle management
- Invoice - Invoice generation and payment tracking
- PaymentMethod - Customer payment method management
- UsageRecord - Usage tracking for metered billing
- Plan - Subscription plan definitions and pricing tiers

**Use Cases to Implement:**
- Subscription creation, updates, and cancellation
- Plan changes with proration calculations
- Seat adjustments and billing reconciliation
- Invoice generation and payment processing
- Usage metering and billing cycles
- Webhook normalization across providers

**Business Logic:**
- Proration calculations for mid-cycle changes
- Seat-based pricing with quantity adjustments
- Usage-based billing accumulation
- Tax calculation integration hooks
- Payment retry and dunning logic

**Provider Integration Patterns:**
- Stripe, LemonSqueezy, Polar, Creem webhook normalization
- Anti-corruption layers for each provider

**Domain Events:**
- SubscriptionCreated, SubscriptionCanceled - Lifecycle events
- PaymentSucceeded, PaymentFailed - Payment status
- InvoiceGenerated, InvoicePaid - Billing cycle events

**Feature Specifications:**
Primary: features/payments/specification.md
Secondary: features/api/specification.md

ARCHITECTURE REQUIREMENTS:
- Provider-agnostic billing service interfaces
- Pricing and seat calculators as pure domain services
- Reconciliation logic with comprehensive error handling
- Webhook normalization with provider anti-corruption layers
- 100% coverage on pricing calculation logic

INSTRUCTIONS:
Please execute the billing domain wave following the DevNet phase-c domain plan.

Run these commands in sequence:
1. /create-spec "Billing domain wave — subscription lifecycle, provider abstraction, reconciliation. Pull data from features/payments/specification.md and features/api/specification.md."
2. /create-tasks
3. /execute-tasks

Ensure enterprise-grade billing with multi-provider support and accurate financial calculations.
```

### Verification After C3

Run this to verify Wave C3 completed successfully:

```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

echo "🔍 Wave C3 Verification:"
echo "- Billing entities: $(find packages/core -name '*Subscription*.ts' -o -name '*Invoice*.ts' -o -name '*Payment*.ts' | wc -l | tr -d ' ') files"
echo "- Pricing services: $(find packages/core -name '*Pricing*.ts' -o -name '*Calculator*.ts' -o -name '*Billing*.ts' | wc -l | tr -d ' ') services"
echo "- Provider interfaces: $(find packages/infrastructure -name '*Provider*.ts' -o -name '*Payment*.ts' | wc -l | tr -d ' ') interfaces"

echo ""
echo "🧪 Wave C3 Testing:"
echo "- Billing tests: $(find packages/core -path '*test*' -name '*billing*' -o -path '*test*' -name '*payment*' | wc -l | tr -d ' ') test suites"
pnpm --filter @repo/core test >/dev/null 2>&1 && echo "- Core domain tests: ✅" || echo "- Core domain tests: ❌"

echo "- Financial logic: Ensure proration and tax calculations are thoroughly tested"
```

**Expected**: Billing entities, pricing services, all tests pass with financial accuracy

### Wave C3.2: Commit Billing Domain

**🔗 COPY THIS TO CLAUDE CODE:**

```
I'm completing DevNet phase-c billing wave - committing Wave C3.

TASK: Commit the billing domain implementation.

Please commit Wave C3 with this exact command structure:
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"
git add packages/core packages/contracts packages/infrastructure tests/
git commit -m "feat(phase-c): billing domain wave complete"

Confirm the commit was successful and show billing capabilities implemented.
```

---

## Wave C4: Platform Services & Shared Capabilities

### Wave C4.1: Implement Platform Services Domain

**🔗 COPY THIS TO CLAUDE CODE:**

```
I'm implementing DevNet phase-c domain platform services wave (Wave C4) - the final wave.

PROJECT CONTEXT:
- Working directory: ${DEVNET_HOME:-~/Projects/devnet/}
- Goal: AI chat, storage, email/notifications, audit logging
- Purpose: Shared platform capabilities used across all domains
- Integration: Cross-cutting services for Auth, Organizations, and Billing

CURRENT STATUS: Auth, Organizations, and Billing complete, building platform services
SPECIFIC TASK: Execute Wave C4 from phase-c-domain.md

DOMAIN SCOPE - Platform Services & Shared Capabilities:
**Entities to Implement:**
- ChatSession - AI conversation management with context and history
- StorageObject - File and media storage with metadata and access controls
- EmailNotification - Email dispatch with templating and delivery tracking
- AuditLogEntry - Security and compliance audit trail
- NotificationPreference - User notification settings and channels

**Use Cases to Implement:**
- AI chat conversation lifecycle and context management
- File upload, processing, and secure access
- Email template rendering and delivery orchestration
- Audit logging for compliance and security monitoring
- User notification preferences and delivery
- Cross-domain event logging and correlation

**Platform Capabilities:**
- AI provider abstraction (OpenAI, Anthropic, local models)
- Storage provider abstraction (S3, CloudFlare R2, local filesystem)
- Email provider abstraction (SendGrid, Resend, Mailgun, Postmark)
- Audit logging with structured events and search

**Cross-Cutting Concerns:**
- Rate limiting policies per tenant and user
- Tenant isolation guards for multi-tenant data
- Resource quota enforcement
- Security event correlation

**Domain Events:**
- ChatSessionStarted, MessageSent - AI interaction events
- FileUploaded, FileProcessed - Storage events
- EmailSent, EmailDelivered - Communication events
- AuditEventRecorded - Security and compliance events

**Feature Specifications:**
- features/ui-components/specification.md
- features/storage/specification.md
- features/email/specification.md
- features/api/specification.md

ARCHITECTURE REQUIREMENTS:
- Abstractions for AI providers with conversation context
- Storage abstractions with security and access control
- Email service abstractions with template management
- Comprehensive audit logging system
- Cross-cutting policy enforcement (rate limits, quotas, security)
- 100% coverage on policy enforcement logic

INSTRUCTIONS:
Please execute the platform services domain wave following the DevNet phase-c domain plan.

Run these commands in sequence:
1. /create-spec "Platform services domain wave — AI chat, storage, email, audit logging. Reference features/ui-components/specification.md, features/storage/specification.md, features/email/specification.md, and features/api/specification.md."
2. /create-tasks
3. /execute-tasks

Implement the platform foundation that enables rich user experiences across all domains.
```

### Verification After C4

Run this to verify Wave C4 completed successfully:

```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

echo "🔍 Wave C4 Verification:"
echo "- Platform entities: $(find packages/core -name '*Chat*.ts' -o -name '*Storage*.ts' -o -name '*Email*.ts' -o -name '*Audit*.ts' | wc -l | tr -d ' ') files"
echo "- Service abstractions: $(find packages/core -name '*Service*.ts' | wc -l | tr -d ' ') services"
echo "- Provider interfaces: $(find packages/infrastructure -name '*Provider*.ts' | wc -l | tr -d ' ') providers"
echo "- Cross-cutting concerns: $(find packages/core -name '*Policy*.ts' -o -name '*Guard*.ts' | wc -l | tr -d ' ') files"

echo ""
echo "🧪 Wave C4 Testing:"
echo "- Platform tests: $(find packages/core -path '*test*' -name '*platform*' -o -path '*test*' -name '*chat*' | wc -l | tr -d ' ') test suites"
pnpm --filter @repo/core test >/dev/null 2>&1 && echo "- Core domain tests: ✅" || echo "- Core domain tests: ❌"

echo ""
echo "🏁 All Waves Integration Test:"
pnpm build >/dev/null 2>&1 && echo "- Full build: ✅" || echo "- Full build: ❌"
```

**Expected**: Platform entities, provider interfaces, all tests pass, full build succeeds

### Wave C4.2: Commit Platform Services & Complete Phase

**🔗 COPY THIS TO CLAUDE CODE:**

```
I'm completing DevNet phase-c platform services wave and Phase C - final commit and validation.

TASKS:
1. Commit the platform services domain
2. Validate all 4 waves are complete
3. Prepare Phase C completion documentation
4. Prepare for Phase D transition

Please execute:

1. Commit Wave C4:
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"
git add packages/core packages/contracts packages/infrastructure tests/
git commit -m "feat(phase-c): platform services domain wave complete"

2. Run comprehensive Phase C validation:
- Verify all 4 domain waves are implemented
- Confirm 100% test coverage on domain logic
- Validate contract synchronization
- Check in-memory adapters are ready for API integration

3. Update checkpoint with Phase C completion:
- All 4 waves complete (Auth, Organizations, Billing, Platform)
- Domain coverage: 100% with in-memory adapters
- Next phase preparation

4. Create phase completion tag and show final status.

Confirm Phase C is complete and ready for Phase D delivery layers.
```

---

## Phase C Completion

### Final Verification

Run this comprehensive check to confirm all waves are complete:

```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

echo "🎯 Phase C Domain Capability Verification:"
echo ""

# Domain coverage check
echo "📋 Domain Coverage:"
echo "- Authentication entities: $(find packages/core -name '*User*.ts' -o -name '*Session*.ts' | wc -l | tr -d ' ') files"
echo "- Organization entities: $(find packages/core -name '*Org*.ts' -o -name '*Member*.ts' | wc -l | tr -d ' ') files"
echo "- Billing entities: $(find packages/core -name '*Subscription*.ts' -o -name '*Invoice*.ts' | wc -l | tr -d ' ') files"
echo "- Platform entities: $(find packages/core -name '*Chat*.ts' -o -name '*Storage*.ts' | wc -l | tr -d ' ') files"

# Use case coverage
echo ""
echo "🎭 Use Case Implementation:"
echo "- Use case services: $(find packages/core -name '*UseCase*.ts' -o -name '*Service*.ts' | wc -l | tr -d ' ') services"
echo "- Domain events: $(find packages/core -name '*Event*.ts' | wc -l | tr -d ' ') event types"
echo "- Repository interfaces: $(find packages/infrastructure -name '*Repository*.ts' | wc -l | tr -d ' ') interfaces"

# Quality verification
echo ""
echo "🧪 Quality Verification:"
echo "- Total test files: $(find packages/core packages/contracts -name '*test*.ts' -o -name '*spec*.ts' | wc -l | tr -d ' ') tests"

# Run comprehensive tests
pnpm --filter @repo/core test >/dev/null 2>&1 && echo "- Core domain tests: ✅" || echo "- Core domain tests: ❌"
pnpm --filter @repo/contracts test >/dev/null 2>&1 && echo "- Contract tests: ✅" || echo "- Contract tests: ❌"

# Architecture verification
echo ""
echo "🏗️ Architecture Integrity:"
pnpm build >/dev/null 2>&1 && echo "- Build verification: ✅" || echo "- Build verification: ❌"
pnpm lint >/dev/null 2>&1 && echo "- Lint verification: ✅" || echo "- Lint verification: ❌"
pnpm verify:local >/dev/null 2>&1 && echo "- Overall verification: ✅" || echo "- Overall verification: ❌"

# Progress tracking
echo ""
echo "📊 Progress Tracking:"
grep -q 'Phase C' DEVNET-CHECKPOINT.txt && echo "- Checkpoint updated: ✅" || echo "- Checkpoint updated: ❌"
[ $(git status --porcelain | wc -l) -eq 0 ] && echo "- Git state clean: ✅" || echo "- Git state clean: ❌"

echo ""
if pnpm verify:local >/dev/null 2>&1 && [ $(git status --porcelain | wc -l) -eq 0 ]; then
  echo "🎉 Phase C Complete! All domain capability waves implemented."
  echo ""
  echo "✅ What you've built:"
  echo "   • Wave C1: Complete authentication and identity management"
  echo "   • Wave C2: Organization management with RBAC"
  echo "   • Wave C3: Multi-provider billing and subscription logic"
  echo "   • Wave C4: Platform services (AI, storage, email, audit)"
  echo "   • 100% test coverage on all domain business logic"
  echo "   • In-memory adapters ready for API integration"
  echo ""
  echo "Next Steps:"
  echo "1. Proceed to Phase D: Delivery Layers"
  echo "2. Use phase-d-instructions.md for next steps"
else
  echo "❌ Phase C not complete. Review failed items above."
fi
```

### Phase C Acceptance Criteria

✅ **Wave C1**: Authentication & identity management complete
✅ **Wave C2**: Organization management with RBAC implemented
✅ **Wave C3**: Multi-provider billing and subscription logic
✅ **Wave C4**: Platform services (AI, storage, email, audit)
✅ **Coverage**: 100% on all domain business logic modules
✅ **Integration**: In-memory adapters ready for API layer
✅ **Contracts**: Domain events and contracts synchronized

### Troubleshooting

**Issue**: Test coverage below 100% on domain logic
**Solution**: Review coverage reports, add missing test cases for business rules.

**Issue**: Circular dependencies between waves
**Solution**: Check that waves depend only on shared kernel and prior wave entities.

**Issue**: Contract/domain synchronization failures
**Solution**: Ensure all domain entities have corresponding contract DTOs and mappers.

**Issue**: Memory issues with large test suites
**Solution**: Split large test files or use test suite parallelization.

---

## Next Phase

**🎉 Phase C Complete!**

**What you've accomplished:**
- ✅ Complete authentication and identity management
- ✅ Multi-tenant organization management with RBAC
- ✅ Enterprise billing with multi-provider support
- ✅ Platform services for AI, storage, communications, and audit
- ✅ 100% test coverage on all business logic
- ✅ Ready-to-use in-memory adapters for API integration

The application now has comprehensive business logic across all four domain areas, with proper separation of concerns and clean architecture principles.

**👉 Next**: Proceed to **[Phase D: Delivery Layers](phase-d-instructions.md)** to build the API delivery layer and migrate the frontend to Feature-Sliced Design, connecting your domain capabilities to the user-facing interfaces.
# Phase C: Domain Capability Waves — User Instructions

> **Goal**: Implement the four core domain capability waves with complete business logic, use cases, and domain services.

## Quick Context

You're now implementing the actual business logic of the application across four domain areas. Each wave builds specific domain capabilities using the architecture spine from Phase B. All waves must achieve 100% coverage on domain/use-case modules.

**Duration**: 8-12 hours (2-3 hours per wave)
**Prerequisites**: Phase B architecture spine complete with all packages building
**Next Phase**: Phase D (Delivery Layers)

## Before You Start

### Phase B Completion Check
Copy and run this verification:

```bash
DEVNET_PATH="${DEVNET_HOME:-$HOME/Projects/devnet}"
cd "$DEVNET_PATH"

echo "🔍 Phase B Prerequisites Check:"
echo "- Working directory: $(pwd)"
echo "- Contracts package: $([ -f packages/contracts/package.json ] && echo '✅' || echo '❌')"
echo "- Core package: $([ -f packages/core/package.json ] && echo '✅' || echo '❌')"
echo "- Infrastructure package: $([ -f packages/infrastructure/package.json ] && echo '✅' || echo '❌')"
echo "- Full build: $(pnpm build >/dev/null 2>&1 && echo '✅' || echo '❌')"
echo "- Verification: $(pnpm verify:local >/dev/null 2>&1 && echo '✅' || echo '❌')"
echo ""

if [ -f DEVNET-CHECKPOINT.txt ]; then
  echo "📋 Last Checkpoint:"
  grep -A2 -B2 "Phase B" DEVNET-CHECKPOINT.txt || tail -3 DEVNET-CHECKPOINT.txt
else
  echo "❌ Missing DEVNET-CHECKPOINT.txt - ensure Phase B is complete"
fi
```

### Expected Output
All items should show ✅. If not, complete Phase B first.

---

## Wave Execution Strategy

### Sequential Approach (Recommended)
Execute waves in order: **C1 → C2 → C3 → C4**
- Each wave builds on concepts from previous waves
- Easier to debug and verify incrementally
- Authentication (C1) is foundational for all others

### Parallel Approach (Advanced)
After completing C1, you can run C2, C3, C4 simultaneously if you have multiple Claude sessions:
- Complete Wave C1 first (authentication is required by other domains)
- Run C2, C3, C4 in parallel using separate Claude Code instances
- Merge and test integration after all waves complete

---

## Wave C1: Authentication & Identity

### What You're Doing
Implementing user authentication, session management, MFA policies, and identity-related use cases as the foundation for all other domains.

### Copy This Into Claude Code:

```
Phase C, Wave C1: Authentication & Identity domain implementation.

**Context**:
- This is the foundational domain wave - all other domains depend on authentication
- Building comprehensive user identity management with modern security patterns
- Must integrate with the contracts and core architecture from Phase B

**Domain Scope**:
**Entities to Implement**:
- `User` - Core user entity with identity, profile, and security attributes
- `Session` - User session management with expiration and security tracking
- `Credential` - User authentication credentials (password, passkeys, OAuth tokens)
- `MfaDevice` - Multi-factor authentication device management

**Use Cases to Implement**:
- User registration and email verification
- Sign-in with password and passkey support
- Multi-factor authentication enrollment and challenges
- Password reset and recovery flows
- Session rotation and security management

**Domain Events**:
- `UserRegistered` - New user account created
- `UserAuthenticated` - Successful authentication event
- `MfaChallengeRequested` - MFA challenge initiated
- `SessionCreated`, `SessionExpired` - Session lifecycle events

**Feature Specifications**:
- Primary: `features/auth/specification.md` - Authentication requirements and flows
- Secondary: `features/users/specification.md` - User management and profile data

**Architecture Requirements**:
- Use clean architecture patterns from `packages/core`
- Implement domain services for password hashing, MFA policies (interface-based)
- Create contract-aligned DTO mappers between core and contracts packages
- Achieve 100% test coverage on all business logic
- Use repository interfaces from infrastructure (implement with in-memory fakes)

**Quality Standards**:
- Follow `docs/standards/architecture/clean-architecture.md` verification blocks
- All authentication business rules must be tested
- Security-sensitive code requires extra test coverage for edge cases
- Domain purity - no framework dependencies in core domain code

**Deliverables**:
- Authentication entities with business invariants
- Use case services with comprehensive error handling
- Domain events for audit logging and integration
- In-memory repository implementations for testing
- Contract mappers for API integration
- 100% test coverage with security focus

Implement the authentication domain wave with enterprise-grade security patterns.
```

### Verify Success:
```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

echo "🔍 Wave C1 Verification:"
echo "- Auth entities: $(find packages/core -name '*User*.ts' -o -name '*Session*.ts' -o -name '*Credential*.ts' | wc -l | tr -d ' ') files"
echo "- Use case services: $(find packages/core -name '*Use*Case*.ts' -o -name '*Service*.ts' | grep -i auth | wc -l | tr -d ' ') services"
echo "- Domain events: $(find packages/core -name '*Event*.ts' -o -name '*event*.ts' | wc -l | tr -d ' ') event types"
echo "- Test coverage: $(find packages/core -name '*test*.ts' -o -name '*spec*.ts' | wc -l | tr -d ' ') test files"

echo ""
echo "🧪 Wave C1 Testing:"
if pnpm --filter @repo/core test >/dev/null 2>&1; then
  echo "- Core domain tests: ✅ pass"
else
  echo "- Core domain tests: ❌ failing"
fi

if pnpm --filter @repo/contracts test >/dev/null 2>&1; then
  echo "- Contract tests: ✅ pass"
else
  echo "- Contract tests: ❌ failing"
fi

# Test coverage check
echo "- Coverage report: run 'pnpm --filter @repo/core test -- --coverage' to verify ≥100%"
```

### Expected Output
- Should find multiple entity, service, and event files
- All tests should pass
- Coverage should be at or near 100%

### Commit Checkpoint
```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"
git add packages/core packages/contracts tests/
git commit -m "feat(phase-c): authentication domain wave complete"
```

---

## Wave C2: Organizations & Collaboration

### What You're Doing
Building organization management, membership, role-based access control (RBAC), and collaboration features on top of the authentication foundation.

### Copy This Into Claude Code:

```
Phase C, Wave C2: Organizations & Collaboration domain implementation.

**Context**:
- Building multi-tenant organization management with RBAC
- Depends on authentication entities from Wave C1
- Focus on membership management, invitations, and permission systems

**Domain Scope**:
**Entities to Implement**:
- `Organization` - Core organization aggregate with settings and metadata
- `Member` - Organization membership with role and status tracking
- `Invitation` - Invitation management with expiration and acceptance flows
- `Role` - Role definitions with permissions and hierarchies

**Use Cases to Implement**:
- Organization creation and management
- Member invitation, acceptance, and removal
- Role assignment and permission management
- Organization context switching for users
- Seat limit enforcement and billing integration hooks

**Business Policies**:
- Seat limits based on subscription tier
- Owner/Admin/Member permission hierarchies
- Invitation expiration and security policies
- Organization resource access controls

**Domain Events**:
- `OrganizationCreated` - New organization established
- `MemberInvited`, `MemberJoined`, `MemberRemoved` - Membership lifecycle
- `RoleAssigned`, `RoleRevoked` - Permission changes

**Feature Specifications**:
- Primary: `features/organizations/specification.md` - Organization and membership requirements
- Secondary: `features/users/specification.md` - User-organization relationships

**Architecture Requirements**:
- Build on authentication entities from Wave C1
- Implement RBAC policy service with contract-driven roles
- Create aggregates that enforce membership invariants (seat limits, permissions)
- Use domain events for membership audit trails
- Repository interfaces with in-memory implementations

**Quality Standards**:
- 100% coverage on RBAC policy logic
- Comprehensive testing of membership invariants
- Security testing for permission bypass attempts
- Integration with auth domain events

**Deliverables**:
- Organization aggregate with membership management
- RBAC policy service with permission evaluation
- Invitation workflow with security controls
- Domain events for membership changes
- Integration points for billing (seat count tracking)
- Comprehensive test coverage of business rules

Implement robust multi-tenant organization management with enterprise RBAC.
```

### Verify Success:
```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

echo "🔍 Wave C2 Verification:"
echo "- Org entities: $(find packages/core -name '*Org*.ts' -o -name '*Member*.ts' -o -name '*Role*.ts' | wc -l | tr -d ' ') files"
echo "- RBAC services: $(find packages/core -name '*Rbac*.ts' -o -name '*Permission*.ts' -o -name '*Policy*.ts' | wc -l | tr -d ' ') services"
echo "- Invitation logic: $(find packages/core -name '*Invit*.ts' | wc -l | tr -d ' ') files"

echo ""
echo "🧪 Wave C2 Testing:"
echo "- Organization tests: $(find packages/core -path '*test*' -name '*org*' -o -path '*test*' -name '*member*' | wc -l | tr -d ' ') test suites"

if pnpm --filter @repo/core test >/dev/null 2>&1; then
  echo "- Core domain tests: ✅ all pass"
else
  echo "- Core domain tests: ❌ review failures"
fi
```

### Expected Output
- Should find organization, member, role entities
- RBAC and policy services should exist
- All core tests should continue passing

### Commit Checkpoint
```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"
git add packages/core packages/contracts tests/
git commit -m "feat(phase-c): organization domain wave complete"
```

---

## Wave C3: Billing & Payments

### What You're Doing
Implementing subscription lifecycle management, multi-provider billing integration, and usage-based pricing logic.

### Copy This Into Claude Code:

```
Phase C, Wave C3: Billing & Payments domain implementation.

**Context**:
- Building comprehensive billing and subscription management
- Provider-agnostic design supporting Stripe, LemonSqueezy, Polar, Creem
- Complex business logic for pricing, proration, and seat-based billing

**Domain Scope**:
**Entities to Implement**:
- `Subscription` - Core subscription aggregate with lifecycle management
- `Invoice` - Invoice generation and payment tracking
- `PaymentMethod` - Customer payment method management
- `UsageRecord` - Usage tracking for metered billing
- `Plan` - Subscription plan definitions and pricing tiers

**Use Cases to Implement**:
- Subscription creation, updates, and cancellation
- Plan changes with proration calculations
- Seat adjustments and billing reconciliation
- Invoice generation and payment processing
- Usage metering and billing cycles
- Webhook normalization across providers

**Business Logic**:
- Proration calculations for mid-cycle changes
- Seat-based pricing with quantity adjustments
- Usage-based billing accumulation
- Tax calculation integration hooks
- Payment retry and dunning logic

**Provider Integration Patterns**:
- Stripe webhook normalization
- LemonSqueezy subscription mapping
- Polar payment processing
- Creem recurring billing
- Anti-corruption layers for each provider

**Domain Events**:
- `SubscriptionCreated`, `SubscriptionCanceled` - Lifecycle events
- `PaymentSucceeded`, `PaymentFailed` - Payment status
- `InvoiceGenerated`, `InvoicePaid` - Billing cycle events
- `UsageRecorded` - Metering events

**Feature Specifications**:
- Primary: `features/payments/specification.md` - Payment and subscription requirements
- Secondary: `features/api/specification.md` - API integration patterns for webhooks

**Architecture Requirements**:
- Provider-agnostic billing service interfaces
- Pricing and seat calculators as pure domain services
- Reconciliation logic with comprehensive error handling
- Webhook normalization with provider anti-corruption layers
- Repository interfaces for subscription and payment data

**Quality Standards**:
- 100% coverage on pricing calculation logic
- Comprehensive testing of proration algorithms
- Edge case testing for payment failures and retries
- Integration testing with mock providers

**Deliverables**:
- Subscription management with lifecycle automation
- Provider-agnostic payment processing abstractions
- Pricing calculator services with proration logic
- Webhook normalization and event processing
- Reconciliation services for billing accuracy
- Comprehensive financial logic testing

Implement enterprise-grade billing with multi-provider support and accurate financial calculations.
```

### Verify Success:
```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

echo "🔍 Wave C3 Verification:"
echo "- Billing entities: $(find packages/core -name '*Subscription*.ts' -o -name '*Invoice*.ts' -o -name '*Payment*.ts' | wc -l | tr -d ' ') files"
echo "- Pricing services: $(find packages/core -name '*Pricing*.ts' -o -name '*Calculator*.ts' -o -name '*Billing*.ts' | wc -l | tr -d ' ') services"
echo "- Provider interfaces: $(find packages/infrastructure -name '*Provider*.ts' -o -name '*Payment*.ts' | wc -l | tr -d ' ') interfaces"

echo ""
echo "🧪 Wave C3 Testing:"
echo "- Billing tests: $(find packages/core -path '*test*' -name '*billing*' -o -path '*test*' -name '*payment*' -o -path '*test*' -name '*subscription*' | wc -l | tr -d ' ') test suites"

if pnpm --filter @repo/core test >/dev/null 2>&1; then
  echo "- Core domain tests: ✅ all pass"
else
  echo "- Core domain tests: ❌ review failures"
fi

# Check for financial calculation accuracy
echo "- Financial logic: ensure proration and tax calculations are thoroughly tested"
```

### Expected Output
- Should find subscription, invoice, payment entities
- Pricing and billing services should exist
- Provider interfaces should be defined
- All tests should pass with comprehensive financial logic coverage

### Commit Checkpoint
```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"
git add packages/core packages/contracts packages/infrastructure tests/
git commit -m "feat(phase-c): billing domain wave complete"
```

---

## Wave C4: Platform Services & Shared Capabilities

### What You're Doing
Implementing AI chat functionality, storage management, email/notification services, and audit logging - the shared platform capabilities used across all domains.

### Copy This Into Claude Code:

```
Phase C, Wave C4: Platform Services & Shared Capabilities domain implementation.

**Context**:
- Final domain wave implementing shared platform services
- Cross-cutting capabilities used by authentication, organizations, and billing domains
- Focus on AI integration, storage, communications, and audit functionality

**Domain Scope**:
**Entities to Implement**:
- `ChatSession` - AI conversation management with context and history
- `StorageObject` - File and media storage with metadata and access controls
- `EmailNotification` - Email dispatch with templating and delivery tracking
- `AuditLogEntry` - Security and compliance audit trail
- `NotificationPreference` - User notification settings and channels

**Use Cases to Implement**:
- AI chat conversation lifecycle and context management
- File upload, processing, and secure access
- Email template rendering and delivery orchestration
- Audit logging for compliance and security monitoring
- User notification preferences and delivery
- Cross-domain event logging and correlation

**Platform Capabilities**:
- AI provider abstraction (OpenAI, Anthropic, local models)
- Storage provider abstraction (S3, CloudFlare R2, local filesystem)
- Email provider abstraction (SendGrid, Resend, Mailgun, Postmark)
- Audit logging with structured events and search

**Cross-Cutting Concerns**:
- Rate limiting policies per tenant and user
- Tenant isolation guards for multi-tenant data
- Resource quota enforcement
- Security event correlation

**Domain Events**:
- `ChatSessionStarted`, `MessageSent`, `ChatSessionEnded` - AI interaction events
- `FileUploaded`, `FileProcessed`, `FileAccessed` - Storage events
- `EmailSent`, `EmailDelivered`, `EmailBounced` - Communication events
- `AuditEventRecorded` - Security and compliance events

**Feature Specifications**:
- `features/ui-components/specification.md` - UI patterns for platform services
- `features/storage/specification.md` - File and media storage requirements
- `features/email/specification.md` - Email and notification requirements
- `features/api/specification.md` - Platform API patterns and rate limiting

**Architecture Requirements**:
- Abstractions for AI providers with conversation context management
- Storage abstractions with security and access control
- Email service abstractions with template management
- Audit logging with structured events and correlation IDs
- Guarded value objects for tenant IDs, resource IDs, and quotas
- Cross-cutting policy enforcement (rate limits, quotas, security)

**Quality Standards**:
- 100% coverage on policy enforcement logic
- Security testing for tenant isolation
- Rate limiting and quota enforcement testing
- Integration testing with mock providers
- Comprehensive audit event testing

**Deliverables**:
- AI conversation management with provider abstraction
- File storage services with security controls
- Email notification services with delivery tracking
- Comprehensive audit logging system
- Cross-cutting policy enforcement
- Tenant isolation and security controls

Implement the platform foundation that enables rich user experiences across all domains.
```

### Verify Success:
```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

echo "🔍 Wave C4 Verification:"
echo "- Platform entities: $(find packages/core -name '*Chat*.ts' -o -name '*Storage*.ts' -o -name '*Email*.ts' -o -name '*Audit*.ts' | wc -l | tr -d ' ') files"
echo "- Service abstractions: $(find packages/core -name '*Service*.ts' | wc -l | tr -d ' ') services"
echo "- Provider interfaces: $(find packages/infrastructure -name '*Provider*.ts' | wc -l | tr -d ' ') providers"
echo "- Cross-cutting concerns: $(find packages/core -name '*Policy*.ts' -o -name '*Guard*.ts' | wc -l | tr -d ' ') files"

echo ""
echo "🧪 Wave C4 Testing:"
echo "- Platform tests: $(find packages/core -path '*test*' -name '*platform*' -o -path '*test*' -name '*chat*' -o -path '*test*' -name '*storage*' | wc -l | tr -d ' ') test suites"

if pnpm --filter @repo/core test >/dev/null 2>&1; then
  echo "- Core domain tests: ✅ all pass"
else
  echo "- Core domain tests: ❌ review failures"
fi

# Final comprehensive test
echo ""
echo "🏁 All Waves Integration Test:"
if pnpm build >/dev/null 2>&1; then
  echo "- Full build: ✅ all packages compile"
else
  echo "- Full build: ❌ compilation failures"
fi
```

### Expected Output
- Should find chat, storage, email, audit entities
- Multiple service abstractions and provider interfaces
- All tests should pass across all domain waves
- Full build should succeed

### Commit Checkpoint
```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"
git add packages/core packages/contracts packages/infrastructure tests/
git commit -m "feat(phase-c): platform services domain wave complete"
```

---

## Phase C Completion

### Comprehensive Domain Verification
Run this complete verification of all domain capability waves:

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
if pnpm --filter @repo/core test >/dev/null 2>&1; then
  echo "- Core domain tests: ✅ all waves pass"
else
  echo "- Core domain tests: ❌ some failures"
fi

if pnpm --filter @repo/contracts test >/dev/null 2>&1; then
  echo "- Contract tests: ✅ pass"
else
  echo "- Contract tests: ❌ failures"
fi

# Architecture verification
echo ""
echo "🏗️  Architecture Integrity:"
echo "- Build verification: $(pnpm build >/dev/null 2>&1 && echo '✅ clean build' || echo '❌ build issues')"
echo "- Lint verification: $(pnpm lint >/dev/null 2>&1 && echo '✅ clean code' || echo '❌ lint issues')"
echo "- Overall verification: $(pnpm verify:local >/dev/null 2>&1 && echo '✅ all gates pass' || echo '❌ quality issues')"

# Contract synchronization
echo ""
echo "📝 Contract Synchronization:"
if pnpm --filter @repo/contracts build:openapi >/dev/null 2>&1; then
  echo "- OpenAPI generation: ✅ contracts synchronized"
else
  echo "- OpenAPI generation: ⚠️  verify build script"
fi

# Progress tracking
echo ""
echo "📊 Progress Tracking:"
if grep -q 'Phase C' DEVNET-CHECKPOINT.txt; then
  echo "- Checkpoint updated: ✅ Phase C recorded"
else
  echo "- Checkpoint updated: ❌ update DEVNET-CHECKPOINT.txt"
fi

echo "- Git state: $([ $(git status --porcelain | wc -l) -eq 0 ] && echo '✅ clean' || echo '❌ uncommitted changes')"

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
  echo "1. Return to the USER-EXECUTION-GUIDE.md"
  echo "2. Proceed to Phase D: Delivery Layers"
else
  echo "❌ Phase C not complete. Review failed items above."
  echo ""
  echo "Common fixes:"
  echo "- Ensure all wave commits are complete"
  echo "- Run coverage reports: pnpm --filter @repo/core test -- --coverage"
  echo "- Check that in-memory repositories are implemented"
  echo "- Verify contract/domain synchronization"
fi
```

### Phase C Final Update
Update your progress checkpoint:

```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

# Final checkpoint update
echo "Phase C - Domain Capability Waves: COMPLETE" >> DEVNET-CHECKPOINT.txt
echo "- Authentication domain wave: ✅" >> DEVNET-CHECKPOINT.txt
echo "- Organization domain wave: ✅" >> DEVNET-CHECKPOINT.txt
echo "- Billing domain wave: ✅" >> DEVNET-CHECKPOINT.txt
echo "- Platform services wave: ✅" >> DEVNET-CHECKPOINT.txt
echo "- Domain coverage: 100% with in-memory adapters" >> DEVNET-CHECKPOINT.txt
echo "- Next: Phase D - Delivery Layers" >> DEVNET-CHECKPOINT.txt
echo "$(date): Phase C acceptance criteria met" >> DEVNET-CHECKPOINT.txt

# Create phase tag
git add DEVNET-CHECKPOINT.txt DEVNET-PROGRESS.md
git commit -m "docs(phase-c): all domain capability waves completed"
git tag v0.3.0-phase-c
```

### Phase C Acceptance Criteria
✅ **Wave C1**: Authentication & identity management complete
✅ **Wave C2**: Organization management with RBAC implemented
✅ **Wave C3**: Multi-provider billing and subscription logic
✅ **Wave C4**: Platform services (AI, storage, email, audit)
✅ **Coverage**: 100% on all domain business logic modules
✅ **Integration**: In-memory adapters ready for API layer
✅ **Contracts**: Domain events and contracts synchronized

### Rollback Procedure (If Needed)
To restart specific waves or the entire phase:

```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

# Reset to Phase B completion (restart all waves)
git reset --hard v0.2.0-phase-b  # Or find Phase B completion commit
git clean -fd

# Or reset to specific wave (example: restart from Wave C2)
git reset --hard HEAD~6  # Adjust based on commits since C1
```

### Troubleshooting Common Issues

**Issue**: Test coverage below 100% on domain logic
**Solution**: Review coverage reports and add missing test cases for business rules and edge cases.

**Issue**: Circular dependencies between domain waves
**Solution**: Check that waves depend only on shared kernel and prior wave entities, not circular references.

**Issue**: Contract/domain synchronization failures
**Solution**: Ensure all domain entities have corresponding contract DTOs and mappers.

**Issue**: Memory issues with large test suites
**Solution**: Consider splitting large test files or using test suite parallelization.

---

**Phase C Complete!** 🏆

You've implemented comprehensive business logic across all four domain areas. The application now has:
- Complete authentication and identity management
- Multi-tenant organization management with RBAC
- Enterprise billing with multi-provider support
- Platform services for AI, storage, communications, and audit

**Next**: Return to [USER-EXECUTION-GUIDE.md](../USER-EXECUTION-GUIDE.md) and proceed to **Phase D: Delivery Layers**.
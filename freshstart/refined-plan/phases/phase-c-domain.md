# Phase C: Domain Capability Waves

## Overview

- Phase: Domain Capability Waves
- Coverage Target: 100% for all domain/use-case modules; contract sync must be ≥98%
- Status: Begins after Phase B acceptance checkpoint
- Duration: 4 waves aligned to feature domains (Auth, Organizations, Billing, Platform Services)
- Next Phase: Phase D — Delivery Layers

## Prerequisites

- `packages/contracts`, `packages/core`, and `packages/infrastructure` scaffolds complete
- Architecture quality gates from Phase B running in CI
- Feature specifications reviewed for each upcoming wave (`features/*/specification.md`)

## Phase Acceptance

- All use-case modules implemented with in-memory adapters and contract-backed request/response models
- Unit and integration tests for each wave pass with ≥100% branch coverage where required by standards
- Domain verification runner (from `docs/standards/architecture/clean-architecture.md`) executes without violations
- Repository interfaces implemented via in-memory fakes to unblock API layer
- Updated ADRs capturing key domain decisions (e.g., aggregate boundaries, invariants)

## Standards & Intents

- Clean architecture domain rules: `docs/standards/architecture/clean-architecture.md`
- Domain verification DSL: `docs/standards/architecture/domain-verification.md`
- Testing: `docs/standards/development/testing-strategy.md`

## Implementation Waves

Each wave follows the EOS execution pattern: `/create-spec` (with explicit DSL routing) → `/create-tasks` → `/execute-tasks`. Run `pnpm --filter @repo/core test -- --coverage` after each wave.

### Wave C1: Authentication & Identity

```claude
Claude: /create-spec "Authentication domain wave — implement entities, MFA policies, and contract mappers. Load requirements from features/auth/specification.md and features/users/specification.md."
Claude: /create-tasks
Claude: /execute-tasks
```

**Scope**
- Entities: User, Session, Credential, MFA Device
- Use cases: Sign-up, Sign-in, Passkey enrollment, Password reset, Session rotation
- Events: `UserRegistered`, `UserAuthenticated`, `MfaChallengeRequested`
- Feature specs: `features/auth/specification.md`, `features/users/specification.md`

**Deliverables**
- Domain services for password hashing + MFA policy (interface-based)
- Contract-aligned DTO mappers (core ↔ contracts)
- Test suites covering success/error paths, guard clauses, event emission

**Validation**
- Follow the Clean Architecture verification blocks (100% coverage, domain purity) defined in the standards; `/execute-tasks` Step 6 executes them.

**Commit Point**
```bash
git add packages/core packages/contracts tests/
git commit -m "feat(phase-c): authentication domain wave complete"
```

### Wave C2: Organizations & Collaboration

```claude
Claude: /create-spec "Organizations domain wave — RBAC policies, invitations, membership invariants. Use features/organizations/specification.md and features/users/specification.md as inputs."
Claude: /create-tasks
Claude: /execute-tasks
```

**Scope**
- Entities: Organization, Member, Invitation, Role
- Use cases: Org creation, member invite/accept, role assignment, org context switching
- Policies: Seat limits, owner/admin/member permissions
- Feature specs: `features/organizations/specification.md`, `features/users/specification.md`

**Deliverables**
- RBAC policy service with contract-driven roles
- Domain events for invitations + membership changes
- Aggregates enforcing membership invariants

**Validation**
- Enforce the RBAC-specific verification blocks from the standards via `/execute-tasks`; ensure coverage remains at 100%.

**Commit Point**
```bash
git add packages/core packages/contracts tests/
git commit -m "feat(phase-c): organization domain wave complete"
```

### Wave C3: Billing & Payments

```claude
Claude: /create-spec "Billing domain wave — subscription lifecycle, provider abstraction, reconciliation. Pull data from features/payments/specification.md and features/api/specification.md."
Claude: /create-tasks
Claude: /execute-tasks
```

**Scope**
- Entities: Subscription, Invoice, PaymentMethod, UsageRecord
- Integrations: Stripe, LemonSqueezy, Polar, Creem via interface contracts
- Use cases: Plan changes, seat adjustments, webhook normalization
- Feature specs: `features/payments/specification.md`, `features/api/specification.md`

**Deliverables**
- Provider-agnostic billing service interfaces + domain event handlers
- Pricing/seat calculators as pure domain services
- Reconciliation logic + tests for proration and seat sync

**Validation**
- Use the standards’ billing verification blocks (coverage, guard clauses) executed through `/execute-tasks` Step 6.

**Commit Point**
```bash
git add packages/core packages/contracts tests/
git commit -m "feat(phase-c): billing domain wave complete"
```

### Wave C4: Platform Services & Shared Capabilities

```claude
Claude: /create-spec "Platform services domain wave — AI chat, storage, email, audit logging. Reference features/ui-components/specification.md, features/storage/specification.md, features/email/specification.md, and features/api/specification.md."
Claude: /create-tasks
Claude: /execute-tasks
```

**Scope**
- Entities/VOs: AI Chat Session, StorageObject, EmailNotification, AuditLogEntry
- Use cases: Conversation lifecycle, file handling, email dispatch scheduling, audit logging
- Cross-cutting: Rate limiting policies, tenant isolation guards
- Feature specs: `features/ui-components/specification.md`, `features/storage/specification.md`, `features/email/specification.md`, `features/api/specification.md`

**Deliverables**
- Abstractions for AI providers, storage, email, and logging
- Guarded value objects (tenant IDs, resource IDs, quotas)
- Consolidated domain events library for platform integrations

**Validation**
- Execute the platform-focused verification blocks via `/execute-tasks` Step 6, ensuring coverage and cross-cutting policy checks remain green.

**Commit Point**
```bash
git add packages/core packages/contracts tests/
git commit -m "feat(phase-c): platform services domain wave complete"
```

## Phase Closure

- Run `/execute-tasks` referencing clean architecture verification blocks and testing strategy gates
- Update `DEVNET-CHECKPOINT.txt` with Phase C completion, noting coverage metrics and unresolved follow-ups
- Tag release `v0.3.0-phase-c` (or similar) once all checks pass

## References

- Feature specs: `features/auth/`, `features/organizations/`, `features/payments/`, `features/ui-components/`, `features/storage/`, `features/email/`
- Prior art: `freshstart/CleanArchitectureMigration.md`

# Phase C: Domain Capability Waves (User-Driven)

## Agent Brief (copy/paste to start)
```
You are assisting with Phase C: Domain Capability Waves for the DevNet migration. We will iterate through four waves (Auth, Organizations, Billing, Platform Services) to implement clean-architecture domain modules on top of the contracts/core scaffolding delivered in Phase B. Expect to work domain-first with in-memory adapters, strict coverage (>=100%), and EOS verification hooks. I will send waves one at a time.
```

## Phase Overview
- Coverage target: 100% for domain/use-case modules; contract sync ≥98%
- Sequence: Four capability waves (Authentication → Organizations → Billing → Platform Services)
- Next phase: Phase D — Delivery Layers

## Prerequisites
- Phase B completion recorded in `DEVNET-CHECKPOINT.txt`
- `packages/contracts`, `packages/core`, `packages/infrastructure` ready for domain wiring
- Architecture quality gates active in CI
- Feature specifications reviewed for each wave (`features/*/specification.md`)

### Workspace Guard (optional)
```bash
DEVNET_PATH="${DEVNET_HOME:-$HOME/Projects/devnet}"
REMOTE_EXPECTED="${DEVNET_GIT_REMOTE:-}"
ORIGIN_URL=""
if [ -d "$DEVNET_PATH/.git" ]; then
  ORIGIN_URL="$(cd "$DEVNET_PATH" && git config --get remote.origin.url 2>/dev/null)"
fi
if [ ! -d "$DEVNET_PATH/.git" ]; then
  echo "❌ $DEVNET_PATH is not initialized — rerun Phase A bootstrap"
elif [ -n "$REMOTE_EXPECTED" ] && [ "$ORIGIN_URL" != "$REMOTE_EXPECTED" ]; then
  echo "❌ origin remote mismatch — set via: git -C $DEVNET_PATH remote set-url origin $REMOTE_EXPECTED"
else
  echo "✅ Workspace ready at $DEVNET_PATH"
fi
```

## Acceptance Checklist
- Each domain wave delivers in-memory adapters, contract-backed DTO mappers, and pure domain services
- Unit + integration tests achieve ≥100% branch coverage and satisfy verification runners
- Domain verification DSL (`docs/standards/architecture/domain-verification.md`) runs without violations
- Repository interfaces satisfied by in-memory fakes to unblock Phase D
- ADRs capture domain decisions (aggregates, invariants, provider abstractions)

## Manual Wave Runner
Run the waves sequentially. After each `/execute-tasks`, execute `pnpm --filter @repo/core test -- --coverage` to validate coverage before committing.

Context Reset Tip: After committing each wave, clear the agent context and start the next wave using the Handoff Template in `freshstart/user-driven-plan/implementation-plan.md` (see "Context Resets & Handoff").

### Wave C1: Authentication & Identity
**Message to send:**
```
/create-spec "Authentication domain wave — implement entities, MFA policies, and contract mappers. Load requirements from features/auth/specification.md and features/users/specification.md."
/create-tasks
/execute-tasks

# On completion, output a Context Pack for handoff with:
# - Phase/Step: Phase C / Wave C1
# - Acceptance, Verification commands, Files, Decisions, Commit message, Next Step Commands (C2)
```

**Scope Highlights**
- Entities: User, Session, Credential, MFDevice
- Use cases: Sign-up, Sign-in, Passkey enrollment, Password reset, Session rotation
- Events: `UserRegistered`, `UserAuthenticated`, `MfaChallengeRequested`

**Key Deliverables**
- Domain services for password hashing + MFA policy using interfaces
- Contract DTO mappers (core ↔ contracts)
- Test suites covering success/error paths, guard clauses, event emission

**Suggested Commit**
```
git add packages/core packages/contracts tests/
git commit -m "feat(phase-c): authentication domain wave complete"
```

### Wave C2: Organizations & Collaboration
**Message to send:**
```
/create-spec "Organizations domain wave — RBAC policies, invitations, membership invariants. Use features/organizations/specification.md and features/users/specification.md as inputs."
/create-tasks
/execute-tasks

# On completion, output a Context Pack for handoff with:
# - Phase/Step: Phase C / Wave C2
# - Acceptance, Verification commands, Files, Decisions, Commit message, Next Step Commands (C3)
```

**Scope Highlights**
- Entities: Organization, Member, Invitation, Role
- Actions: Org creation, member invite/accept, role assignment, org context switching
- Policies: Seat limits, owner/admin/member permissions

**Key Deliverables**
- RBAC policy service with contract-driven roles
- Domain events for invitations and membership changes
- Aggregates enforcing membership invariants

**Suggested Commit**
```
git add packages/core packages/contracts tests/
git commit -m "feat(phase-c): organization domain wave complete"
```

### Wave C3: Billing & Payments
**Message to send:**
```
/create-spec "Billing domain wave — subscription lifecycle, provider abstraction, reconciliation. Pull data from features/payments/specification.md and features/api/specification.md."
/create-tasks
/execute-tasks

# On completion, output a Context Pack for handoff with:
# - Phase/Step: Phase C / Wave C3
# - Acceptance, Verification commands, Files, Decisions, Commit message, Next Step Commands (C4)
```

**Scope Highlights**
- Entities: Subscription, Invoice, PaymentMethod, UsageRecord
- Integrations: Stripe, LemonSqueezy, Polar, Creem via interface contracts
- Use cases: Plan changes, seat adjustments, webhook normalization

**Key Deliverables**
- Provider-agnostic billing service interfaces + domain event handlers
- Pricing/seat calculators as pure domain services
- Reconciliation logic with proration + seat sync tests

**Suggested Commit**
```
git add packages/core packages/contracts tests/
git commit -m "feat(phase-c): billing domain wave complete"
```

### Wave C4: Platform Services & Shared Capabilities
**Message to send:**
```
/create-spec "Platform services domain wave — AI chat, storage, email, audit logging. Reference features/ui-components/specification.md, features/storage/specification.md, features/email/specification.md, and features/api/specification.md."
/create-tasks
/execute-tasks

# On completion, output a Context Pack for handoff with:
# - Phase/Step: Phase C / Wave C4
# - Acceptance, Verification commands, Files, Decisions, Commit message, Next Step Commands (Phase D / Step D1)
```

**Scope Highlights**
- Entities/VOs: AI Chat Session, StorageObject, EmailNotification, AuditLogEntry
- Use cases: Conversation lifecycle, file handling, email dispatch scheduling, audit logging
- Cross-cutting: Rate limiting policies, tenant isolation guards

**Key Deliverables**
- Abstractions for AI providers, storage, email, logging
- Guarded value objects (tenant IDs, resource IDs, quotas)
- Consolidated domain events library for platform integrations

**Suggested Commit**
```
git add packages/core packages/contracts tests/
git commit -m "feat(phase-c): platform services domain wave complete"
```

## Phase Closure
- Run `/execute-tasks` using the clean architecture verification flow plus `pnpm --filter @repo/core test -- --coverage`
- Update `DEVNET-CHECKPOINT.txt` with coverage metrics, domain notes, and next-phase pointer
- Create a release tag (e.g., `v0.3.0-phase-c`) when all checks are green

## References
- `docs/standards/architecture/clean-architecture.md`
- `docs/standards/architecture/domain-verification.md`
- `docs/standards/development/testing-strategy.md`
- Feature specifications across auth, organizations, payments, users, ui-components, storage, email
- `freshstart/CleanArchitectureMigration.md`

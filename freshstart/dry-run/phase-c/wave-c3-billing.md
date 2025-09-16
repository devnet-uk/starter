# Phase C · Wave C3 — Billing & Payments (Dry Run)

## Original Plan Excerpt

> ### Wave C3: Billing & Payments
>
> **Scope**
> - Entities: Subscription, Invoice, PaymentMethod, UsageRecord
> - Integrations: Stripe, LemonSqueezy, Polar, Creem via interface contracts
> - Use cases: Plan changes, seat adjustments, webhook normalization
>
> **Deliverables**
> - Provider-agnostic billing service interfaces + domain event handlers
> - Pricing/seat calculators as pure domain services
> - Reconciliation logic + tests for proration and seat sync
>
> **Commit Point**
> ```bash
> git add packages/core packages/contracts tests/
> git commit -m "feat(phase-c): billing domain wave complete"
> ```

## Dry-Run Command Plan

1. `Claude: /create-spec "Billing domain wave — subscription lifecycle, provider abstraction, reconciliation. Pull data from features/payments/specification.md and features/api/specification.md."`
   - Standards navigation: `features/payments/specification.md`, `features/api/specification.md`, `architecture/clean-architecture.md`, `testing-strategy.md`.
   - Variables: `DOMAIN_WAVE=billing`, `PROJECT_PHASE=phase-c`, `COVERAGE=100`.
2. `Claude: /create-tasks`
   - Expected tasks:
     - Implement billing entities (Subscription, Invoice, PaymentMethod, UsageRecord).
     - Create use cases for plan upgrades/downgrades, seat adjustments, webhook normalization.
     - Add provider-agnostic interfaces and event handlers for payment notifications.
     - Build pricing/seat calculators as pure domain services with tests.
     - Update contracts for billing DTOs and webhook payloads.
     - Allow `/execute-tasks` Step 6 to perform billing-specific verification.
3. `Claude: /execute-tasks`
   - Writes code, ensures proration/reconciliation logic covered by tests, and relies on standards verification for coverage and policy checks.

## Expected Outcome

- Billing domain capabilities fully modeled with provider abstractions.
- Contracts updated for billing endpoints/webhooks.
- Tests cover proration, seat sync, reconciliation edge cases.
- Domain verification passes; checkpoint/progress updated for Wave C3.
- Commit staged: `git add packages/core packages/contracts tests/` message `feat(phase-c): billing domain wave complete`.
- Standards-runner output documents coverage/policy checks.

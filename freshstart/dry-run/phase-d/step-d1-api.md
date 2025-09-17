# Phase D · Step D1 — API Delivery Alignment (Dry Run)

## Original Plan Excerpt

> ### Step D1: API Delivery Alignment
> ```claude
> Claude: /create-spec "API delivery — hono routes generated from contracts, validation middleware, integration tests"
> Claude: /create-tasks
> Claude: /execute-tasks
> ```
>
> **Deliverables**
> - Route files grouped by bounded context (auth, organizations, billing, platform)
> - Middleware stack: authentication, authorization, rate limiting, multi-tenant context
> - Contract synchronization job verifying schema drift (failing CI if mismatch)
> - Integration tests hitting in-memory adapters (swap to real adapters in Phase E)
>
> **Commit Point**
> ```bash
> git add packages/api tests/
> git commit -m "feat(phase-d): api delivery aligned to contracts"
> ```

## Dry-Run Command Plan

1. `Claude: /create-spec "API delivery — hono routes generated from contracts, validation middleware, integration tests. Reference features/auth/specification.md, features/organizations/specification.md, features/payments/specification.md, and features/api/specification.md for endpoint coverage."`
   - Standards navigation: `docs/standards/backend/hono.md`, `development/api-contracts.md`, `security/appsec.md`, `testing-strategy.md`.
   - Variables: `PROJECT_PHASE=phase-d`, `API_LAYER=hono`, `CONTRACT_SOURCE=packages/contracts`, `DEVNET_HOME=${DEVNET_HOME:-~/Projects/devnet}`, `DEVNET_GIT_REMOTE=${DEVNET_GIT_REMOTE:-git@github.com:your-org/devnet.git}`.
2. `Claude: /create-tasks`
   - Expected tasks:
     - Run workspace guard (ensure `pwd` equals ``${DEVNET_HOME}`` and origin matches ``${DEVNET_GIT_REMOTE}``).
     - Generate or implement Hono route handlers per bounded context using contract schemas.
     - Configure middleware stack (auth, RBAC, rate limiting, tenant context).
     - Implement contract drift check (script comparing contracts vs runtime schemas) integrated into CI.
     - Write integration tests against in-memory adapters to validate endpoints.
     - Ensure `/execute-tasks` verification covers integration tests and drift detection per standards.
3. `Claude: /execute-tasks`
   - Applies routing changes, configures middleware, and relies on the verification runner for test/drift enforcement.

## Expected Outcome

- API routes aligned with contracts and validated at runtime.
- Middleware enforcing security/multitenancy in place.
- Contract drift automation ready and wired into CI.
- Integration test suite green; progress updated.
- Commit staged: `git add packages/api tests/` message `feat(phase-d): api delivery aligned to contracts`.
- Standards-driven verification captures integration test + drift results.

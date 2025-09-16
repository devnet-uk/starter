# Phase C · Wave C1 — Authentication & Identity (Dry Run)

## Original Plan Excerpt

> ### Wave C1: Authentication & Identity
>
> **Scope**
> - Entities: User, Session, Credential, MFA Device
> - Use cases: Sign-up, Sign-in, Passkey enrollment, Password reset, Session rotation
> - Events: `UserRegistered`, `UserAuthenticated`, `MfaChallengeRequested`
>
> **Deliverables**
> - Domain services for password hashing + MFA policy (interface-based)
> - Contract-aligned DTO mappers (core ↔ contracts)
> - Test suites covering success/error paths, guard clauses, event emission
>
> **Commit Point**
> ```bash
> git add packages/core packages/contracts tests/
> git commit -m "feat(phase-c): authentication domain wave complete"
> ```

## Dry-Run Command Plan

1. `Claude: /create-spec "Authentication domain wave — entities, MFA policies, contract mappers. Load requirements from features/auth/specification.md and features/users/specification.md."`
   - Standards navigation: `architecture/clean-architecture.md`, `architecture/domain-verification.md`, `features/auth/specification.md`, `features/users/specification.md`, `testing-strategy.md`.
   - Variables: `PROJECT_PHASE=phase-c`, `DOMAIN_WAVE=authentication`, `COVERAGE=100`.
2. `Claude: /create-tasks`
   - Expected tasks:
     - Implement entities and aggregates for User, Session, Credential, MFA Device within `packages/core`.
     - Define use cases (sign-up, sign-in, passkey enrollment, password reset, session rotation) with interface-driven dependencies.
     - Emit domain events for authentication flows.
     - Update contracts (DTOs, request/response) accordingly.
     - Create comprehensive tests (unit + integration) with guard clauses and event assertions.
     - Ensure in-memory repositories or fakes exist for use cases.
     - Note that `/execute-tasks` Step 6 will run the Clean Architecture verification blocks.
3. `Claude: /execute-tasks`
   - Executes implementation and relies on standards-driven verification (coverage 100%, domain purity) via Step 6.

## Expected Outcome

- Authentication domain models and use cases implemented with 100% coverage.
- Contract mappings align with implemented DTOs.
- In-memory adapters available for downstream layers.
- Domain verification (no framework imports, value object immutability, etc.) passes.
- Commit staged: `git add packages/core packages/contracts tests/` message `feat(phase-c): authentication domain wave complete`.
- Standards verification confirms 100% coverage and domain purity; checkpoint reflects completion.

# Phase C · Wave C2 — Organizations & Collaboration (Dry Run)

## Original Plan Excerpt

> ### Wave C2: Organizations & Collaboration
>
> **Scope**
> - Entities: Organization, Member, Invitation, Role
> - Use cases: Org creation, member invite/accept, role assignment, org context switching
> - Policies: Seat limits, owner/admin/member permissions
>
> **Deliverables**
> - RBAC policy service with contract-driven roles
> - Domain events for invitations + membership changes
> - Aggregates enforcing membership invariants
>
> **Commit Point**
> ```bash
> git add packages/core packages/contracts tests/
> git commit -m "feat(phase-c): organization domain wave complete"
> ```

## Dry-Run Command Plan

1. `Claude: /create-spec "Organization domain wave — RBAC, invitations, membership invariants. Use features/organizations/specification.md and features/users/specification.md as inputs."`
   - Standards navigation: `features/organizations/specification.md`, `features/users/specification.md`, `architecture/clean-architecture.md`, `testing-strategy.md`.
   - Variables: `DOMAIN_WAVE=organizations`, `PROJECT_PHASE=phase-c`, `COVERAGE=100`.
2. `Claude: /create-tasks`
   - Expected tasks:
     - Model Organization, Member, Invitation aggregates with invariants.
     - Implement use cases for creation, invitation, acceptance, role assignment, context switching.
     - Define RBAC policy service referencing contract roles.
     - Emit domain events for membership changes.
     - Expand contracts with organization DTOs; update tests accordingly.
     - Rely on `/execute-tasks` Step 6 to execute the RBAC verification blocks.
3. `Claude: /execute-tasks`
   - Implements logic, ensures tests cover permissions and seat policies, and captures standards verification output.

## Expected Outcome

- Organization domain features complete with RBAC enforcement and events.
- Contracts synchronized with new DTOs/policies.
- In-memory adapters updated to support organization flows.
- Coverage and domain verification remain at 100% through standards execution.
- Commit staged: `git add packages/core packages/contracts tests/` message `feat(phase-c): organization domain wave complete`.
- `/execute-tasks` output documents the verification results.

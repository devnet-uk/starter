# Phase C · Wave C4 — Platform Services & Shared Capabilities (Dry Run)

## Original Plan Excerpt

> ### Wave C4: Platform Services & Shared Capabilities
>
> **Scope**
> - Entities/VOs: AI Chat Session, StorageObject, EmailNotification, AuditLogEntry
> - Use cases: Conversation lifecycle, file handling, email dispatch scheduling, audit logging
> - Cross-cutting: Rate limiting policies, tenant isolation guards
>
> **Deliverables**
> - Abstractions for AI providers, storage, email, and logging
> - Guarded value objects (tenant IDs, resource IDs, quotas)
> - Consolidated domain events library for platform integrations
>
> **Commit Point**
> ```bash
> git add packages/core packages/contracts tests/
> git commit -m "feat(phase-c): platform services domain wave complete"
> ```

## Dry-Run Command Plan

1. `Claude: /create-spec "Platform services domain wave — AI chat, storage, email, audit logging. Reference features/ui-components/specification.md, features/storage/specification.md, features/email/specification.md, and features/api/specification.md."`
   - Standards navigation: `features/ui-components/specification.md`, `features/storage/specification.md`, `features/email/specification.md`, `features/api/specification.md`, `architecture/clean-architecture.md`.
   - Variables: `DOMAIN_WAVE=platform`, `PROJECT_PHASE=phase-c`, `COVERAGE=100`, `DEVNET_HOME=${DEVNET_HOME:-~/Projects/devnet}`, `DEVNET_GIT_REMOTE=${DEVNET_GIT_REMOTE:-git@github.com:your-org/devnet.git}`.
2. `Claude: /create-tasks`
   - Expected tasks:
     - Run workspace guard (ensure `pwd` equals ``${DEVNET_HOME}`` and origin matches ``${DEVNET_GIT_REMOTE}``).
     - Implement domain abstractions for AI sessions, storage objects, email notifications, audit logs.
     - Create cross-cutting value objects (tenant IDs, resource IDs, quota guards).
     - Define use cases for conversation lifecycle, file handling, email dispatch scheduling, audit logging.
     - Establish rate limiting / isolation policies within domain rules.
     - Update contracts to cover platform service DTOs.
     - Add comprehensive tests and ensure in-memory adapters.
     - Let `/execute-tasks` Step 6 run the platform verification blocks.
3. `Claude: /execute-tasks`
   - Implements features and captures standards-based verification output.

## Expected Outcome

- Platform services domain layer completed with guardrails and abstractions.
- Contracts enriched for AI, storage, email, audit flows.
- Events catalog consolidated for downstream integration.
- Tests confirm tenant isolation, rate limiting, and quotas.
- Commit staged: `git add packages/core packages/contracts tests/` message `feat(phase-c): platform services domain wave complete`.
- Standards verification documents coverage/policy checks.

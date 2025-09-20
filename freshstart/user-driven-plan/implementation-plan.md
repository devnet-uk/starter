---
description: devnet user-guided dispatcher (self-hosting)
version: 0.1.0
last_updated: 2025-09-12
---

# DevNet Clean Architecture Migration — User-Driven Plan

This runbook rewrites the refined implementation plan so a human operator can drive each phase manually. Every phase document contains an **Agent Brief** and a **Manual Step Runner**. Copy those sections into your conversation with the assistant to give it the right context at the right time.

## How to Run This Plan Manually
- Open the target phase file under `freshstart/user-driven-plan/phases/`.
- Copy the **Agent Brief** block into the conversation to prime the assistant.
- Work through each numbered step in order. Every step shows the exact slash commands to paste and any supporting context to provide.
- Confirm deliverables/acceptance bullets before committing and moving to the next step.
- Record progress in `DEVNET-CHECKPOINT.txt` / `DEVNET-PROGRESS.md` after each phase exit gate.

## Conversation Pattern
Use the following interaction recipe for each implementation step:
1. Paste the **Agent Brief** (once per phase).
2. For each step, send the quoted instructions exactly as written. Most steps follow the pattern:
   ```
   /create-spec "<step description>"
   /create-tasks
   /execute-tasks
   ```
3. When the assistant asks for clarifications or produces tasks, respond and iterate until the deliverables enumerate as complete.
4. Apply the commit message suggested in the step once the assistant signals completion.

> Keep the slash commands intact. They map to the same EOS automations as the refined plan; the difference is that you trigger them instead of the agent dispatcher.

## Phase Directory
| Phase | Scope | Quick-Start Instructions |
|-------|-------|--------------------------|
| **Phase A — Engineering OS Foundation** | Workspace bootstrap, tooling, EOS wiring | Open `phases/phase-a-foundation.md`, send the Agent Brief, then execute steps A1 → A3 |
| **Phase B — Architecture Spine** | Contracts, shared core, infrastructure interfaces | Open `phases/phase-b-architecture.md`, send the Agent Brief, then run steps B1 → B4 |
| **Phase C — Domain Capability Waves** | Domain services for Auth → Organizations → Billing → Platform | Open `phases/phase-c-domain.md`, pick the next wave section, follow C1 → C4 |
| **Phase D — Delivery Layers** | API adapters, Next.js feature slices, integration tests | Open `phases/phase-d-delivery.md`, follow D1 → D4 |
| **Phase E — Production Hardening & Enablement** | Observability, security, release ops, docs | Open `phases/phase-e-hardening.md`, run E1 → E3 |

## High-Level Milestones

| Milestone | Focus | Primary Outputs | Verification Gates |
|-----------|-------|-----------------|--------------------|
| **Phase A — Engineering OS Foundation** | Repo hygiene, tooling, automation | Hardened monorepo skeleton, EOS command wiring, standards routing | `pnpm verify:local`, `/execute-tasks` (standards: monorepo, typescript-config, biome, git-workflow) |
| **Phase B — Architecture Spine** | Contracts + core abstractions | `packages/contracts`, `packages/core`, dependency rule enforcement, shared platform services | `/create-spec` (contracts/core DSL), `/execute-tasks` (architecture/clean-architecture.md) |
| **Phase C — Domain Capability Waves** | Feature-domain use cases (Auth → Organizations → Billing → Platform) | Use-case modules with repositories + services, domain coverage = 100% | `/create-tasks` domain suites, `pnpm --filter @repo/core test`, EOS domain verification |
| **Phase D — Delivery Layers** | API + App delivery aligned to Feature-Sliced Design | Hono API controllers, Next.js feature slices, integration tests & contracts sync | `pnpm --filter @repo/api test`, `pnpm --filter @repo/web lint/test`, API ↔ contracts parity checks |
| **Phase E — Production Hardening & Enablement** | Observability, security, docs, release ops | Logging/telemetry, deployment automations, runbooks, QA automation | `pnpm verify:local`, `pnpm --filter @repo/web e2e`, documentation linting |

## Streams & Responsibilities
- **Tooling & Automation Stream**: Keeps EOS scripts, linting, type-checking, and verification runner green.
- **Domain & Contracts Stream**: Produces Zod contracts, aggregates, value objects, and application services.
- **Platform & Delivery Stream**: Implements API adapters, Next.js Feature-Sliced layers, and observability wiring.
- **Documentation & Change Management Stream**: Maintains ADRs, developer docs, and standards routing; documents environment variables.

## Standards & Verification
- Primary dispatcher: `docs/standards/standards.md`
- Architecture: `docs/standards/architecture/clean-architecture.md`, `integration-strategy.md`
- Development tooling: `docs/standards/development/monorepo-setup.md`, `typescript-config.md`, `biome-config.md`, `local-quality.md`, `testing-strategy.md`
- Frontend: `docs/standards/frontend/feature-sliced-design.md`, `nextjs.md`
- Security & Ops (Phase E): `docs/standards/security/`, `docs/standards/operations/`

## Manual Run Notes
- Set `DEVNET_EOS_AUTOMATE=true` locally before running EOS commands (`freshstart/refined-plan/ENV-VARS.md` documents the variables).
- Keep the refined plan (`freshstart/refined-plan/implementation-plan.md`) available for reference; the user-driven folder mirrors its logic but removes dispatcher automation.
- After every `/execute-tasks` completion, annotate `DEVNET-CHECKPOINT.txt` with the exit state and next action.
- Prefer collocated tests for new logic, and run `pnpm verify:local` plus scoped package checks before marking a step complete.

## Next Actions
1. Pick the active phase from the table above.
2. Open the corresponding phase document under `freshstart/user-driven-plan/phases/`.
3. Copy the Agent Brief into your conversation, then follow the Manual Step Runner instructions sequentially.
4. Update checkpoints and commit using the provided messages as each step lands.

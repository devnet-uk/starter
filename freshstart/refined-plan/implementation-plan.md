---
description: devnet refined dispatcher (self-hosting)
version: 0.2.0
last_updated: 2025-09-12
---

# DevNet Clean Architecture Migration — Refined Implementation Plan

## Dispatcher & Routing

Use this file as the entrypoint. Pick the correct phase via the plan-conditionals below (≤3 context hops).

<plan-conditional task-condition="phase-a|foundation|workspace|tooling" context-check="phase-a-routing">
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get Phase A from freshstart/refined-plan/phases/phase-a-foundation.md"
  </context_fetcher_strategy>
</plan-conditional>

<plan-conditional task-condition="phase-b|architecture|contracts|core" context-check="phase-b-routing">
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get Phase B from freshstart/refined-plan/phases/phase-b-architecture.md"
  </context_fetcher_strategy>
</plan-conditional>

<plan-conditional task-condition="phase-c|domain|use-cases|capability-waves" context-check="phase-c-routing">
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get Phase C from freshstart/refined-plan/phases/phase-c-domain.md"
  </context_fetcher_strategy>
</plan-conditional>

<plan-conditional task-condition="phase-d|delivery|api|frontend" context-check="phase-d-routing">
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get Phase D from freshstart/refined-plan/phases/phase-d-delivery.md"
  </context_fetcher_strategy>
</plan-conditional>

<plan-conditional task-condition="phase-e|hardening|security|operations" context-check="phase-e-routing">
  <context_fetcher_strategy>
    USE: @agent:context-fetcher
    REQUEST: "Get Phase E from freshstart/refined-plan/phases/phase-e-hardening.md"
  </context_fetcher_strategy>
</plan-conditional>

### Context Fetch Budget (≤3 hops)

1. Load manifest `freshstart/refined-plan/manifest.json` for phase metadata.
2. Fetch the target phase document and capture its `## Overview`.
3. Drill into any additional anchors within that same phase file.

## Purpose

This plan replaces the linear eight-phase roadmap with a leaner program that aligns execution with Engineering OS (EOS) practices, the comprehensive feature specifications in `features/`, and the clean-architecture migration strategy captured in `freshstart/CleanArchitectureMigration.md`. The sequence prioritizes establishing repeatable Engineering OS workflows first, then delivering contract-driven backend capabilities, followed by feature slices that surface through the API and Next.js client. Each phase is defined by measurable exit criteria that rely on EOS verification commands rather than ad-hoc checklists.

## High-Level Milestones

| Milestone | Focus | Primary Outputs | Verification Gates |
|-----------|-------|-----------------|--------------------|
| **Phase A — Engineering OS Foundation** | Repo hygiene, tooling, automation | Hardened monorepo skeleton, EOS command wiring, standards routing | `pnpm verify:local`, `/execute-tasks` (standards: monorepo, typescript-config, biome, git-workflow) |
| **Phase B — Architecture Spine** | Contracts + core abstractions | `packages/contracts`, `packages/core`, dependency rule enforcement, shared platform services | `/create-spec` (contracts/core DSL), `/execute-tasks` (architecture/clean-architecture.md) |
| **Phase C — Domain Capability Waves** | Feature-domain use cases (Auth → Organizations → Billing → Platform) | Use-case modules with repositories + services, domain coverage = 100% | `/create-tasks` domain suites, `pnpm --filter @repo/core test`, blocking EOS domain verification |
| **Phase D — Delivery Layers** | API + App delivery aligned to Feature-Sliced Design | Hono API controllers, Next.js feature slices, integration tests & contracts sync | `pnpm --filter @repo/api test`, `pnpm --filter @repo/web lint/test`, API ↔ contracts parity checks |
| **Phase E — Production Hardening & Enablement** | Observability, security, docs, release ops | Logging/telemetry, deployment automations, runbooks, QA automation | `pnpm verify:local`, `pnpm --filter @repo/web e2e`, documentation linting |

Parallel swimlanes run through each phase:
- **Quality & Coverage**: Maintain ≥98 coverage config, 100% on core/business modules, enforce via `/execute-tasks` runner.
- **Standards Alignment**: Use `docs/standards/standards.md` dispatcher to load ≤3 hops of relevant gates per step.
- **Change Control**: Conventional commits + checkpoint updates (`DEVNET-CHECKPOINT.txt`, `DEVNET-PROGRESS.md`) after every acceptance gate.

## Workstream Overview

1. **Tooling & Automation Stream** (Phases A→E): Keeps EOS scripts, linting, type-checking, and verification runner green. Owns Husky, lint-staged, CI templates, and `scripts/` automation updates.
2. **Domain & Contracts Stream** (Phases B→C): Produces Zod contracts, aggregates, value objects, and application services. Pulls requirements from `features/<domain>/specification.md`.
3. **Platform & Delivery Stream** (Phases D→E): Implements API adapters, Next.js Feature-Sliced layers, observability, deployment workflows, and experience polish.
4. **Documentation & Change Management Stream** (All phases): Maintains ADRs, developer docs, and standards routing; ensures new environment variables are documented in `.env.example` and `docs/standards` references.

Each stream must integrate with EOS tasks (`/create-spec`, `/create-tasks`, `/execute-tasks`) and log progress in `DEVNET-CHECKPOINT.txt`.

## Phase Summaries

- **Phase A** establishes the execution environment: workspace checks, pnpm/turbo configuration, Biome strictness, Husky hooks, coverage thresholds, and EOS automation scaffolding.
- **Phase B** carves the clean architecture spine, creating contract packages, base domain abstractions, shared kernel services, and platform-level modules (auth adapters, background job plumbing) without leaking framework code into core.
- **Phase C** iterates through four capability waves—Authentication, Organizations, Billing/Payments, and Platform Services (AI, storage, notifications)—mapping directly to the high-complexity areas in the feature specifications. Each wave finishes when the corresponding features’ acceptance tests and verification blocks pass.
- **Phase D** connects the domain spine to delivery: contract-synchronized Hono routes, Next.js Feature-Sliced reorganization, UI composition for prioritized journeys, and end-to-end integration covering API + frontend via Playwright.
- **Phase E** hardens for production: security audits, observability (logging, tracing, metrics), deployment automation, ops runbooks, and documentation migration.

## Standards & Verification Strategy

- **Primary dispatcher**: `docs/standards/standards.md`
- **Architecture**: `docs/standards/architecture/clean-architecture.md`, `integration-strategy.md`
- **Development tooling**: `docs/standards/development/monorepo-setup.md`, `typescript-config.md`, `biome-config.md`, `local-quality.md`, `testing-strategy.md`
- **Frontend**: `docs/standards/frontend/feature-sliced-design.md`, `nextjs.md`
- **Security & Ops** (Phase E): `docs/standards/security/`, `docs/standards/operations/`

Verification uses EOS runner sequences:

<user-action-required>
⚠️ USER ACTION: Run each EOS cycle by typing the commands below directly into Claude Code:

1. /create-spec "<phase-specific description with DSL routing and variable bindings>"
2. /create-tasks
3. /execute-tasks

If `DEVNET_EOS_AUTOMATE` is `true`, run:
   pnpm eos:run --spec "<phase-specific description with DSL routing and variable bindings>"
Otherwise, stick with the manual slash commands above.
</user-action-required>

Set `DEVNET_EOS_AUTOMATE=true` in your environment (see `freshstart/refined-plan/ENV-VARS.md`) when you want Claude to favor the CLI path by default.

After Claude completes the EOS run, confirm locally via `pnpm verify:local` and targeted package commands per phase.

## Feature Mapping

| Capability Wave | Source Specifications | Key Deliverables |
|-----------------|-----------------------|------------------|
| Authentication | `features/auth/specification.md` | Better-Auth integrations, session management, MFA flows, audit logs |
| Organizations | `features/organizations/specification.md`, `features/users/specification.md` | Multi-tenant management, invitations, RBAC |
| Billing & Payments | `features/payments/specification.md`, `features/api/specification.md` | Subscription lifecycle, seat billing, provider adapters |
| Platform Services | `features/ui-components/specification.md`, `features/storage/specification.md`, `features/email/specification.md` | UI kit, storage adapters, notifications, analytics |

## Deliverable Artifacts

- Updated plan artifacts under `freshstart/refined-plan/`
- Phase handoff checklists + acceptance gates within each phase file
- Updated checkpoint templates referencing the refined phase names
- ADR placeholders for major architecture decisions (Phase B onward)

## Control Documents & Runtime Configuration

- Primary references now live alongside this plan: `freshstart/refined-plan/ENV-VARS.md`, `manifest.json`, `plan-config.example.json`, and `status.example.yaml`.
- Legacy controls in `devnet-plan/` remain authoritative for historical phases; mirror changes across both sets only when shared automation depends on them.
- Update Engineering OS automation (preflight scripts, verification runners) to read the refined manifest/config paths so agents resolve Phase A–E without manual overrides.
- When initializing a session, copy `freshstart/refined-plan/status.example.yaml` into `DEVNET-CHECKPOINT.txt` / `DEVNET-PROGRESS.md` workflows to keep runtime state aligned with the refined roadmap.

## Next Actions

1. On restart, load this dispatcher and follow the plan-conditionals above to open the active phase.
2. Execute Phase A following `freshstart/refined-plan/phases/phase-a-foundation.md`
3. After each phase acceptance, update `DEVNET-CHECKPOINT.txt` and tag repository using conventional format (`v{major}.{minor}-phase-X-green`).
4. Keep original `devnet-plan/` intact for historical reference; all new updates occur in `freshstart/refined-plan/`.

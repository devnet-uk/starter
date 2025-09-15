# Phased Migration Roadmap

Approach: Short, verifiable phases. Each phase ends with blocking verification and a short checkpoint.

Phase 0 – Foundation and Baseline (1–2 days)
- Validate EOS standards structure passes (done)
- Record baseline: lint errors, test coverage, CWV metrics (manual capture)
- Outputs: Inventory (01), Compliance Matrix (02), Verification Plan (04)
- Exit criteria: Stakeholder sign-off on scope and priorities

Phase 1 – Governance & Local Quality Gates (2–3 days)
- Install Husky; add pre-commit: `biome ci .` + type-check; pre-push: tests
- Resolve Biome issues to achieve clean check
- Add PR template with EOS review checklist (security, architecture, code style)
- Exit criteria: Verification shim passes local-quality and biome checks; PRs blocked on lint

Phase 2 – Architecture Guardrails (3–5 days)
- Define layer map per package (domain/use-cases/controllers/infrastructure) – pragmatic for current structure
- Add architecture tests (`architecture/architecture-validation.md`) with Vitest
- Add dependency analysis script and wire to CI (non-blocking first)
- Exit criteria: Architecture tests green in CI; violations addressed or allowed with TODOs

Phase 3 – Security & Server Actions (4–6 days)
- Adopt next-safe-action; add client with Zod validation and middleware
- Migrate top 2 mutation flows (e.g., profile update, org management)
- Harden auth cookie/headers usage per standards; add error normalization
- Exit criteria: Selected flows run via next-safe-action; security checklist items green

Phase 4 – Stack-Specific Hardening (3–5 days)
- Drizzle audit: naming, indexes, `$onUpdate`, DTO generation; zod inference
- Hono: add error middleware, correlation IDs, consistent response envelope
- TanStack Query/Zustand patterns: keys, selectors, staleTime
- Exit criteria: Targeted patterns demonstrably in place (PR review + spot verifications)

Phase 5 – Performance & Observability (3–4 days)
- Add CWV reporting hooks; Next bundle analyzer; set initial budgets (non-blocking)
- Add minimal metrics: request timing, error categorization; log correlation
- Exit criteria: CWV metrics reported; budgets recorded; metrics visible in logs

Phase 6 – CI/CD Tightening (2–3 days)
- Add dependency scanning workflow
- Elevate dependency analysis + bundle budgets to soft gates; evaluate promotion to blocking later
- Exit criteria: CI runs full suite; soft gates produce artifacts/comments

Notes
- Durations are estimates; plan allows parallelization where safe
- Each phase ends with a brief checkpoint and ADR updates as required

Cross-cutting (applies to all phases)
- Maintain Feature Parity Matrix; do not cutover until 100% must-have items are Verified
- Enforce Quality Gates (01-quality-gates.md) as blocking checks where specified
- Update acceptance checklists (03-acceptance-checklists.md) and ADRs as decisions evolve

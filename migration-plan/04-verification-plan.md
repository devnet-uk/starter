# Verification Plan (Blocking Gates)

Purpose: Define how EOS verification is used to enforce migration acceptance criteria without network or destructive actions.

Runner and Modes
- Local shim: `node scripts/verification-shim.mjs --files=<path> --mode=blocking`
- Governance: safe commands only; no network; file system read-only for tests

Initial Targets and Status
- `development/git-workflow.md` – PASS (local run)
- `development/local-quality.md` – FAIL (husky_installed)
  - Fix: Install Husky; add pre-commit and pre-push hooks
- `development/biome-config.md` – FAIL (biome_check_passes)
  - Fix: Run Biome check locally; address issues; wire to hooks/CI
- `security/server-actions.md` – No tests found (standards-only); enforcement via code review + future verifications

Planned Verification Coverage
- Dev/CI
  - Git workflow: branch naming, conventional commits, protected branches
  - Local quality: pre-commit (lint/format/type-check), pre-push (tests)
  - Biome: `biome ci .` summary in CI; blocking on PRs
- Architecture
  - Add architecture tests per `architecture/architecture-validation.md` (vitest-based)
  - Dependency analysis script for layer violations
- Security
  - Server actions: next-safe-action middleware pattern checks (lint or custom verifications)
  - API surface: schema presence for handlers
- Stack-Specific
  - Drizzle: schema indexes, conventions, `$onUpdate`, DTO generation present
  - Hono: error middleware, correlation ID, consistent response envelope

Acceptance Criteria by Phase (see roadmap)
- Phase 1: Standards validation must pass; Husky installed; Biome check clean
- Phase 2: Architecture tests added and passing in CI
- Phase 3: Server action flows migrated with next-safe-action, verified via review checklist and targeted verifications
- Phase 4: Performance checks (bundle size budgets non-blocking), CWV instrumentation present

Notes
- We will keep verification strictly safe per `docs/EngineeringOS/dsl/verification/governance.md`.
- Blocking mode will halt workflows when critical standards fail, surfacing actionable messages and fix commands.


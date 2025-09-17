# Phase D · Step D3 — Integrated Experience Testing (Dry Run)

## Original Plan Excerpt

> ### Step D3: Integrated Experience Testing
> ```claude
> Claude: /create-spec "Integrated experience testing — playwright suites, contract ↔ client smoke checks, ci pipeline"
> Claude: /create-tasks
> Claude: /execute-tasks
> ```
>
> **Deliverables**
> - Playwright specs under `apps/web/tests/` for four core journeys
> - Test data seeding utilities referencing in-memory or test adapters
> - Turbo pipeline updates to run e2e with caching + artifacts
> - Checkpoint + documentation updates describing release-readiness
>
> **Commit Point**
> ```bash
> git add apps/web/tests turbo.json .github/workflows/
> git commit -m "test(phase-d): integrated experience suites added"
> ```

## Dry-Run Command Plan

1. `Claude: /create-spec "Integrated experience testing — playwright suites, contract ↔ client smoke checks, ci pipeline. Build journeys using features/auth/specification.md, features/organizations/specification.md, features/payments/specification.md, and features/ui-components/specification.md."`
   - Standards navigation: `docs/standards/testing/e2e.md`, `frontend/feature-sliced-design.md` (testing guidance), `operations/deployment.md` (CI hints).
   - Variables: `PROJECT_PHASE=phase-d`, `E2E_TOOL=playwright`, `DEVNET_HOME=${DEVNET_HOME:-~/Projects/devnet}`, `DEVNET_GIT_REMOTE=${DEVNET_GIT_REMOTE:-git@github.com:your-org/devnet.git}`.
2. `Claude: /create-tasks`
   - Expected tasks:
     - Run workspace guard (ensure `pwd` equals ``${DEVNET_HOME}`` and origin matches ``${DEVNET_GIT_REMOTE}``).
     - Author Playwright suites for authentication onboarding, organization management, billing checkout, AI chat baseline.
     - Build test data seeding/teardown utilities referencing in-memory adapters.
     - Update Turbo pipeline and GitHub Actions to run e2e tests with caching/artifacts.
     - Document release-readiness notes in checkpoint and docs.
     - Ensure standards-based `/execute-tasks` verification will cover e2e execution and artifact capture.
3. `Claude: /execute-tasks`
   - Implements tests, updates pipelines, and relies on `/execute-tasks` Step 6 to run Playwright suites and collect evidence.

## Expected Outcome

- Comprehensive Playwright suites covering the four primary journeys.
- Automation scripts/pipelines executing e2e suites reliably (local + CI).
- Checkpoint updated with e2e results and release-readiness summary.
- Commit staged: `git add apps/web/tests turbo.json .github/workflows/` message `test(phase-d): integrated experience suites added`.
- `/execute-tasks` output captures Playwright verification results.

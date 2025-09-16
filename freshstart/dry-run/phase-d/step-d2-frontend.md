# Phase D · Step D2 — Frontend Feature-Sliced Migration (Dry Run)

## Original Plan Excerpt

> ### Step D2: Frontend Feature-Sliced Migration
> ```claude
> Claude: /create-spec "Frontend FSD migration — reorganize Next.js app, implement prioritized journeys"
> Claude: /create-tasks
> Claude: /execute-tasks
> ```
>
> **Deliverables**
> - `apps/web/src` reorganized into FSD layers with barrel exports + absolute imports via `tsconfig.json`
> - Feature modules implementing requirements from `features/ui-components/`, `features/auth/`, `features/organizations/`
> - Storybook or UI preview pipeline updated (if applicable)
> - Component/unit tests verifying critical flows (Vitest/Testing Library)
>
> **Commit Point**
> ```bash
> git add apps/web/src tsconfig.json stories/
> git commit -m "feat(phase-d): frontend migrated to feature-sliced design"
> ```

## Dry-Run Command Plan

1. `Claude: /create-spec "Frontend FSD migration — reorganize Next.js app, implement prioritized journeys. Incorporate requirements from features/ui-components/specification.md, features/auth/specification.md, and features/organizations/specification.md."`
   - Standards navigation: `docs/standards/frontend/feature-sliced-design.md`, `frontend/nextjs.md`, relevant feature specs (`features/ui-components`, `auth`, `organizations`).
   - Variables: `PROJECT_PHASE=phase-d`, `FSD_ENFORCED=true`.
2. `Claude: /create-tasks`
   - Expected tasks:
     - Restructure `apps/web/src` into FSD layers (shared/entities/features/pages/processes/app).
     - Update `tsconfig.json` paths for absolute imports; adjust linting rules.
     - Implement prioritized journeys aligning to specs.
     - Update Storybook/config (if present) and adjust tests.
     - Note that `/execute-tasks` verification (lint/test pipelines) will come from standards guidance; run Storybook/build checks as referenced there.
3. `Claude: /execute-tasks`
   - Applies refactorings, updates tests and stories, and lets the standards-driven verification pipeline handle lint/test expectations, including Storybook if required.

## Expected Outcome

- Frontend reorganized per FSD with clean imports.
- Key journeys (auth onboarding, org management, billing surfaces) implemented or stubbed with integration to API.
- Test suites updated; lint/test commands pass.
- Commit staged: `git add apps/web/src tsconfig.json stories/` message `feat(phase-d): frontend migrated to feature-sliced design`.
- `/execute-tasks` output records lint/test (and Storybook, if applicable) verification.

# Phase D: Delivery Layers

## Overview

- Phase: Delivery Layers
- Coverage Target: 95%+ integration coverage on API + frontend feature slices; e2e smoke suites required for primary journeys
- Status: Starts after Phase C handoff
- Duration: 3 macro-steps (API delivery, Frontend FSD migration, Integrated experience tests)
- Next Phase: Phase E — Production Hardening & Enablement

## Prerequisites & Working Directory

**Required Workspaces**:
- Primary: `${DEVNET_HOME:-~/Projects/devnet/}`
- Secondary (reference): `${ENGINEERING_OS_HOME:-~/Projects/devnet.starter/}`

**Workspace Guard**
```bash
DEVNET_PATH="${DEVNET_HOME:-$HOME/Projects/devnet}"
REMOTE_EXPECTED="${DEVNET_GIT_REMOTE:-}"
ORIGIN_URL=""
if [ -d "$DEVNET_PATH/.git" ]; then
  ORIGIN_URL="$(cd "$DEVNET_PATH" && git config --get remote.origin.url 2>/dev/null)"
fi
if [ ! -d "$DEVNET_PATH/.git" ]; then
  echo "❌ $DEVNET_PATH is not initialized — complete prior phases before Phase D"
elif [ -n "$REMOTE_EXPECTED" ] && [ "$ORIGIN_URL" != "$REMOTE_EXPECTED" ]; then
  echo "❌ origin remote mismatch — set via: git -C $DEVNET_PATH remote set-url origin $REMOTE_EXPECTED"
else
  echo "✅ Workspace ready at $DEVNET_PATH"
fi
```

**Quick Workspace Check**
```bash
DEVNET_PATH="${DEVNET_HOME:-$HOME/Projects/devnet}"
if [ "$(pwd)" = "$(cd "$DEVNET_PATH" && pwd 2>/dev/null)" ]; then
  echo "✅"
else
  echo "❌ cd $DEVNET_PATH"
fi
```

**Phase Dependencies**
- Domain use cases and contracts from Phase C complete and stable
- In-memory adapters available for API scaffolding
- Frontend team briefed on Feature-Sliced Design (FSD) standards

## Phase Acceptance

- `packages/api` exposes contract-backed Hono routes with request/response validation generated from contracts
- `apps/web` reorganized to FSD structure (shared/entities/features/pages/processes/app) with updated import paths
- Playwright E2E specs green for Authentication onboarding, Organization management, Billing checkout, and AI chat baseline
- API + frontend integration tests run in CI (Turbo pipeline updated)
- `pnpm verify:local` plus targeted filters (`@repo/api`, `@repo/web`) succeed without flakiness

## Standards & Intents

- API delivery: `docs/standards/backend/hono.md`, `api-contracts.md`
- Frontend structure: `docs/standards/frontend/feature-sliced-design.md`, `nextjs.md`
- Testing: `docs/standards/testing/e2e.md`

## Implementation Steps

### Step D1: API Delivery Alignment

<user-action-required>
⚠️ USER ACTION: Type the following commands directly into Claude Code:

1. Copy and paste this command:
   /create-spec "API delivery — hono routes generated from contracts, validation middleware, integration tests. Reference features/auth/specification.md, features/organizations/specification.md, features/payments/specification.md, and features/api/specification.md for endpoint coverage."

2. After the spec is created, type:
   /create-tasks

3. Once tasks are generated, type:
   /execute-tasks
</user-action-required>

**Deliverables**
- Route files grouped by bounded context (auth, organizations, billing, platform)
- Middleware stack: authentication, authorization, rate limiting, multi-tenant context
- Contract synchronization job verifying schema drift (failing CI if mismatch)
- Integration tests hitting in-memory adapters (swap to real adapters in Phase E)
- Feature specs: `features/auth/specification.md`, `features/organizations/specification.md`, `features/payments/specification.md`, `features/api/specification.md`

**Validation**
- Follow the API delivery standards (Hono, contract alignment); `/execute-tasks` verification blocks cover integration tests and drift detection.

**Commit Point**
```bash
git add packages/api tests/
git commit -m "feat(phase-d): api delivery aligned to contracts"
```

### Step D2: Frontend Feature-Sliced Migration

<user-action-required>
⚠️ USER ACTION: Type the following commands directly into Claude Code:

1. Copy and paste this command:
   /create-spec "Frontend FSD migration — reorganize Next.js app, implement prioritized journeys. Incorporate requirements from features/ui-components/specification.md, features/auth/specification.md, and features/organizations/specification.md."

2. After the spec is created, type:
   /create-tasks

3. Once tasks are generated, type:
   /execute-tasks
</user-action-required>

**Deliverables**
- `apps/web/src` reorganized into FSD layers with barrel exports + absolute imports via `tsconfig.json`
- Feature modules implementing requirements from `features/ui-components/`, `features/auth/`, `features/organizations/`
- Storybook or UI preview pipeline updated (if applicable)
- Component/unit tests verifying critical flows (Vitest/Testing Library)
- Feature specs: `features/ui-components/specification.md`, `features/auth/specification.md`, `features/organizations/specification.md`

**Validation**
- Apply FSD/Next.js standards; `/execute-tasks` verification covers lint/test expectations. Run additional Storybook/build checks if standards require them.

**Commit Point**
```bash
git add apps/web/src tsconfig.json stories/
git commit -m "feat(phase-d): frontend migrated to feature-sliced design"
```

### Step D3: Integrated Experience Testing

<user-action-required>
⚠️ USER ACTION: Type the following commands directly into Claude Code:

1. Copy and paste this command:
   /create-spec "Integrated experience testing — playwright suites, contract ↔ client smoke checks, ci pipeline. Build journeys using features/auth/specification.md, features/organizations/specification.md, features/payments/specification.md, and features/ui-components/specification.md."

2. After the spec is created, type:
   /create-tasks

3. Once tasks are generated, type:
   /execute-tasks
</user-action-required>

**Deliverables**
- Playwright specs under `apps/web/tests/` for four core journeys
- Test data seeding utilities referencing in-memory or test adapters
- Turbo pipeline updates to run e2e with caching + artifacts
- Checkpoint + documentation updates describing release-readiness
- Feature specs: `features/auth/specification.md`, `features/organizations/specification.md`, `features/payments/specification.md`, `features/ui-components/specification.md`

**Validation**
- Use the E2E/testing standards to drive verification; `/execute-tasks` runs the Playwright checks and captures evidence as required.

**Commit Point**
```bash
git add apps/web/tests turbo.json .github/workflows/
git commit -m "test(phase-d): integrated experience suites added"
```

## Phase Closure

- Run `pnpm --filter @repo/web e2e` locally; attach results to `DEVNET-CHECKPOINT.txt`
- Update progress tracker and tag `v0.4.0-phase-d`

## References

- Feature specs: `features/ui-components/`, `features/auth/`, `features/organizations/`, `features/payments/`
- Standards: `docs/standards/frontend/feature-sliced-design.md`, `docs/standards/testing/e2e.md`

# Phase D: Delivery Layers (User-Driven)

## Agent Brief (copy/paste to start)
```
You are assisting with Phase D: Delivery Layers for the DevNet migration. We will connect the domain spine to delivery by shipping contract-backed Hono routes, migrating the Next.js app to Feature-Sliced Design, and adding integrated experience tests. Expect to reference API, auth, organizations, payments, ui-components specs. I will guide you step by step.
```

## Phase Overview
- Coverage target: ≥95% integration coverage across API + frontend feature slices; Playwright smoke journeys green
- Sequence: API delivery → Frontend FSD migration → Integrated experience tests
- Next phase: Phase E — Production Hardening & Enablement

## Prerequisites
- Phase C completion logged in `DEVNET-CHECKPOINT.txt`
- Domain modules provide in-memory adapters usable by API layer
- Frontend team familiar with Feature-Sliced Design standards

### Workspace Guard (optional)
```bash
DEVNET_PATH="${DEVNET_HOME:-$HOME/Projects/devnet}"
REMOTE_EXPECTED="${DEVNET_GIT_REMOTE:-}"
ORIGIN_URL=""
if [ -d "$DEVNET_PATH/.git" ]; then
  ORIGIN_URL="$(cd "$DEVNET_PATH" && git config --get remote.origin.url 2>/dev/null)"
fi
if [ ! -d "$DEVNET_PATH/.git" ]; then
  echo "❌ $DEVNET_PATH is not initialized — complete prior phases first"
elif [ -n "$REMOTE_EXPECTED" ] && [ "$ORIGIN_URL" != "$REMOTE_EXPECTED" ]; then
  echo "❌ origin remote mismatch — set via: git -C $DEVNET_PATH remote set-url origin $REMOTE_EXPECTED"
else
  echo "✅ Workspace ready at $DEVNET_PATH"
fi
```

## Acceptance Checklist
- `packages/api` exposes Hono routes aligned with contracts and request/response validation
- `apps/web` reorganized to Feature-Sliced Design layers with updated imports
- Playwright specs pass for Authentication onboarding, Organization management, Billing checkout, AI chat baseline
- API + frontend integration tests run in CI with Turbo pipeline updates
- `pnpm verify:local`, `pnpm --filter @repo/api test`, `pnpm --filter @repo/web lint`, and `pnpm --filter @repo/web test` all green

## Manual Step Runner

### Step D1: API Delivery Alignment
**Message to send:**
```
/create-spec "API delivery — hono routes generated from contracts, validation middleware, integration tests. Reference features/auth/specification.md, features/organizations/specification.md, features/payments/specification.md, and features/api/specification.md for endpoint coverage."
/create-tasks
/execute-tasks
```

**Key Deliverables**
- Route files grouped by bounded context (auth, organizations, billing, platform)
- Middleware stack for authn/z, rate limiting, multi-tenant context propagation
- Contract drift check integrated into CI (`pnpm --filter @repo/api validate:contracts` or equivalent)
- Integration tests hitting in-memory adapters

**Suggested Commit**
```
git add packages/api tests/
git commit -m "feat(phase-d): api delivery aligned to contracts"
```

### Step D2: Frontend Feature-Sliced Migration
**Message to send:**
```
/create-spec "Frontend FSD migration — reorganize Next.js app, implement prioritized journeys. Incorporate requirements from features/ui-components/specification.md, features/auth/specification.md, and features/organizations/specification.md."
/create-tasks
/execute-tasks
```

**Key Deliverables**
- `apps/web/src` reorganized into FSD layers with absolute import aliases
- Feature modules implementing journeys from auth, organizations, ui-components specs
- Component/unit tests covering critical flows; Storybook/scripts updated if applicable

**Suggested Commit**
```
git add apps/web/src tsconfig.json stories/
git commit -m "feat(phase-d): frontend migrated to feature-sliced design"
```

### Step D3: Integrated Experience Testing
**Message to send:**
```
/create-spec "Integrated experience testing — playwright suites, contract ↔ client smoke checks, ci pipeline. Build journeys using features/auth/specification.md, features/organizations/specification.md, features/payments/specification.md, and features/ui-components/specification.md."
/create-tasks
/execute-tasks
```

**Key Deliverables**
- Playwright specs under `apps/web/tests/` covering onboarding, org management, billing checkout, AI chat
- Test data seeding utilities (in-memory adapters or fixtures)
- Turbo + CI pipelines updated to run e2e with caching and artifact retention
- Checkpoint + documentation updates signaling release readiness

**Suggested Commit**
```
git add apps/web/tests turbo.json .github/workflows/
git commit -m "test(phase-d): integrated experience suites added"
```

## Phase Closure
- Run `pnpm --filter @repo/web e2e` locally and record artifacts in `DEVNET-CHECKPOINT.txt`
- Update progress tracker, tag release `v0.4.0-phase-d` (or similar)

## References
- `docs/standards/backend/hono.md`
- `docs/standards/development/api-contracts.md`
- `docs/standards/frontend/feature-sliced-design.md`
- `docs/standards/frontend/nextjs.md`
- `docs/standards/testing/e2e.md`
- Feature specs for auth, organizations, payments, ui-components

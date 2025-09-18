# Phase D: Delivery Layers — User Instructions

> **Duration**: 6-8 hours | **Goal**: Build API delivery and migrate frontend to Feature-Sliced Design

## Overview

Phase D connects your domain capabilities from Phase C to the user-facing layer. You'll build contract-validated API routes, reorganize the frontend for maintainability, and ensure the end-to-end user experience works perfectly across all domains.

**What you'll build:**
- **Step D1**: API Delivery with Hono routes (2-3 hours)
- **Step D2**: Frontend Feature-Sliced migration (3-4 hours)
- **Step D3**: End-to-end testing with Playwright (2-3 hours)

## Prerequisites Check

Before starting, verify Phase C is complete:

```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

echo "🔍 Phase C Prerequisites:"
echo "- Domain waves: $(find packages/core -name '*User*.ts' -o -name '*Org*.ts' -o -name '*Subscription*.ts' -o -name '*Chat*.ts' | wc -l | tr -d ' ') major entities"
echo "- Use case services: $(find packages/core -name '*UseCase*.ts' -o -name '*Service*.ts' | wc -l | tr -d ' ') services"
echo "- Repository interfaces: $(find packages/infrastructure -name '*Repository*.ts' | wc -l | tr -d ' ') interfaces"
echo "- Full build: $(pnpm build >/dev/null 2>&1 && echo '✅' || echo '❌')"
echo "- Domain tests: $(pnpm --filter @repo/core test >/dev/null 2>&1 && echo '✅' || echo '❌')"
echo "- Overall verification: $(pnpm verify:local >/dev/null 2>&1 && echo '✅' || echo '❌')"

# Check Phase C checkpoint
grep -A3 "Phase C" DEVNET-CHECKPOINT.txt 2>/dev/null || echo "❌ Missing Phase C checkpoint"
```

**Expected**: Multiple entities from all 4 waves, tests pass, verification succeeds

---

## Step D1: API Delivery Alignment

### Step D1.1: Create API Package with Hono Routes

**🔗 COPY THIS TO CLAUDE CODE:**

```
I'm implementing DevNet phase-d delivery API layer (Step D1).

PROJECT CONTEXT:
- Working directory: ${DEVNET_HOME:-~/Projects/devnet/}
- Goal: Expose domain capabilities through clean HTTP APIs using Hono framework
- Architecture: Contract-validated routes with comprehensive middleware stack
- Integration: Connect to domain use cases from Phase C

CURRENT STATUS: Phase C domain capabilities complete, starting Phase D delivery layers
SPECIFIC TASK: Execute Step D1 from phase-d-delivery.md

API ARCHITECTURE REQUIREMENTS:
**Primary Goal**: Create packages/api with Hono framework exposing domain capabilities

**Route Organization by Domain** (matching Phase C waves):
- routes/auth/ - Authentication and session management
- routes/organizations/ - Organization and membership management
- routes/billing/ - Subscription and payment management
- routes/platform/ - AI, storage, email, and audit services

**Middleware Stack Requirements**:
- Authentication middleware (session/JWT validation)
- Authorization middleware (RBAC integration from Wave C2)
- Rate limiting per tenant and endpoint
- Multi-tenant context extraction and validation
- Request/response validation using contracts schemas from Phase B
- Error handling with consistent HTTP status codes
- Logging with correlation IDs

**Integration Requirements**:
- Connect API routes to domain use cases from packages/core
- Use repository interfaces with in-memory implementations from Phase C
- Implement middleware enforcing business policies and security
- Contract synchronization job preventing schema drift (CI integration)

**Feature Specifications for Coverage**:
- features/auth/specification.md - Authentication endpoints
- features/organizations/specification.md - Organization management APIs
- features/payments/specification.md - Billing and subscription endpoints
- features/api/specification.md - General API patterns and error handling

**Quality Standards**:
- All routes must be contract-validated (Zod schemas from Phase B)
- 95%+ integration test coverage on API endpoints
- Security testing for authentication bypass prevention
- Contract drift detection in CI pipeline

INSTRUCTIONS:
Please execute the API delivery alignment following the DevNet phase-d delivery plan.

Run these commands in sequence:
1. /create-spec "API delivery — hono routes generated from contracts, validation middleware, integration tests. Reference features/auth/specification.md, features/organizations/specification.md, features/payments/specification.md, and features/api/specification.md for endpoint coverage."
2. /create-tasks
3. /execute-tasks

Create a production-ready API layer that safely exposes your domain capabilities with enterprise security patterns.
```

### Verification After D1

Run this to verify Step D1 completed successfully:

```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

echo "🔍 Step D1 API Verification:"
echo "- API package: $([ -d packages/api ] && [ -f packages/api/package.json ] && echo '✅' || echo '❌')"

if [ -d packages/api ]; then
  cd packages/api
  echo "- Route organization:"
  for domain in auth organizations billing platform; do
    if [ -d "src/routes/$domain" ] || find src -name "*$domain*" | grep -q route; then
      echo "  - $domain routes: ✅"
    else
      echo "  - $domain routes: ❌ missing"
    fi
  done

  echo "- Middleware:"
  echo "  - Authentication: $(find src -name '*auth*' -name '*middleware*' | wc -l | tr -d ' ') files"
  echo "  - Validation: $(find src -name '*validation*' -o -name '*validate*' | wc -l | tr -d ' ') files"
  echo "  - Rate limiting: $(find src -name '*rate*' -o -name '*limit*' | wc -l | tr -d ' ') files"

  cd ../..
fi

echo ""
echo "🧪 API Testing:"
pnpm --filter @repo/api build >/dev/null 2>&1 && echo "- API builds: ✅" || echo "- API builds: ❌"
pnpm --filter @repo/api test >/dev/null 2>&1 && echo "- API tests: ✅" || echo "- API tests: ❌"

echo "- Contract sync: $(find packages/api -name '*contract*' -o -name '*schema*' | wc -l | tr -d ' ') integration files"
```

**Expected**: API package with routes for all 4 domains, middleware, tests pass

### Step D1.2: Commit API Delivery

**🔗 COPY THIS TO CLAUDE CODE:**

```
I'm completing DevNet phase-d API delivery - committing Step D1.

TASK: Commit the API delivery layer implementation.

Please commit the API setup with this exact command structure:
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"
git add packages/api tests/ pnpm-workspace.yaml turbo.json
git commit -m "feat(phase-d): api delivery aligned to contracts"

Confirm the commit was successful and show API capabilities implemented.
```

---

## Step D2: Frontend Feature-Sliced Migration

### Step D2.1: Reorganize Frontend Architecture

**🔗 COPY THIS TO CLAUDE CODE:**

```
I'm implementing DevNet phase-d delivery frontend migration (Step D2).

PROJECT CONTEXT:
- Working directory: ${DEVNET_HOME:-~/Projects/devnet/}
- Goal: Migrate Next.js app to Feature-Sliced Design (FSD) architecture
- Purpose: Implement user interfaces for the 4 domain capability waves
- Integration: Connect frontend to API routes created in Step D1

CURRENT STATUS: API delivery complete, now migrating frontend architecture
SPECIFIC TASK: Execute Step D2 from phase-d-delivery.md

FRONTEND ARCHITECTURE REQUIREMENTS:
**FSD Reorganization**: Transform apps/web/src into Feature-Sliced Design layers:
- app/ - Application-level configuration and providers
- processes/ - Complex user workflows spanning multiple features
- pages/ - Next.js route pages composed from features
- features/ - Domain feature modules (auth, organizations, billing, platform)
- entities/ - Domain entity components and state
- shared/ - Shared UI components, utilities, and constants

**Feature Implementation by Domain** (matching Phase C waves):
**Authentication Features** (features/auth/specification.md):
- Login/register forms with validation
- MFA enrollment and challenge flows
- Password reset and account recovery
- Session management and security settings

**Organization Features** (features/organizations/specification.md):
- Organization creation and settings management
- Member invitation and management interfaces
- Role assignment and permission management
- Organization switching and context management

**Billing Features** (features/payments/specification.md):
- Subscription plan selection and management
- Payment method management
- Billing history and invoice viewing
- Usage and seat management interfaces

**Platform Features** (features/ui-components/specification.md):
- AI chat interface with conversation history
- File upload and management interfaces
- Notification preferences and history
- Audit log viewing and filtering

**Technical Requirements**:
- Update tsconfig.json for absolute imports and path mapping
- State management (TanStack Query, Zustand, or Context)
- Form handling with validation (React Hook Form + Zod)
- Responsive design with Tailwind CSS
- Error boundaries and loading states
- Connect to API endpoints from Step D1

**Quality Standards**:
- Component and unit tests for critical UI flows
- Accessibility compliance (ARIA labels, keyboard navigation)
- Performance optimization (code splitting, lazy loading)

INSTRUCTIONS:
Please execute the frontend FSD migration following the DevNet phase-d delivery plan.

Run these commands in sequence:
1. /create-spec "Frontend FSD migration — reorganize Next.js app, implement prioritized journeys. Incorporate requirements from features/ui-components/specification.md, features/auth/specification.md, and features/organizations/specification.md."
2. /create-tasks
3. /execute-tasks

Transform the frontend into a maintainable, feature-rich application showcasing your domain capabilities.
```

### Verification After D2

Run this to verify Step D2 completed successfully:

```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

echo "🔍 Step D2 Frontend Migration Verification:"
echo "- Web app: $([ -d apps/web ] && echo '✅' || echo '❌')"

if [ -d apps/web ]; then
  cd apps/web
  echo "- FSD Structure:"
  for layer in app processes pages features entities shared; do
    if [ -d "src/$layer" ]; then
      echo "  - $layer/: ✅ $(find src/$layer -name '*.tsx' -o -name '*.ts' | wc -l | tr -d ' ') files"
    else
      echo "  - $layer/: ❌ missing"
    fi
  done

  echo "- Feature Modules:"
  for feature in auth organizations billing platform; do
    if [ -d "src/features/$feature" ] || find src -path "*$feature*" -name "*.tsx" | head -1 >/dev/null; then
      echo "  - $feature: ✅"
    else
      echo "  - $feature: ❌ missing"
    fi
  done

  echo "- TypeScript config: $(grep -q '"paths"' tsconfig.json && echo '✅ path mapping' || echo '⚠️ check absolute imports')"

  cd ../..
fi

echo ""
echo "🧪 Frontend Testing:"
pnpm --filter @repo/web build >/dev/null 2>&1 && echo "- Web app builds: ✅" || echo "- Web app builds: ❌"
pnpm --filter @repo/web lint >/dev/null 2>&1 && echo "- Lint check: ✅" || echo "- Lint check: ⚠️ review warnings"

echo "- Component tests: $(find apps/web -name '*.test.tsx' -o -name '*.spec.tsx' | wc -l | tr -d ' ') test files"
```

**Expected**: All FSD layers present, feature modules for all 4 domains, build succeeds

### Step D2.2: Commit Frontend Migration

**🔗 COPY THIS TO CLAUDE CODE:**

```
I'm completing DevNet phase-d frontend migration - committing Step D2.

TASK: Commit the Feature-Sliced Design migration and UI implementation.

Please commit the frontend setup with this exact command structure:
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"
git add apps/web/src apps/web/tsconfig.json apps/web/package.json
git commit -m "feat(phase-d): frontend migrated to feature-sliced design"

Confirm the commit was successful and show frontend capabilities implemented.
```

---

## Step D3: Integrated Experience Testing

### Step D3.1: Implement End-to-End Testing

**🔗 COPY THIS TO CLAUDE CODE:**

```
I'm implementing DevNet phase-d delivery end-to-end testing (Step D3) - final step.

PROJECT CONTEXT:
- Working directory: ${DEVNET_HOME:-~/Projects/devnet/}
- Goal: Comprehensive E2E testing with Playwright for all user journeys
- Purpose: Validate complete user experience across API and frontend integration
- Coverage: All 4 core domain journeys with realistic user scenarios

CURRENT STATUS: API and Frontend complete, adding comprehensive E2E testing
SPECIFIC TASK: Execute Step D3 from phase-d-delivery.md

E2E TESTING REQUIREMENTS:
**Core User Journeys to Test**:
1. **Authentication Journey**: Sign-up, email verification, sign-in, MFA setup, password reset
2. **Organization Journey**: Create organization, invite members, assign roles, manage settings
3. **Billing Journey**: Select plan, add payment method, subscription management, billing history
4. **Platform Journey**: AI chat interactions, file upload, notification management

**Test Implementation Requirements**:
- Set up Playwright in apps/web/tests/ with proper configuration
- Create test utilities for data seeding and cleanup using in-memory adapters
- Implement page object models for maintainable tests
- Add authentication helpers for testing authenticated flows
- Create mock data generators for consistent test scenarios
- Visual regression testing for critical UI components

**Test Architecture**:
- Page Objects: Reusable page abstractions for UI interactions
- Test Data: Seeded test data using in-memory adapters from Phase C
- Utilities: Helper functions for authentication, navigation, assertions
- Fixtures: Consistent test setup and teardown
- Configuration: Environment-specific test settings

**Feature Specifications for Test Scenarios**:
- features/auth/specification.md - Authentication flow testing
- features/organizations/specification.md - Organization management testing
- features/payments/specification.md - Billing and subscription testing
- features/ui-components/specification.md - UI interaction testing

**Quality Requirements**:
- All tests run in isolated environments
- Test data seeding and cleanup for each test
- Cross-browser testing capability (Chrome, Firefox, Safari)
- Mobile responsiveness testing
- Performance assertions for critical paths
- Screenshot and video capture for failures

**CI Integration**:
- Turbo pipeline updates for E2E test execution
- Test result artifacts and reporting
- Parallel test execution with proper isolation
- Failure notification and debugging support

INSTRUCTIONS:
Please execute the integrated experience testing following the DevNet phase-d delivery plan.

Run these commands in sequence:
1. /create-spec "Integrated experience testing — playwright suites, contract ↔ client smoke checks, ci pipeline. Build journeys using features/auth/specification.md, features/organizations/specification.md, features/payments/specification.md, and features/ui-components/specification.md."
2. /create-tasks
3. /execute-tasks

Create comprehensive E2E testing that ensures your application works perfectly for real users across all domains.
```

### Verification After D3

Run this to verify Step D3 completed successfully:

```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

echo "🔍 Step D3 E2E Testing Verification:"

if [ -d apps/web/tests ]; then
  cd apps/web
  echo "- Test directory: ✅ apps/web/tests/"
  echo "- Playwright config: $([ -f playwright.config.ts ] || [ -f playwright.config.js ] && echo '✅' || echo '❌')"
  echo "- Test files: $(find tests -name '*.spec.ts' -o -name '*.test.ts' | wc -l | tr -d ' ') test files"

  echo "- Domain coverage:"
  for domain in auth org billing platform; do
    if find tests -name "*$domain*" -o -name "*auth*" -o -name "*organization*" -o -name "*payment*" -o -name "*chat*" | head -1 >/dev/null; then
      echo "  - $domain: ✅"
    else
      echo "  - $domain: ❌ missing"
    fi
  done

  echo "- Test utilities:"
  echo "  - Page objects: $(find tests -name '*page*' -o -name '*po*' | wc -l | tr -d ' ') files"
  echo "  - Test helpers: $(find tests -name '*helper*' -o -name '*util*' | wc -l | tr -d ' ') files"

  cd ..
else
  echo "- Test directory: ❌ missing apps/web/tests/"
fi

echo ""
echo "🧪 E2E Test Execution:"
if pnpm --filter @repo/web e2e --version >/dev/null 2>&1; then
  echo "- Playwright installed: ✅"
else
  echo "- Playwright installed: ❌ missing"
fi

echo ""
echo "⚙️ CI Integration:"
if [ -f .github/workflows/e2e.yml ] || grep -r "e2e\|playwright" .github/workflows/ >/dev/null 2>&1; then
  echo "- CI pipeline: ✅ E2E tests in CI"
else
  echo "- CI pipeline: ⚠️ add E2E to CI workflow"
fi

grep -q "e2e" turbo.json && echo "- Turbo integration: ✅" || echo "- Turbo integration: ⚠️ add e2e task to turbo.json"
```

**Expected**: Test directory with Playwright, test files for all domains, CI integration

### Step D3.2: Final Commit & Phase Completion

**🔗 COPY THIS TO CLAUDE CODE:**

```
I'm completing DevNet phase-d delivery layers - final commit and phase validation.

TASKS:
1. Commit the E2E testing implementation
2. Validate complete Phase D delivery layers
3. Prepare Phase D completion documentation
4. Prepare for Phase E transition

Please execute:

1. Commit E2E testing:
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"
git add apps/web/tests/ playwright.config.* turbo.json .github/workflows/
git commit -m "test(phase-d): integrated experience suites added"

2. Run comprehensive Phase D validation:
- Verify API delivery layer working (packages/api)
- Confirm frontend FSD migration complete (apps/web)
- Validate E2E tests implemented for all core journeys
- Check full-stack integration (API ↔ Frontend)

3. Update checkpoint with Phase D completion:
- API delivery with Hono routes: Complete
- Frontend Feature-Sliced migration: Complete
- End-to-end testing with Playwright: Complete
- Full-stack integration verified: Complete

4. Create phase completion tag and show final status.

Confirm Phase D is complete and ready for Phase E production hardening.
```

---

## Phase D Completion

### Final Verification

Run this comprehensive check to confirm Phase D is complete:

```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

echo "🎯 Phase D Delivery Layers Verification:"
echo ""

# API Layer Verification
echo "🔌 API Delivery Layer:"
if [ -d packages/api ]; then
  echo "- API package: ✅ exists"
  echo "- Route coverage: $(find packages/api -name '*route*' -o -name '*controller*' | wc -l | tr -d ' ') route files"
  echo "- Middleware: $(find packages/api -name '*middleware*' | wc -l | tr -d ' ') middleware files"
  pnpm --filter @repo/api test >/dev/null 2>&1 && echo "- API tests: ✅" || echo "- API tests: ❌"
else
  echo "- API package: ❌ missing"
fi

# Frontend Layer Verification
echo ""
echo "🎨 Frontend Delivery Layer:"
if [ -d apps/web ]; then
  echo "- Web app: ✅ exists"
  echo "- FSD structure: $([ -d apps/web/src/features ] && [ -d apps/web/src/shared ] && echo '✅ Feature-Sliced Design' || echo '❌ missing FSD layers')"
  echo "- Feature modules: $(find apps/web/src/features -type d -mindepth 1 -maxdepth 1 2>/dev/null | wc -l | tr -d ' ') feature modules"
  pnpm --filter @repo/web build >/dev/null 2>&1 && echo "- Frontend builds: ✅" || echo "- Frontend builds: ❌"
else
  echo "- Web app: ❌ missing"
fi

# E2E Testing Verification
echo ""
echo "🧪 End-to-End Testing:"
if [ -d apps/web/tests ]; then
  echo "- Test suite: ✅ Playwright tests exist"
  echo "- Test coverage: $(find apps/web/tests -name '*.spec.ts' -o -name '*.test.ts' | wc -l | tr -d ' ') test files"
  pnpm --filter @repo/web e2e --version >/dev/null 2>&1 && echo "- Test runner: ✅" || echo "- Test runner: ⚠️ verify setup"
else
  echo "- Test suite: ❌ missing E2E tests"
fi

# Integration Verification
echo ""
echo "🔗 API ↔ Frontend Integration:"
echo "- Contract synchronization: $(find packages/api -name '*contract*' | wc -l | tr -d ' ') contract integrations"
echo "- API client: $(find apps/web -name '*api*' -o -name '*client*' | wc -l | tr -d ' ') client files"

# Overall System Test
echo ""
echo "🏁 Complete System Verification:"
pnpm build >/dev/null 2>&1 && echo "- Full build: ✅" || echo "- Full build: ❌"
pnpm test >/dev/null 2>&1 && echo "- All tests: ✅" || echo "- All tests: ⚠️ some failures"
pnpm lint >/dev/null 2>&1 && echo "- Lint check: ✅" || echo "- Lint check: ⚠️ warnings"
pnpm verify:local >/dev/null 2>&1 && echo "- Overall verification: ✅" || echo "- Overall verification: ❌"

# Progress tracking
echo ""
echo "📊 Progress Tracking:"
grep -q 'Phase D' DEVNET-CHECKPOINT.txt && echo "- Checkpoint updated: ✅" || echo "- Checkpoint updated: ❌"
[ $(git status --porcelain | wc -l) -eq 0 ] && echo "- Git state clean: ✅" || echo "- Git state clean: ❌"

echo ""
if pnpm build >/dev/null 2>&1 && [ $(git status --porcelain | wc -l) -eq 0 ]; then
  echo "🎉 Phase D Complete! Full-stack delivery layers implemented."
  echo ""
  echo "✅ What you've built:"
  echo "   • Contract-validated API routes with Hono framework"
  echo "   • Feature-Sliced Design frontend architecture"
  echo "   • Complete user interfaces for all 4 domain areas"
  echo "   • End-to-end testing covering critical user journeys"
  echo "   • API ↔ Frontend integration with proper error handling"
  echo ""
  echo "🚀 Your application is now fully functional with:"
  echo "   • Authentication and user management"
  echo "   • Organization and team collaboration"
  echo "   • Subscription billing and payments"
  echo "   • AI platform services and file management"
  echo ""
  echo "Next Steps:"
  echo "1. Proceed to Phase E: Production Hardening & Enablement"
  echo "2. Use phase-e-instructions.md for next steps"
else
  echo "❌ Phase D not complete. Review failed items above."
fi
```

### Phase D Acceptance Criteria

✅ **API Delivery**: Contract-backed Hono routes with authentication and validation
✅ **Frontend Migration**: Feature-Sliced Design architecture implemented
✅ **Domain UIs**: Complete user interfaces for auth, organizations, billing, platform
✅ **E2E Testing**: Playwright test suites covering all critical user journeys
✅ **Integration**: API ↔ Frontend working seamlessly with proper error handling
✅ **CI Pipeline**: Automated testing integrated into development workflow

### Troubleshooting

**Issue**: API routes not connecting to domain use cases
**Solution**: Verify dependency injection and repository interfaces are properly connected.

**Issue**: Frontend build failures after FSD migration
**Solution**: Check TypeScript path mapping in tsconfig.json and update import statements.

**Issue**: E2E tests failing or flaky
**Solution**: Review test data seeding, add proper wait conditions, check for race conditions.

**Issue**: Contract validation errors
**Solution**: Ensure API request/response schemas match contracts exactly.

---

## Next Phase

**🎉 Phase D Complete!**

**What you've accomplished:**
- ✅ **Secure APIs** exposing all domain capabilities
- ✅ **Modern Frontend** with maintainable Feature-Sliced architecture
- ✅ **Complete User Experience** covering authentication, organizations, billing, and platform features
- ✅ **Quality Assurance** with comprehensive E2E testing

You now have a fully functional full-stack application. Users can register, create organizations, manage subscriptions, and use AI platform services - all with proper security, validation, and error handling.

**👉 Next**: Proceed to **[Phase E: Production Hardening & Enablement](phase-e-instructions.md)** to make your application production-ready with monitoring, security hardening, deployment automation, and operational documentation.
# Phase D: Delivery Layers — User Instructions

> **Goal**: Build the API delivery layer with Hono routes and migrate frontend to Feature-Sliced Design, then add comprehensive E2E testing.

## Quick Context

You're now connecting your domain capabilities from Phase C to the user-facing layer. This involves building contract-validated API routes, reorganizing the frontend for maintainability, and ensuring the end-to-end user experience works perfectly across all domains.

**Duration**: 6-8 hours
**Prerequisites**: Phase C domain capabilities complete with all waves implemented
**Next Phase**: Phase E (Production Hardening & Enablement)

## Before You Start

### Phase C Completion Check
Copy and run this verification:

```bash
DEVNET_PATH="${DEVNET_HOME:-$HOME/Projects/devnet}"
cd "$DEVNET_PATH"

echo "🔍 Phase C Prerequisites Check:"
echo "- Working directory: $(pwd)"
echo "- Domain waves: $(find packages/core -name '*User*.ts' -o -name '*Org*.ts' -o -name '*Subscription*.ts' -o -name '*Chat*.ts' | wc -l | tr -d ' ') major entities"
echo "- Use case services: $(find packages/core -name '*UseCase*.ts' -o -name '*Service*.ts' | wc -l | tr -d ' ') services"
echo "- Repository interfaces: $(find packages/infrastructure -name '*Repository*.ts' | wc -l | tr -d ' ') interfaces"
echo "- Full build: $(pnpm build >/dev/null 2>&1 && echo '✅' || echo '❌')"
echo "- Domain tests: $(pnpm --filter @repo/core test >/dev/null 2>&1 && echo '✅' || echo '❌')"
echo "- Overall verification: $(pnpm verify:local >/dev/null 2>&1 && echo '✅' || echo '❌')"
echo ""

if [ -f DEVNET-CHECKPOINT.txt ]; then
  echo "📋 Last Phase C Status:"
  grep -A3 -B3 "Phase C" DEVNET-CHECKPOINT.txt || tail -5 DEVNET-CHECKPOINT.txt
else
  echo "❌ Missing DEVNET-CHECKPOINT.txt - ensure Phase C is complete"
fi
```

### Expected Output
- Should find multiple entities from all 4 domain waves
- All builds and tests should pass
- Domain capabilities should be complete and verified

---

## Step D1: API Delivery Alignment

### What You're Doing
Creating a `packages/api` package with Hono routes that expose your domain capabilities through contract-validated HTTP endpoints with authentication, authorization, and error handling.

### Copy This Into Claude Code:

```
Phase D, Step D1: API Delivery Alignment - exposing domain capabilities through clean HTTP APIs.

**Context**:
- Building the API delivery layer that exposes domain use cases from Phase C
- Using Hono framework for fast, type-safe API routes
- All routes must be contract-validated using schemas from packages/contracts
- Implementing proper middleware stack for authentication, authorization, rate limiting

**API Architecture Requirements**:
1. Create `packages/api` as new workspace package using Hono framework
2. Organize routes by bounded context (auth, organizations, billing, platform)
3. Implement comprehensive middleware stack:
   - Authentication middleware (session/JWT validation)
   - Authorization middleware (RBAC integration)
   - Rate limiting per tenant and endpoint
   - Multi-tenant context extraction and validation
   - Request/response validation using contracts schemas
4. Connect to domain use cases from packages/core
5. Use in-memory adapters from Phase C for testing
6. Add comprehensive integration tests

**Route Organization**:
Organize routes by domain matching Phase C waves:
- `routes/auth/` - Authentication and session management
- `routes/organizations/` - Organization and membership management
- `routes/billing/` - Subscription and payment management
- `routes/platform/` - AI, storage, email, and audit services

**Middleware Requirements**:
- **Authentication**: Validate user sessions and extract user context
- **Authorization**: Enforce RBAC policies based on organization membership
- **Rate Limiting**: Implement per-user and per-tenant rate limits
- **Validation**: Strict request/response validation using Zod schemas from contracts
- **Error Handling**: Consistent error responses with proper HTTP status codes
- **Logging**: Request/response logging with correlation IDs

**Feature Specifications for API Coverage**:
- `features/auth/specification.md` - Authentication endpoints and flows
- `features/organizations/specification.md` - Organization management APIs
- `features/payments/specification.md` - Billing and subscription endpoints
- `features/api/specification.md` - General API patterns, rate limiting, error handling

**Quality Standards**:
- All API routes must be contract-validated (request/response schemas)
- 95%+ integration test coverage on API endpoints
- Contract synchronization job to prevent schema drift (CI integration)
- Comprehensive error handling with proper HTTP status codes
- Security testing for authentication bypass and authorization violations

**Integration Requirements**:
- Connect API routes to domain use cases from packages/core
- Use repository interfaces with in-memory implementations from Phase C
- Implement middleware that enforces business policies and security
- Set up contract drift detection (CI job that fails if API doesn't match contracts)

**Deliverables**:
- `packages/api` with Hono framework setup
- Route files organized by bounded context with proper middleware
- Authentication and authorization middleware integrated with domain
- Rate limiting and tenant isolation middleware
- Integration tests covering all major endpoints
- Contract synchronization verification
- Error handling and logging middleware

Create a production-ready API layer that safely exposes your domain capabilities with enterprise security patterns.
```

### Verify Success:
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
  echo "  - Authentication: $(find src -name '*auth*' -name '*middleware*' -o -name '*auth*.ts' | grep -v route | wc -l | tr -d ' ') files"
  echo "  - Validation: $(find src -name '*validation*' -o -name '*validate*' | wc -l | tr -d ' ') files"
  echo "  - Rate limiting: $(find src -name '*rate*' -o -name '*limit*' | wc -l | tr -d ' ') files"

  cd ../..
fi

echo ""
echo "🧪 API Testing:"
if pnpm --filter @repo/api build >/dev/null 2>&1; then
  echo "- API builds: ✅"
else
  echo "- API builds: ❌ compilation issues"
fi

if pnpm --filter @repo/api test >/dev/null 2>&1; then
  echo "- API tests: ✅ integration tests pass"
else
  echo "- API tests: ❌ test failures"
fi

# Contract synchronization check
echo "- Contract sync: $(find packages/api -name '*contract*' -o -name '*schema*' | wc -l | tr -d ' ') integration files"
```

### Expected Output
- API package should exist with proper structure
- Should find route files for all 4 domains
- Should have authentication, validation, and rate limiting middleware
- Build and tests should pass

### Commit Checkpoint
```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"
git add packages/api tests/ pnpm-workspace.yaml turbo.json
git commit -m "feat(phase-d): api delivery aligned to contracts"
```

---

## Step D2: Frontend Feature-Sliced Migration

### What You're Doing
Reorganizing the Next.js frontend from the current structure to Feature-Sliced Design (FSD) architecture and implementing the user interfaces for your domain capabilities.

### Copy This Into Claude Code:

```
Phase D, Step D2: Frontend Feature-Sliced Migration - reorganizing Next.js app for maintainability and implementing domain UIs.

**Context**:
- Migrating existing Next.js app to Feature-Sliced Design (FSD) architecture
- Implementing user interfaces for the 4 domain capability waves from Phase C
- Connecting frontend to the API routes created in Step D1
- Focus on component organization, state management, and user experience

**FSD Architecture Requirements**:
Reorganize `apps/web/src` into FSD layers:
1. **app/** - Application-level configuration and providers
2. **processes/** - Complex user workflows spanning multiple features
3. **pages/** - Next.js route pages composed from features
4. **features/** - Domain feature modules (auth, organizations, billing, platform)
5. **entities/** - Domain entity components and state
6. **shared/** - Shared UI components, utilities, and constants

**Feature Implementation Requirements**:
Implement user interfaces for each domain wave:

**Authentication Features** (from `features/auth/specification.md`):
- Login/register forms with validation
- MFA enrollment and challenge flows
- Password reset and account recovery
- Session management and security settings

**Organization Features** (from `features/organizations/specification.md`):
- Organization creation and settings management
- Member invitation and management interfaces
- Role assignment and permission management
- Organization switching and context management

**Billing Features** (from `features/payments/specification.md`):
- Subscription plan selection and management
- Payment method management
- Billing history and invoice viewing
- Usage and seat management interfaces

**Platform Features** (from `features/ui-components/specification.md`):
- AI chat interface with conversation history
- File upload and management interfaces
- Notification preferences and history
- Audit log viewing and filtering

**Technical Requirements**:
- Update `tsconfig.json` for absolute imports and path mapping
- Implement proper state management (TanStack Query, Zustand, or Context)
- Set up form handling with validation (React Hook Form + Zod)
- Implement responsive design with Tailwind CSS
- Add proper error boundaries and loading states
- Connect to API endpoints from Step D1

**Component Architecture**:
- Follow atomic design principles within FSD structure
- Create reusable UI components in shared/ui
- Implement feature-specific components in features/[domain]/ui
- Use composition patterns for complex interfaces
- Implement proper TypeScript interfaces for all components

**State Management Integration**:
- API client integration with contract types
- Optimistic updates for better UX
- Proper error handling and user feedback
- Loading and pending states for all async operations

**Quality Standards**:
- Component and unit tests for critical UI flows (React Testing Library)
- Accessibility compliance (ARIA labels, keyboard navigation)
- Performance optimization (code splitting, lazy loading)
- Storybook integration if applicable

**Deliverables**:
- Reorganized `apps/web/src` following FSD architecture
- Implemented feature modules for all 4 domain areas
- Updated routing and navigation
- Form handling and validation integration
- API client integration with proper error handling
- Component tests for critical user flows
- Responsive design implementation

Transform the frontend into a maintainable, feature-rich application that showcases your domain capabilities beautifully.
```

### Verify Success:
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

  echo "- TypeScript config: $(grep -q '"paths"' tsconfig.json && echo '✅ path mapping' || echo '⚠️  check absolute imports')"

  cd ../..
fi

echo ""
echo "🧪 Frontend Testing:"
if pnpm --filter @repo/web build >/dev/null 2>&1; then
  echo "- Web app builds: ✅"
else
  echo "- Web app builds: ❌ compilation issues"
fi

if pnpm --filter @repo/web lint >/dev/null 2>&1; then
  echo "- Lint check: ✅"
else
  echo "- Lint check: ⚠️  review warnings"
fi

echo "- Component tests: $(find apps/web -name '*.test.tsx' -o -name '*.spec.tsx' | wc -l | tr -d ' ') test files"
```

### Expected Output
- Should find all FSD layers (app, processes, pages, features, entities, shared)
- Should have feature modules for all 4 domains
- Build should succeed with TypeScript path mapping
- Should have component tests for critical flows

### Commit Checkpoint
```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"
git add apps/web/src apps/web/tsconfig.json apps/web/package.json
git commit -m "feat(phase-d): frontend migrated to feature-sliced design"
```

---

## Step D3: Integrated Experience Testing

### What You're Doing
Setting up comprehensive end-to-end testing with Playwright to verify that the complete user journeys work correctly across the API and frontend integration.

### Copy This Into Claude Code:

```
Phase D, Step D3: Integrated Experience Testing - comprehensive E2E testing for all user journeys.

**Context**:
- Creating Playwright E2E test suites that validate the complete user experience
- Testing the integration between frontend (Step D2) and API (Step D1)
- Covering all 4 core domain journeys with realistic user scenarios
- Setting up CI pipeline integration for automated testing

**E2E Test Coverage Requirements**:

**Core User Journeys to Test**:
1. **Authentication Journey**: Sign-up, email verification, sign-in, MFA setup, password reset
2. **Organization Journey**: Create organization, invite members, assign roles, manage settings
3. **Billing Journey**: Select plan, add payment method, subscription management, billing history
4. **Platform Journey**: AI chat interactions, file upload, notification management

**Test Implementation Requirements**:
1. Set up Playwright in `apps/web/tests/` with proper configuration
2. Create test utilities for data seeding and cleanup
3. Implement page object models for maintainable tests
4. Add authentication helpers for testing authenticated flows
5. Create mock data generators for consistent test scenarios
6. Implement visual regression testing for critical UI components

**Feature Specifications for Test Scenarios**:
- `features/auth/specification.md` - Authentication flow testing
- `features/organizations/specification.md` - Organization management testing
- `features/payments/specification.md` - Billing and subscription testing
- `features/ui-components/specification.md` - UI interaction testing

**Test Architecture**:
- **Page Objects**: Reusable page abstractions for UI interactions
- **Test Data**: Seeded test data using in-memory adapters
- **Utilities**: Helper functions for authentication, navigation, assertions
- **Fixtures**: Consistent test setup and teardown
- **Configuration**: Environment-specific test settings

**Test Scenarios by Domain**:

**Authentication Tests**:
- User registration with email verification
- Login with password and passkey flows
- MFA enrollment and challenge completion
- Password reset and account recovery
- Session management and logout

**Organization Tests**:
- Organization creation and initial setup
- Member invitation and acceptance flow
- Role assignment and permission verification
- Organization context switching
- Member removal and access revocation

**Billing Tests**:
- Subscription plan selection and checkout
- Payment method addition and verification
- Plan upgrade/downgrade with proration
- Invoice generation and payment tracking
- Subscription cancellation and reactivation

**Platform Tests**:
- AI chat conversation and history
- File upload, processing, and access
- Email notification delivery and preferences
- Audit log generation and viewing

**Quality Requirements**:
- All tests must run in isolated environments
- Test data seeding and cleanup for each test
- Cross-browser testing (Chrome, Firefox, Safari)
- Mobile responsiveness testing
- Performance assertions for critical paths
- Screenshot and video capture for failures

**CI Integration**:
- Turbo pipeline updates for E2E test execution
- Test result artifacts and reporting
- Parallel test execution with proper isolation
- Failure notification and debugging support

**Deliverables**:
- Playwright test suite in `apps/web/tests/`
- Page object models for all major UI flows
- Test data seeding utilities
- CI pipeline integration with test reporting
- Visual regression testing for critical components
- Performance and accessibility test coverage

Create comprehensive E2E testing that ensures your application works perfectly for real users across all domains.
```

### Verify Success:
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

# Check CI integration
echo ""
echo "⚙️  CI Integration:"
if [ -f .github/workflows/e2e.yml ] || grep -r "e2e\|playwright" .github/workflows/ >/dev/null 2>&1; then
  echo "- CI pipeline: ✅ E2E tests in CI"
else
  echo "- CI pipeline: ⚠️  add E2E to CI workflow"
fi

# Turbo integration
if grep -q "e2e" turbo.json; then
  echo "- Turbo integration: ✅"
else
  echo "- Turbo integration: ⚠️  add e2e task to turbo.json"
fi
```

### Expected Output
- Should find test directory with Playwright configuration
- Should have test files covering all 4 domains
- Should have page objects and test utilities
- CI pipeline should include E2E testing

### Final Commit Checkpoint
```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet/"
git add apps/web/tests/ playwright.config.* turbo.json .github/workflows/
git commit -m "test(phase-d): integrated experience suites added"
```

---

## Phase D Completion

### Comprehensive Delivery Verification
Run this complete verification of all delivery layers:

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

  if pnpm --filter @repo/api test >/dev/null 2>&1; then
    echo "- API tests: ✅ integration tests pass"
  else
    echo "- API tests: ❌ failing tests"
  fi
else
  echo "- API package: ❌ missing"
fi

# Frontend Layer Verification
echo ""
echo "🎨 Frontend Delivery Layer:"
if [ -d apps/web ]; then
  echo "- Web app: ✅ exists"
  echo "- FSD structure: $([ -d apps/web/src/features ] && [ -d apps/web/src/shared ] && echo '✅ Feature-Sliced Design' || echo '❌ missing FSD layers')"
  echo "- Feature modules: $(find apps/web/src/features -type d -mindepth 1 -maxdepth 1 | wc -l | tr -d ' ') feature modules"

  if pnpm --filter @repo/web build >/dev/null 2>&1; then
    echo "- Frontend builds: ✅"
  else
    echo "- Frontend builds: ❌ compilation issues"
  fi
else
  echo "- Web app: ❌ missing"
fi

# E2E Testing Verification
echo ""
echo "🧪 End-to-End Testing:"
if [ -d apps/web/tests ]; then
  echo "- Test suite: ✅ Playwright tests exist"
  echo "- Test coverage: $(find apps/web/tests -name '*.spec.ts' -o -name '*.test.ts' | wc -l | tr -d ' ') test files"

  # Try running a simple test check
  if pnpm --filter @repo/web e2e --version >/dev/null 2>&1; then
    echo "- Test runner: ✅ Playwright configured"
  else
    echo "- Test runner: ⚠️  verify Playwright setup"
  fi
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
echo "- Full build: $(pnpm build >/dev/null 2>&1 && echo '✅ all packages build' || echo '❌ build failures')"
echo "- All tests: $(pnpm test >/dev/null 2>&1 && echo '✅ unit/integration tests pass' || echo '⚠️  some test failures')"
echo "- Lint check: $(pnpm lint >/dev/null 2>&1 && echo '✅ code quality' || echo '⚠️  lint warnings')"
echo "- Type check: $(pnpm type-check >/dev/null 2>&1 && echo '✅ TypeScript clean' || echo '⚠️  type errors')"

# CI Pipeline Check
echo ""
echo "⚙️  CI/CD Pipeline:"
if [ -d .github/workflows ]; then
  echo "- CI workflows: $(find .github/workflows -name '*.yml' -o -name '*.yaml' | wc -l | tr -d ' ') workflow files"
  if grep -r "e2e\|test" .github/workflows/ >/dev/null 2>&1; then
    echo "- Test automation: ✅ tests in CI"
  else
    echo "- Test automation: ⚠️  add tests to CI"
  fi
else
  echo "- CI workflows: ⚠️  setup GitHub Actions"
fi

# Progress Tracking
echo ""
echo "📊 Progress Tracking:"
if grep -q 'Phase D' DEVNET-CHECKPOINT.txt; then
  echo "- Checkpoint updated: ✅ Phase D recorded"
else
  echo "- Checkpoint updated: ❌ update DEVNET-CHECKPOINT.txt"
fi

echo "- Git state: $([ $(git status --porcelain | wc -l) -eq 0 ] && echo '✅ clean' || echo '❌ uncommitted changes')"

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
  echo "   • CI pipeline integration for automated testing"
  echo ""
  echo "🚀 Your application is now fully functional with:"
  echo "   • Authentication and user management"
  echo "   • Organization and team collaboration"
  echo "   • Subscription billing and payments"
  echo "   • AI platform services and file management"
  echo ""
  echo "Next Steps:"
  echo "1. Return to the USER-EXECUTION-GUIDE.md"
  echo "2. Proceed to Phase E: Production Hardening & Enablement"
else
  echo "❌ Phase D not complete. Review failed items above."
  echo ""
  echo "Common fixes:"
  echo "- Ensure all 3 steps (API, Frontend, E2E) are committed"
  echo "- Run 'pnpm install' if there are build issues"
  echo "- Check TypeScript configuration for path mapping"
  echo "- Verify Playwright setup and test configuration"
fi
```

### Phase D Final Update
Update your progress checkpoint:

```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

# Final checkpoint update
echo "" >> DEVNET-CHECKPOINT.txt
echo "Phase D - Delivery Layers: COMPLETE" >> DEVNET-CHECKPOINT.txt
echo "- API delivery with Hono routes: ✅" >> DEVNET-CHECKPOINT.txt
echo "- Frontend Feature-Sliced migration: ✅" >> DEVNET-CHECKPOINT.txt
echo "- End-to-end testing with Playwright: ✅" >> DEVNET-CHECKPOINT.txt
echo "- Full-stack integration verified: ✅" >> DEVNET-CHECKPOINT.txt
echo "- Next: Phase E - Production Hardening" >> DEVNET-CHECKPOINT.txt
echo "$(date): Phase D acceptance criteria met" >> DEVNET-CHECKPOINT.txt

# Create phase tag
git add DEVNET-CHECKPOINT.txt DEVNET-PROGRESS.md
git commit -m "docs(phase-d): delivery layers implementation complete"
git tag v0.4.0-phase-d
```

### Run E2E Tests Locally
Before proceeding to Phase E, run your E2E tests to ensure everything works:

```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

# Start the development servers (you may need multiple terminals)
echo "🚀 Starting development servers..."
echo "Terminal 1: pnpm dev  # Start all services"
echo "Terminal 2: pnpm --filter @repo/web e2e  # Run E2E tests"
echo ""
echo "Or run headless:"
echo "pnpm --filter @repo/web e2e:ci"
```

### Phase D Acceptance Criteria
✅ **API Delivery**: Contract-backed Hono routes with authentication and validation
✅ **Frontend Migration**: Feature-Sliced Design architecture implemented
✅ **Domain UIs**: Complete user interfaces for auth, organizations, billing, platform
✅ **E2E Testing**: Playwright test suites covering all critical user journeys
✅ **Integration**: API ↔ Frontend working seamlessly with proper error handling
✅ **CI Pipeline**: Automated testing integrated into development workflow

### Rollback Procedure (If Needed)
To restart Phase D or specific steps:

```bash
cd "${DEVNET_HOME:-$HOME/Projects/devnet}"

# Reset to Phase C completion
git reset --hard v0.3.0-phase-c
git clean -fd

# Or reset specific step (example: restart from Step D2)
git reset --hard HEAD~4  # Adjust based on commits since D1
```

### Troubleshooting Common Issues

**Issue**: API routes not connecting to domain use cases
**Solution**: Verify dependency injection and repository interfaces are properly connected.

**Issue**: Frontend build failures after FSD migration
**Solution**: Check TypeScript path mapping in tsconfig.json and update import statements.

**Issue**: E2E tests failing or flaky
**Solution**: Review test data seeding, add proper wait conditions, check for race conditions.

**Issue**: Contract validation errors
**Solution**: Ensure API request/response schemas match contracts exactly.

---

**Phase D Complete!** 🚀

You now have a fully functional full-stack application with:
- **Secure APIs** exposing all domain capabilities
- **Modern Frontend** with maintainable Feature-Sliced architecture
- **Complete User Experience** covering authentication, organizations, billing, and platform features
- **Quality Assurance** with comprehensive E2E testing

**Next**: Return to [USER-EXECUTION-GUIDE.md](../USER-EXECUTION-GUIDE.md) and proceed to **Phase E: Production Hardening & Enablement** to make your application production-ready.
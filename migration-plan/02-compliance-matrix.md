# EOS Compliance Matrix (Current → Target)

Legend: Compliant (✅), Partial (🟡), Gap (❌)

Designing Systems (Architecture)
- Clean Architecture layering – ❌
  - Current: Feature- and package-based structure without explicit domain/use-case/controllers boundaries
  - Target: Enforce boundaries via directory structure or architecture tests; domain free of framework imports
  - Actions: Add arch tests (see `architecture/architecture-validation.md`), agree on layer map for each package
- Integration strategy (oRPC + Next API proxy) – 🟡
  - Current: Hono oRPC exposed through Next catch-all route; OpenAPI served
  - Target: Document boundary and error mapping; standardize DTOs; avoid domain leakage to controllers
  - Actions: Author ADR for API surface + transport, add input/output schemas, map errors centrally
- Value object mapping & mappers – 🟡
  - Current: Drizzle schemas present; value-object patterns not explicit
  - Target: Introduce value objects where applicable; mappers at boundaries
  - Actions: Identify top 3 domain entities for refactor pilot

Writing Code (Code Style)
- Biome formatting + lint rules – 🟡
  - Current: Root biome.json present; package-level configs exist; CI runs biome
  - Target: Blocking lint on PR + pre-commit; resolve current biome check failures
  - Actions: Install Husky + pre-commit, add `biome ci .`; fix errors
- TypeScript config standards – 🟡
  - Current: Centralized `@repo/tsconfig` used; path aliases used in app
  - Target: Align with standards `development/typescript-config.md` (strictness, incremental)
  - Actions: Audit `@repo/tsconfig/*` vs standards; tighten where safe
- React patterns – 🟡
  - Current: App Router, server components; mixed patterns
  - Target: Align with `code-style/react-patterns.md` (naming, composition, hooks)
  - Actions: Add component checklists to PR review template

Securing Applications (Security)
- Server Actions (next-safe-action) – ❌
  - Current: Not adopted; forms/components rely on client calls
  - Target: Adopt `next-safe-action` with Zod validation and middleware
  - Actions: Introduce safe action client; migrate 1-2 critical flows first (e.g., profile update)
- Authentication patterns – 🟡
  - Current: `better-auth` integrated across API and app
  - Target: Align with EOS auth patterns (cookie handling, CSRF, session hardening)
  - Actions: Review cookies/headers usage, add middleware, align error responses
- API security – 🟡
  - Current: Hono middleware, CORS, logging; OpenAPI generated
  - Target: Add schema validation at edges, rate-limits, input sanitization
  - Actions: Add schema guards; centralize error mapping; document trust boundaries
- Dependency scanning – 🟡
  - Current: Dependabot present
  - Target: Add periodic audit and SCA outputs to PRs
  - Actions: Add GH workflow per `security/dependency-scanning.md`

Configuring Tools (Dev/CI)
- Git workflow – 🟡
  - Current: Standards exist; no .husky; PR workflows in place
  - Target: Enforce branch naming, conventional commits, protected branches
  - Actions: Install Husky; add commit-msg hook; branch naming checks
- Local quality gates – ❌
  - Current: Verification shows Husky missing; biome check failing via shim
  - Target: Blocking pre-commit (lint/format/type-check), pre-push (tests)
  - Actions: Add `.husky/` with scripts; wire `pnpm -w type-check`
- Testing strategy – 🟡
  - Current: Playwright e2e; limited unit/integration tests visible
  - Target: Unit tests with Vitest; architecture tests; minimal integration tests
  - Actions: Add test scaffolds per `development/testing-strategy.md`

Using Libraries (Stack-Specific)
- Drizzle patterns – 🟡
  - Current: Schemas, queries; migrations via drizzle-kit; postgres-js client
  - Target: Follow EOS drizzle patterns (indexes, $onUpdate, DTOs)
  - Actions: Audit schema conventions, add zod generators, consistent repository patterns
- Hono API – 🟡
  - Current: Hono app proxied via Next
  - Target: Consistent error handling, auth middleware, logging correlation
  - Actions: Introduce error middleware; correlation IDs; standard response shape
- TanStack Query – 🟡
  - Current: Present in app
  - Target: Query keys, staleTime, error handling, suspense usage standards
  - Actions: Add query util wrappers; docs for patterns
- Zustand – 🟡
  - Current: Present
  - Target: Slice structure, selectors, persist boundaries
  - Actions: Apply EOS Zustand patterns
- Next Safe Action – ❌
  - Current: Not adopted
  - Target: Adopt for server action flows with validation and middleware
  - Actions: See Security section above

Optimizing Systems (Performance)
- Core Web Vitals – 🟡
  - Current: Not explicitly configured
  - Target: Monitoring and thresholds documented; Next analytics hooks
  - Actions: Add CWV reporting; track in CI dashboards
- Bundle optimization – 🟡
  - Current: Unknown baselines
  - Target: Analyze bundle; establish budget; lazy-load non-critical routes
  - Actions: Add Next bundle analyzer; budgets in CI (non-blocking initially)
- Observability – 🟡
  - Current: Logger present; no metrics/tracing noted
  - Target: Minimal metrics; request IDs; error categories
  - Actions: Add logs/metrics conventions; capture API timing

Summary Scores (initial)
- Architecture: 🟡
- Code Style: 🟡
- Security: 🟡 (server actions: ❌)
- Dev/CI: 🟡 (local gates: ❌)
- Stack-Specific: 🟡
- Performance: 🟡

